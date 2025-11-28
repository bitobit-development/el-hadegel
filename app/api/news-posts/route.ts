import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { NEWS_POST_CONSTRAINTS } from '@/types/news';
import { fetchOpenGraphData, isValidExternalUrl } from '@/lib/og-scraper';
import { revalidatePath } from 'next/cache';
import {
  sanitizeContent,
  sanitizeUrl,
  isSpam,
  hasExcessiveUrls,
  isValidImageUrl,
  getClientIp,
  isValidRequestSize,
} from '@/lib/security-utils';

// Validation schema
const createNewsPostSchema = z.object({
  content: z.string()
    .min(NEWS_POST_CONSTRAINTS.MIN_CONTENT_LENGTH, 'Content too short')
    .max(NEWS_POST_CONSTRAINTS.MAX_CONTENT_LENGTH, 'Content too long'),
  sourceUrl: z.string()
    .url('Invalid URL format')
    .max(NEWS_POST_CONSTRAINTS.MAX_URL_LENGTH, 'URL too long'),
  sourceName: z.string().optional(),
  postedAt: z.string().datetime().optional(),
});

/**
 * POST /api/news-posts
 * Create a new news post with automatic OG metadata scraping
 * Enhanced with comprehensive security measures
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(request);
    if (!authResult.authenticated || authResult.apiKeyId === undefined) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 },
        {
          headers: {
            'Access-Control-Allow-Origin': '*', // CORS
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          }
        }
      );
    }

    // 2. Rate limiting by API key
    const rateLimitResult = checkRateLimit(authResult.apiKeyId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.resetTime
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // 3. Check request size (prevent DoS)
    const bodyText = await request.text();
    if (!isValidRequestSize(bodyText)) {
      return NextResponse.json(
        { error: 'Request body too large (max 100KB)' },
        { status: 413 }
      );
    }

    // 4. Validate request body
    const body = JSON.parse(bodyText);
    const validatedData = createNewsPostSchema.parse(body);

    // 5. Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(validatedData.content);

    // Check for empty content after sanitization
    if (sanitizedContent.length < NEWS_POST_CONSTRAINTS.MIN_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: 'Content too short after sanitization' },
        { status: 400 }
      );
    }

    // 6. Spam detection
    if (isSpam(sanitizedContent) || hasExcessiveUrls(sanitizedContent)) {
      // Log suspicious activity
      console.warn('Spam detected from API key:', authResult.apiKeyId, 'IP:', getClientIp(request.headers));
      return NextResponse.json(
        { error: 'Content flagged as spam' },
        { status: 400 }
      );
    }

    // 7. Sanitize and validate URL for SSRF protection
    let sanitizedUrl: string;
    try {
      sanitizedUrl = sanitizeUrl(validatedData.sourceUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    if (!isValidExternalUrl(sanitizedUrl)) {
      return NextResponse.json(
        { error: 'Invalid or unsafe URL (SSRF protection)' },
        { status: 400 }
      );
    }

    // 8. Duplicate detection (same URL within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingPost = await prisma.newsPost.findFirst({
      where: {
        sourceUrl: sanitizedUrl,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (existingPost) {
      return NextResponse.json(
        {
          error: 'Duplicate post - this URL was already submitted recently',
          existingPostId: existingPost.id
        },
        { status: 409 } // 409 Conflict
      );
    }

    // 9. Scrape Open Graph metadata (with timeout and error handling)
    let ogData = null;
    try {
      ogData = await fetchOpenGraphData(sanitizedUrl);

      // Validate image URL if present
      if (ogData?.image && !isValidImageUrl(ogData.image)) {
        console.warn('Invalid image URL detected, skipping:', ogData.image);
        ogData.image = null;
      }
    } catch (error) {
      console.error('OG scraping failed (continuing without preview):', error);
      // Continue - post will be created without preview data
    }

    // 10. Create news post with sanitized and validated data
    const newsPost = await prisma.newsPost.create({
      data: {
        content: sanitizedContent,
        sourceUrl: sanitizedUrl,
        sourceName: validatedData.sourceName,
        postedAt: validatedData.postedAt
          ? new Date(validatedData.postedAt)
          : new Date(),

        // Add OG metadata (null if scraping failed)
        previewTitle: ogData?.title ? sanitizeContent(ogData.title) : null,
        previewImage: ogData?.image,
        previewDescription: ogData?.description ? sanitizeContent(ogData.description) : null,
        previewSiteName: ogData?.siteName ? sanitizeContent(ogData.siteName) : null,
      },
    });

    // 11. Log successful creation (for audit trail)
    console.log('News post created:', {
      id: newsPost.id,
      apiKeyId: authResult.apiKeyId,
      ip: getClientIp(request.headers),
      timestamp: new Date().toISOString(),
    });

    // 12. Trigger revalidation of landing page
    revalidatePath('/');

    // 13. Return success
    return NextResponse.json(
      {
        success: true,
        data: newsPost
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': (rateLimitResult.remaining - 1).toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.error('Error creating news post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/news-posts
 * Retrieve news posts with pagination (max 50)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10'), 1), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // 3. Fetch posts
    const [posts, total] = await Promise.all([
      prisma.newsPost.findMany({
        orderBy: { postedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.newsPost.count(),
    ]);

    // 4. Return data with CORS headers
    return NextResponse.json(
      {
        success: true,
        data: {
          posts,
          total,
          limit,
          offset,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60', // Cache for 60 seconds
        }
      }
    );

  } catch (error) {
    console.error('Error fetching news posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/news-posts
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

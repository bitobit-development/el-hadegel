import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
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
import { isRecruitmentLawComment } from '@/lib/content-hash';
import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service';
import { isCoalitionMember } from '@/lib/coalition-utils';
import { SOURCE_CREDIBILITY, COMMENT_PLATFORMS, SOURCE_TYPES } from '@/lib/comment-constants';

// Validation schema for creating historical comment
const createHistoricalCommentSchema = z.object({
  mkId: z.number().int().positive('Invalid MK ID'),
  content: z.string()
    .min(10, 'Content too short - minimum 10 characters')
    .max(5000, 'Content too long - maximum 5000 characters'),
  sourceUrl: z.string()
    .url('Invalid URL format')
    .max(2000, 'URL too long'),
  sourcePlatform: z.enum(['News', 'Twitter', 'Facebook', 'YouTube', 'Knesset', 'Interview', 'Other']),
  sourceType: z.enum(['Primary', 'Secondary']),
  sourceName: z.string().max(200).optional(),
  sourceCredibility: z.number().int().min(1).max(10).optional(),
  commentDate: z.string().datetime('Invalid date format - use ISO8601'),
  publishedAt: z.string().datetime('Invalid date format - use ISO8601').optional(),
  keywords: z.array(z.string()).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  videoUrl: z.string().url().max(2000).optional(),
  additionalContext: z.string().max(1000).optional(),
});

// Query parameters schema for GET requests
const getHistoricalCommentsSchema = z.object({
  mkId: z.number().int().positive().optional(),
  platform: z.string().optional(),
  verified: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['date', 'credibility']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * POST /api/historical-comments
 * Create a new historical comment with deduplication
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(request);
    if (!authResult.authenticated || authResult.apiKeyId === undefined) {
      return NextResponse.json(
        { error: 'אישור נדרש - מפתח API לא תקין' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          }
        }
      );
    }

    // 2. Rate limiting
    const rateLimitResult = checkRateLimit(authResult.apiKeyId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'חריגה ממגבלת קצב הבקשות',
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

    // 3. Check request size
    const bodyText = await request.text();
    if (!isValidRequestSize(bodyText)) {
      return NextResponse.json(
        { error: 'גודל הבקשה גדול מדי (מקסימום 100KB)' },
        { status: 413 }
      );
    }

    // 4. Validate request body
    const body = JSON.parse(bodyText);
    const validatedData = createHistoricalCommentSchema.parse(body);

    // 5. Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(validatedData.content);
    if (sanitizedContent.length < 10) {
      return NextResponse.json(
        { error: 'תוכן קצר מדי לאחר סינון אבטחה' },
        { status: 400 }
      );
    }

    // 6. Spam detection
    if (isSpam(sanitizedContent) || hasExcessiveUrls(sanitizedContent)) {
      console.warn('Spam detected from API key:', authResult.apiKeyId, 'IP:', getClientIp(request.headers));
      return NextResponse.json(
        { error: 'תוכן מסומן כספאם' },
        { status: 400 }
      );
    }

    // 7. Validate and sanitize URLs
    let sanitizedUrl: string;
    try {
      sanitizedUrl = sanitizeUrl(validatedData.sourceUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'כתובת URL לא תקינה' },
        { status: 400 }
      );
    }

    // Validate optional image/video URLs
    if (validatedData.imageUrl) {
      try {
        const sanitizedImageUrl = sanitizeUrl(validatedData.imageUrl);
        if (!isValidImageUrl(sanitizedImageUrl)) {
          return NextResponse.json(
            { error: 'כתובת URL של תמונה לא תקינה' },
            { status: 400 }
          );
        }
        validatedData.imageUrl = sanitizedImageUrl;
      } catch (error) {
        return NextResponse.json(
          { error: 'כתובת URL של תמונה לא תקינה' },
          { status: 400 }
        );
      }
    }

    if (validatedData.videoUrl) {
      try {
        validatedData.videoUrl = sanitizeUrl(validatedData.videoUrl);
      } catch (error) {
        return NextResponse.json(
          { error: 'כתובת URL של וידאו לא תקינה' },
          { status: 400 }
        );
      }
    }

    // 8. Verify MK exists
    const mk = await prisma.mK.findUnique({
      where: { id: validatedData.mkId },
      select: { id: true, nameHe: true, faction: true },
    });

    if (!mk) {
      return NextResponse.json(
        { error: `חבר כנסת עם מזהה ${validatedData.mkId} לא נמצא` },
        { status: 404 }
      );
    }

    // 9. Verify MK is coalition member
    if (!isCoalitionMember(mk.faction)) {
      return NextResponse.json(
        {
          error: `חבר הכנסת ${mk.nameHe} אינו חלק מהקואליציה - מערכת זו מיועדת רק לחברי קואליציה`,
          mkName: mk.nameHe,
          faction: mk.faction
        },
        { status: 400 }
      );
    }

    // 10. Validate content is recruitment law related
    const contentCheck = isRecruitmentLawComment(sanitizedContent);
    if (!contentCheck.matches) {
      return NextResponse.json(
        {
          error: 'התוכן אינו קשור לחוק הגיוס - נא להזין תוכן הכולל מילות מפתח רלוונטיות',
          hint: 'התוכן צריך לכלול לפחות אחת ממילות המפתח: חוק גיוס, גיוס חרדים, recruitment law, וכו׳'
        },
        { status: 400 }
      );
    }

    // 11. Prepare keywords (use detected keywords if not provided)
    const keywords = validatedData.keywords || contentCheck.keywords;

    // 12. Determine source credibility (use default if not provided)
    const sourceCredibility = validatedData.sourceCredibility ||
                             SOURCE_CREDIBILITY[validatedData.sourcePlatform] ||
                             5;

    // 13. Create comment with deduplication handling
    const comment = await commentDeduplicationService.createComment({
      mkId: validatedData.mkId,
      content: sanitizedContent,
      sourceUrl: sanitizedUrl,
      sourcePlatform: validatedData.sourcePlatform,
      sourceType: validatedData.sourceType,
      sourceName: validatedData.sourceName,
      commentDate: new Date(validatedData.commentDate),
      keywords,
      imageUrl: validatedData.imageUrl,
      videoUrl: validatedData.videoUrl,
    });

    // Check if it was marked as duplicate
    const isDuplicate = comment.duplicateOf !== null;

    // 14. Log successful creation
    console.log('Historical comment created:', {
      id: comment.id,
      mkId: comment.mkId,
      isDuplicate,
      duplicateOf: comment.duplicateOf,
      apiKeyId: authResult.apiKeyId,
      ip: getClientIp(request.headers),
      timestamp: new Date().toISOString(),
    });

    // 15. Trigger revalidation
    revalidatePath('/');
    revalidatePath('/admin');

    // 16. Return success
    return NextResponse.json(
      {
        success: true,
        data: {
          id: comment.id,
          mkId: comment.mkId,
          content: comment.content,
          sourceUrl: comment.sourceUrl,
          sourcePlatform: comment.sourcePlatform,
          sourceType: comment.sourceType,
          sourceName: comment.sourceName,
          sourceCredibility: comment.sourceCredibility,
          commentDate: comment.commentDate,
          publishedAt: comment.publishedAt,
          keywords: comment.keywords,
          imageUrl: comment.imageUrl,
          videoUrl: comment.videoUrl,
          isDuplicate,
          duplicateOf: comment.duplicateOf,
          duplicateGroup: comment.duplicateGroup,
        }
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
          error: 'שגיאת ולידציה',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'JSON לא תקין בבקשה' },
        { status: 400 }
      );
    }

    console.error('Error creating historical comment:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/historical-comments
 * Retrieve historical comments with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'אישור נדרש - מפתח API לא תקין' },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      mkId: searchParams.get('mkId') ? parseInt(searchParams.get('mkId')!) : undefined,
      platform: searchParams.get('platform') || undefined,
      verified: searchParams.get('verified') ? searchParams.get('verified') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: (searchParams.get('sortBy') as 'date' | 'credibility') || 'date',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    };

    // Validate query params
    const validatedParams = getHistoricalCommentsSchema.parse(queryParams);

    // 3. Build where clause
    const where: any = {
      duplicateOf: null, // Only show primary comments
    };

    if (validatedParams.mkId) {
      where.mkId = validatedParams.mkId;
    }

    if (validatedParams.platform) {
      where.sourcePlatform = validatedParams.platform;
    }

    if (validatedParams.verified !== undefined) {
      where.isVerified = validatedParams.verified;
    }

    // 4. Build orderBy clause
    const orderBy: any = {};
    if (validatedParams.sortBy === 'date') {
      orderBy.commentDate = validatedParams.order;
    } else if (validatedParams.sortBy === 'credibility') {
      orderBy.sourceCredibility = validatedParams.order;
    }

    // 5. Fetch comments with duplicates
    const [comments, total] = await Promise.all([
      prisma.historicalComment.findMany({
        where,
        orderBy,
        take: validatedParams.limit,
        skip: validatedParams.offset,
        include: {
          mk: {
            select: {
              id: true,
              nameHe: true,
              faction: true,
            }
          },
          duplicates: {
            select: {
              id: true,
              sourceUrl: true,
              sourcePlatform: true,
              sourceName: true,
              publishedAt: true,
            }
          }
        }
      }),
      prisma.historicalComment.count({ where }),
    ]);

    // 6. Return data with pagination info
    return NextResponse.json(
      {
        success: true,
        data: {
          comments,
          pagination: {
            total,
            limit: validatedParams.limit,
            offset: validatedParams.offset,
            hasMore: validatedParams.offset + validatedParams.limit < total,
          }
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        }
      }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'פרמטרי שאילתה לא תקינים',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    console.error('Error fetching historical comments:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/historical-comments
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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import prisma from '@/lib/prisma';
import { CreateTweetResponse } from '@/types/tweet';

// Validation schema
const createTweetSchema = z.object({
  mkId: z.number().int().positive(),
  content: z.string().min(1).max(5000),
  sourceUrl: z.string().url().optional(),
  sourcePlatform: z.enum(['Twitter', 'Facebook', 'Instagram', 'News', 'Knesset Website', 'Other']),
  postedAt: z.string().datetime(), // ISO 8601 format
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // 2. Check rate limit
    const rateLimitResult = checkRateLimit(authResult.apiKeyId!);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Try again later.',
          resetAt: new Date(rateLimitResult.resetTime).toISOString()
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = createTweetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 4. Verify MK exists
    const mk = await prisma.mK.findUnique({
      where: { id: data.mkId },
      select: { id: true, nameHe: true },
    });

    if (!mk) {
      return NextResponse.json(
        { success: false, error: `MK with ID ${data.mkId} not found` },
        { status: 404 }
      );
    }

    // 5. Create tweet
    const tweet = await prisma.tweet.create({
      data: {
        mkId: data.mkId,
        content: data.content,
        sourceUrl: data.sourceUrl,
        sourcePlatform: data.sourcePlatform,
        postedAt: new Date(data.postedAt),
      },
    });

    // 6. Return success response
    const response: CreateTweetResponse = {
      success: true,
      tweet: {
        id: tweet.id,
        mkId: tweet.mkId,
        mkName: mk.nameHe,
        content: tweet.content,
        sourceUrl: tweet.sourceUrl,
        sourcePlatform: tweet.sourcePlatform,
        postedAt: tweet.postedAt,
        createdAt: tweet.createdAt,
      },
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      },
    });

  } catch (error) {
    console.error('Error creating tweet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // 2. Check rate limit
    const rateLimitResult = checkRateLimit(authResult.apiKeyId!);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const mkId = searchParams.get('mkId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 4. Build query
    const where = mkId ? { mkId: parseInt(mkId) } : {};

    // 5. Fetch tweets
    const [tweets, total] = await Promise.all([
      prisma.tweet.findMany({
        where,
        include: {
          mk: {
            select: { nameHe: true },
          },
        },
        orderBy: { postedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.tweet.count({ where }),
    ]);

    // 6. Format response
    const formattedTweets = tweets.map(tweet => ({
      id: tweet.id,
      mkId: tweet.mkId,
      mkName: tweet.mk.nameHe,
      content: tweet.content,
      sourceUrl: tweet.sourceUrl,
      sourcePlatform: tweet.sourcePlatform,
      postedAt: tweet.postedAt,
      createdAt: tweet.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        tweets: formattedTweets,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      }
    );

  } catch (error) {
    console.error('Error fetching tweets:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

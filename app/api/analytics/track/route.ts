import { NextRequest, NextResponse } from 'next/server';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import { z } from 'zod';

// Validation schema
const PageViewSchema = z.object({
  path: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referer: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = PageViewSchema.parse(body);

    // Record page view in database (questionnaire DB)
    await prismaQuestionnaire.pageView.create({
      data: {
        path: validatedData.path,
        ipAddress: validatedData.ipAddress,
        userAgent: validatedData.userAgent,
        referer: validatedData.referer,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Log error but return success to prevent retries
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

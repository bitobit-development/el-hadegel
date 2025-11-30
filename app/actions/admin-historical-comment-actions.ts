'use server';

import prisma from '@/lib/prisma';
import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service';
import { revalidatePath } from 'next/cache';
import type { HistoricalCommentData } from './historical-comment-actions';

export interface HistoricalCommentsStats {
  total: number;
  byPlatform: Record<string, number>;
  byVerification: { verified: number; unverified: number };
  totalMKsWithComments: number;
}

export interface HistoricalCommentsFilters {
  mkId?: number;
  platform?: string;
  verified?: boolean;
  sourceType?: string;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface HistoricalCommentsPagination {
  page: number;
  limit: number;
}

export interface HistoricalCommentsResult {
  comments: HistoricalCommentData[];
  total: number;
}

/**
 * Get all historical comments with filters and pagination
 */
export async function getAllHistoricalComments(
  filters?: HistoricalCommentsFilters,
  pagination?: HistoricalCommentsPagination
): Promise<HistoricalCommentsResult> {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      duplicateOf: null, // Only show primary comments
    };

    if (filters?.mkId) {
      where.mkId = filters.mkId;
    }

    if (filters?.platform) {
      where.sourcePlatform = filters.platform;
    }

    if (filters?.verified !== undefined) {
      where.isVerified = filters.verified;
    }

    if (filters?.sourceType) {
      where.sourceType = filters.sourceType;
    }

    if (filters?.searchQuery) {
      where.OR = [
        { content: { contains: filters.searchQuery, mode: 'insensitive' } },
        { sourceName: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.commentDate = {};
      if (filters.dateFrom) {
        where.commentDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.commentDate.lte = filters.dateTo;
      }
    }

    // Fetch comments with MK details
    const [comments, total] = await Promise.all([
      prisma.historicalComment.findMany({
        where,
        include: {
          mk: {
            select: {
              id: true,
              nameHe: true,
              faction: true,
            },
          },
          duplicates: {
            select: {
              id: true,
              sourceUrl: true,
              sourcePlatform: true,
              sourceName: true,
              publishedAt: true,
            },
          },
        },
        orderBy: { commentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.historicalComment.count({ where }),
    ]);

    // Transform to include MK details
    const commentsWithMK = comments.map((comment) => ({
      ...comment,
      mkName: comment.mk.nameHe,
      mkFaction: comment.mk.faction,
    }));

    return {
      comments: commentsWithMK as any,
      total,
    };
  } catch (error) {
    console.error('Error fetching all historical comments:', error);
    return { comments: [], total: 0 };
  }
}

/**
 * Get statistics about historical comments
 */
export async function getHistoricalCommentsStats(): Promise<HistoricalCommentsStats> {
  try {
    const [
      total,
      byPlatform,
      verifiedCount,
      totalMKsWithComments,
    ] = await Promise.all([
      // Total primary comments
      prisma.historicalComment.count({
        where: { duplicateOf: null },
      }),

      // Comments by platform
      prisma.historicalComment.groupBy({
        by: ['sourcePlatform'],
        where: { duplicateOf: null },
        _count: true,
      }),

      // Verified count
      prisma.historicalComment.count({
        where: {
          duplicateOf: null,
          isVerified: true,
        },
      }),

      // Total unique MKs with comments
      prisma.historicalComment.findMany({
        where: { duplicateOf: null },
        select: { mkId: true },
        distinct: ['mkId'],
      }),
    ]);

    const platformStats = byPlatform.reduce((acc, item) => {
      acc[item.sourcePlatform] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byPlatform: platformStats,
      byVerification: {
        verified: verifiedCount,
        unverified: total - verifiedCount,
      },
      totalMKsWithComments: totalMKsWithComments.length,
    };
  } catch (error) {
    console.error('Error fetching historical comments stats:', error);
    return {
      total: 0,
      byPlatform: {},
      byVerification: { verified: 0, unverified: 0 },
      totalMKsWithComments: 0,
    };
  }
}

/**
 * Verify/unverify a comment (admin only)
 */
export async function verifyHistoricalCommentAdmin(
  commentId: number,
  verified: boolean
): Promise<boolean> {
  try {
    await prisma.historicalComment.update({
      where: { id: commentId },
      data: { isVerified: verified },
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/historical-comments');

    return true;
  } catch (error) {
    console.error('Error verifying comment:', error);
    return false;
  }
}

/**
 * Bulk verify/unverify comments (admin only)
 */
export async function bulkVerifyHistoricalComments(
  commentIds: number[],
  verified: boolean
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  try {
    const result = await prisma.historicalComment.updateMany({
      where: { id: { in: commentIds } },
      data: { isVerified: verified },
    });

    success = result.count;

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/historical-comments');
  } catch (error) {
    console.error('Error bulk verifying comments:', error);
    failed = commentIds.length;
  }

  return { success, failed };
}

/**
 * Bulk delete comments (admin only)
 */
export async function bulkDeleteHistoricalComments(
  commentIds: number[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  try {
    // First update any duplicates to remove their reference
    await prisma.historicalComment.updateMany({
      where: { duplicateOf: { in: commentIds } },
      data: { duplicateOf: null },
    });

    // Then delete the comments
    const result = await prisma.historicalComment.deleteMany({
      where: { id: { in: commentIds } },
    });

    success = result.count;

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/admin/historical-comments');
  } catch (error) {
    console.error('Error bulk deleting comments:', error);
    failed = commentIds.length;
  }

  return { success, failed };
}

/**
 * Get full comment details with all relations (for detail dialog)
 */
export async function getHistoricalCommentDetails(
  commentId: number
): Promise<HistoricalCommentData | null> {
  try {
    const comment = await prisma.historicalComment.findUnique({
      where: { id: commentId },
      include: {
        mk: {
          select: {
            id: true,
            nameHe: true,
            faction: true,
          },
        },
        duplicates: {
          select: {
            id: true,
            sourceUrl: true,
            sourcePlatform: true,
            sourceName: true,
            publishedAt: true,
          },
        },
        primaryComment: {
          select: {
            id: true,
            content: true,
            sourceUrl: true,
            sourcePlatform: true,
            sourceName: true,
            commentDate: true,
          },
        },
      },
    });

    if (!comment) return null;

    return {
      ...comment,
      mkName: comment.mk.nameHe,
      mkFaction: comment.mk.faction,
    } as any;
  } catch (error) {
    console.error('Error fetching comment details:', error);
    return null;
  }
}

/**
 * Get all coalition MKs for dropdown filter
 */
export async function getCoalitionMKsForFilter(): Promise<
  Array<{ id: number; nameHe: string; faction: string }>
> {
  try {
    const COALITION_PARTIES = [
      'הליכוד',
      'התאחדות הספרדים שומרי תורה',
      'יהדות התורה',
      'הציונות הדתית',
      'עוצמה יהודית',
      'נעם',
    ];

    const mks = await prisma.mK.findMany({
      where: {
        faction: { in: COALITION_PARTIES },
      },
      select: {
        id: true,
        nameHe: true,
        faction: true,
      },
      orderBy: {
        nameHe: 'asc',
      },
    });

    return mks;
  } catch (error) {
    console.error('Error fetching coalition MKs:', error);
    return [];
  }
}

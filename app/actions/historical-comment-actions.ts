'use server';

import prisma from '@/lib/prisma';
import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service';
import { revalidatePath } from 'next/cache';

export interface HistoricalCommentData {
  id: number;
  content: string;
  sourceUrl: string;
  sourcePlatform: string;
  sourceType: string;
  sourceName: string | null;
  sourceCredibility: number;
  commentDate: Date;
  publishedAt: Date;
  keywords: string[];
  isVerified: boolean;
  imageUrl: string | null;
  videoUrl: string | null;
  duplicateOf: number | null;
  duplicates?: Array<{
    id: number;
    sourceUrl: string;
    sourcePlatform: string;
    sourceName: string | null;
    publishedAt: Date;
  }>;
}

/**
 * Get historical comments for a specific MK
 */
export async function getMKHistoricalComments(
  mkId: number,
  limit: number = 50
): Promise<HistoricalCommentData[]> {
  try {
    const comments = await commentDeduplicationService.getPrimaryComments(
      mkId,
      limit
    );
    return comments as HistoricalCommentData[];
  } catch (error) {
    console.error('Error fetching historical comments:', error);
    return [];
  }
}

/**
 * Get count of historical comments for an MK
 */
export async function getMKHistoricalCommentCount(
  mkId: number
): Promise<number> {
  try {
    return await prisma.historicalComment.count({
      where: {
        mkId,
        duplicateOf: null,
      },
    });
  } catch (error) {
    console.error('Error counting historical comments:', error);
    return 0;
  }
}

/**
 * Get counts for multiple MKs (efficient batch query)
 */
export async function getHistoricalCommentCounts(
  mkIds: number[]
): Promise<Record<number, number>> {
  try {
    const counts = await prisma.historicalComment.groupBy({
      by: ['mkId'],
      where: {
        mkId: { in: mkIds },
        duplicateOf: null,
      },
      _count: true,
    });

    return counts.reduce((acc, item) => {
      acc[item.mkId] = item._count;
      return acc;
    }, {} as Record<number, number>);
  } catch (error) {
    console.error('Error fetching comment counts:', error);
    return {};
  }
}

/**
 * Verify a comment (admin only)
 */
export async function verifyHistoricalComment(
  commentId: number
): Promise<boolean> {
  try {
    await prisma.historicalComment.update({
      where: { id: commentId },
      data: { isVerified: true },
    });
    revalidatePath('/');
    revalidatePath('/admin');
    return true;
  } catch (error) {
    console.error('Error verifying comment:', error);
    return false;
  }
}

/**
 * Delete a comment (admin only)
 */
export async function deleteHistoricalComment(
  commentId: number
): Promise<boolean> {
  try {
    await prisma.historicalComment.delete({
      where: { id: commentId },
    });
    revalidatePath('/');
    revalidatePath('/admin');
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

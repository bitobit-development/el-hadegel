'use server';

import prisma from '@/lib/prisma';
import { TweetData } from '@/types/tweet';
import { revalidatePath } from 'next/cache';

/**
 * Get tweets for a specific MK
 * @param mkId - The MK's ID
 * @param limit - Maximum number of tweets to return (default: 20)
 * @returns Array of tweets ordered by postedAt (newest first)
 */
export async function getMKTweets(mkId: number, limit: number = 20): Promise<TweetData[]> {
  try {
    const tweets = await prisma.tweet.findMany({
      where: { mkId },
      include: {
        mk: {
          select: { nameHe: true },
        },
      },
      orderBy: { postedAt: 'desc' },
      take: limit,
    });

    return tweets.map(tweet => ({
      id: tweet.id,
      mkId: tweet.mkId,
      mkName: tweet.mk.nameHe,
      content: tweet.content,
      sourceUrl: tweet.sourceUrl,
      sourcePlatform: tweet.sourcePlatform,
      postedAt: tweet.postedAt,
      createdAt: tweet.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching MK tweets:', error);
    return [];
  }
}

/**
 * Get tweet count for a specific MK
 * @param mkId - The MK's ID
 * @returns Number of tweets
 */
export async function getMKTweetCount(mkId: number): Promise<number> {
  try {
    return await prisma.tweet.count({
      where: { mkId },
    });
  } catch (error) {
    console.error('Error counting MK tweets:', error);
    return 0;
  }
}

/**
 * Get recent tweets across all MKs
 * @param limit - Maximum number of tweets to return (default: 50)
 * @returns Array of tweets ordered by postedAt (newest first)
 */
export async function getRecentTweets(limit: number = 50): Promise<TweetData[]> {
  try {
    const tweets = await prisma.tweet.findMany({
      include: {
        mk: {
          select: { nameHe: true },
        },
      },
      orderBy: { postedAt: 'desc' },
      take: limit,
    });

    return tweets.map(tweet => ({
      id: tweet.id,
      mkId: tweet.mkId,
      mkName: tweet.mk.nameHe,
      content: tweet.content,
      sourceUrl: tweet.sourceUrl,
      sourcePlatform: tweet.sourcePlatform,
      postedAt: tweet.postedAt,
      createdAt: tweet.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching recent tweets:', error);
    return [];
  }
}

/**
 * Delete a tweet (admin only)
 * Used from admin dashboard to remove inappropriate content
 * @param tweetId - The tweet's ID
 * @returns Success status
 */
export async function deleteTweet(tweetId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.tweet.delete({
      where: { id: tweetId },
    });

    revalidatePath('/');
    revalidatePath('/admin');

    return { success: true };
  } catch (error) {
    console.error('Error deleting tweet:', error);
    return { success: false, error: 'Failed to delete tweet' };
  }
}

/**
 * Get tweet statistics
 * @returns Object with total tweets and tweets per platform
 */
export async function getTweetStats(): Promise<{
  total: number;
  byPlatform: Record<string, number>;
  byMK: Array<{ mkId: number; mkName: string; count: number }>;
}> {
  try {
    const [total, tweets, mkCounts] = await Promise.all([
      prisma.tweet.count(),
      prisma.tweet.findMany({
        select: { sourcePlatform: true },
      }),
      prisma.tweet.groupBy({
        by: ['mkId'],
        _count: true,
        orderBy: {
          _count: {
            mkId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Count by platform
    const byPlatform: Record<string, number> = {};
    tweets.forEach(tweet => {
      byPlatform[tweet.sourcePlatform] = (byPlatform[tweet.sourcePlatform] || 0) + 1;
    });

    // Get MK names for top 10
    const mkIds = mkCounts.map(m => m.mkId);
    const mks = await prisma.mK.findMany({
      where: { id: { in: mkIds } },
      select: { id: true, nameHe: true },
    });

    const mkMap = new Map(mks.map(mk => [mk.id, mk.nameHe]));

    const byMK = mkCounts.map(item => ({
      mkId: item.mkId,
      mkName: mkMap.get(item.mkId) || 'Unknown',
      count: item._count,
    }));

    return {
      total,
      byPlatform,
      byMK,
    };
  } catch (error) {
    console.error('Error fetching tweet stats:', error);
    return {
      total: 0,
      byPlatform: {},
      byMK: [],
    };
  }
}

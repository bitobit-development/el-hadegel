'use server';

import prisma from '@/lib/prisma';
import { NewsPostData } from '@/types/news';
import { NEWS_POST_CONSTRAINTS } from '@/types/news';

/**
 * Get latest news posts in reverse chronological order
 * User requirement: Maximum 10 posts
 */
export async function getLatestNewsPosts(
  limit: number = NEWS_POST_CONSTRAINTS.MAX_POSTS_DISPLAY
): Promise<NewsPostData[]> {
  try {
    const posts = await prisma.newsPost.findMany({
      orderBy: { postedAt: 'desc' },
      take: Math.min(limit, NEWS_POST_CONSTRAINTS.MAX_POSTS_DISPLAY), // Enforce max 10
    });
    return posts;
  } catch (error) {
    console.error('Error fetching news posts:', error);
    return [];
  }
}

/**
 * Get total count of news posts
 */
export async function getNewsPostCount(): Promise<number> {
  try {
    return await prisma.newsPost.count();
  } catch (error) {
    console.error('Error counting news posts:', error);
    return 0;
  }
}

/**
 * Delete a news post (admin only)
 */
export async function deleteNewsPost(id: number): Promise<boolean> {
  try {
    await prisma.newsPost.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting news post:', error);
    return false;
  }
}

import prisma from '@/lib/prisma';

/**
 * Sync NewsPost to Tweet table
 *
 * Creates a Tweet record from a NewsPost when the NewsPost is linked to an MK.
 * This allows news posts to appear on MK cards alongside other tweets.
 *
 * @param newsPostId - The NewsPost ID to sync
 * @returns The created Tweet ID, or null if already synced or no MK linked
 */
export async function syncNewsPostToTweet(newsPostId: number): Promise<number | null> {
  // Fetch the NewsPost with MK information
  const newsPost = await prisma.newsPost.findUnique({
    where: { id: newsPostId },
    include: {
      tweet: true, // Check if already synced
    },
  });

  // Don't sync if:
  // 1. NewsPost doesn't exist
  // 2. No MK is linked
  // 3. Already synced
  if (!newsPost || !newsPost.mkId || newsPost.syncedToTweet || newsPost.tweet) {
    return null;
  }

  // Create Tweet record
  const tweet = await prisma.tweet.create({
    data: {
      mkId: newsPost.mkId,
      content: newsPost.content,
      sourceUrl: newsPost.sourceUrl,
      sourcePlatform: newsPost.sourceName || 'News',
      postedAt: newsPost.postedAt,
    },
  });

  // Update NewsPost to mark as synced
  await prisma.newsPost.update({
    where: { id: newsPostId },
    data: {
      syncedToTweet: true,
      tweetId: tweet.id,
    },
  });

  return tweet.id;
}

/**
 * Sync all unsynced NewsPosts to Tweet table
 *
 * Useful for migrating existing NewsPosts that were created before sync functionality.
 *
 * @returns Number of NewsPosts synced
 */
export async function syncAllNewsPosts(): Promise<number> {
  // Find all NewsPosts that:
  // 1. Have an MK linked
  // 2. Are not yet synced
  const unsyncedPosts = await prisma.newsPost.findMany({
    where: {
      mkId: { not: null },
      syncedToTweet: false,
    },
  });

  let syncedCount = 0;

  for (const post of unsyncedPosts) {
    const tweetId = await syncNewsPostToTweet(post.id);
    if (tweetId !== null) {
      syncedCount++;
    }
  }

  return syncedCount;
}

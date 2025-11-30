import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';

/**
 * Delete the last (most recent) tweet/post from Hanoch Milwidsky (MK ID: 1105)
 * This is used to remove test posts from the database.
 */
async function deleteLastMilwidskyPost() {
  const MILWIDSKY_MK_ID = 1105;
  const MK_NAME = 'חנוך דב מלביצקי (Hanoch Milwidsky)';

  console.log(`🗑️  Deleting last post from ${MK_NAME}\n`);

  try {
    // First, get all posts for this MK
    const allPosts = await prisma.tweet.findMany({
      where: { mkId: MILWIDSKY_MK_ID },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Total posts for ${MK_NAME}: ${allPosts.length}\n`);

    if (allPosts.length === 0) {
      console.log('⚠️  No posts found for this MK. Nothing to delete.');
      return;
    }

    // Get the most recent post
    const lastPost = allPosts[0];

    console.log('🎯 Post to be deleted:');
    console.log('━'.repeat(60));
    console.log(`ID: ${lastPost.id}`);
    console.log(`Content: ${lastPost.content.substring(0, 100)}${lastPost.content.length > 100 ? '...' : ''}`);
    console.log(`Source URL: ${lastPost.sourceUrl || 'N/A'}`);
    console.log(`Platform: ${lastPost.sourcePlatform}`);
    console.log(`Posted At: ${lastPost.postedAt.toISOString()}`);
    console.log(`Created At: ${lastPost.createdAt.toISOString()}`);
    console.log('━'.repeat(60));
    console.log('');

    // Delete the post
    await prisma.tweet.delete({
      where: { id: lastPost.id },
    });

    console.log(`✅ Successfully deleted post ID ${lastPost.id}`);
    console.log(`📊 Remaining posts for ${MK_NAME}: ${allPosts.length - 1}\n`);

    // Show remaining posts if any
    if (allPosts.length > 1) {
      console.log('📝 Remaining posts:');
      const remainingPosts = allPosts.slice(1);
      remainingPosts.forEach((post, index) => {
        console.log(`  ${index + 1}. ${post.content.substring(0, 50)}... (${post.postedAt.toISOString()})`);
      });
    } else {
      console.log('✨ No remaining posts for this MK');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteLastMilwidskyPost();

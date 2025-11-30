import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';

/**
 * Delete a specific news post by ID
 * Usage: npx dotenv-cli -e .env -- npx tsx scripts/delete-news-post-by-id.ts <post_id>
 */
async function deleteNewsPostById() {
  const postId = parseInt(process.argv[2]);

  if (!postId || isNaN(postId)) {
    console.error('❌ Error: Please provide a valid post ID');
    console.log('Usage: npx dotenv-cli -e .env -- npx tsx scripts/delete-news-post-by-id.ts <post_id>');
    process.exit(1);
  }

  console.log(`🗑️  Deleting news post with ID: ${postId}\n`);

  try {
    // First, get the post to display its details
    const post = await prisma.newsPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      console.log(`⚠️  No post found with ID ${postId}`);
      return;
    }

    console.log('🎯 Post to be deleted:');
    console.log('━'.repeat(60));
    console.log(`ID: ${post.id}`);
    console.log(`Content: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`);
    console.log(`Source URL: ${post.sourceUrl || 'N/A'}`);
    console.log(`Source Name: ${post.sourceName || 'N/A'}`);
    console.log(`Posted At: ${post.postedAt.toISOString()}`);
    console.log(`Created At: ${post.createdAt.toISOString()}`);
    console.log('━'.repeat(60));
    console.log('');

    // Delete the post
    await prisma.newsPost.delete({
      where: { id: postId },
    });

    console.log(`✅ Successfully deleted news post ID ${postId}\n`);

    // Show remaining count
    const remainingCount = await prisma.newsPost.count();
    console.log(`📊 Remaining news posts in database: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteNewsPostById();

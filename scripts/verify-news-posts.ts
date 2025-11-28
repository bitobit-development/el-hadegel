import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';

async function verifyNewsPosts() {
  console.log('🔍 Verifying news posts in database...\n');

  try {
    const posts = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Total posts in database: ${posts.length}\n`);

    if (posts.length === 0) {
      console.log('⚠️  No posts found');
    } else {
      posts.forEach((post, index) => {
        console.log(`Post #${index + 1}:`);
        console.log('━'.repeat(60));
        console.log(`ID: ${post.id}`);
        console.log(`Content: ${post.content}`);
        console.log(`Source: ${post.sourceUrl}`);
        console.log(`Source Name: ${post.sourceName || 'N/A'}`);
        console.log(`Posted At: ${post.postedAt.toISOString()}`);
        console.log(`\nPreview Data:`);
        console.log(`  Title: ${post.previewTitle || 'N/A'}`);
        console.log(`  Image: ${post.previewImage || 'N/A'}`);
        console.log(`  Description: ${post.previewDescription?.substring(0, 100) || 'N/A'}${post.previewDescription && post.previewDescription.length > 100 ? '...' : ''}`);
        console.log(`  Site Name: ${post.previewSiteName || 'N/A'}`);
        console.log('━'.repeat(60));
        console.log('');
      });

      if (posts.length === 1) {
        console.log('✅ Perfect! Exactly 1 post in database (as expected)');
      } else {
        console.log(`⚠️  Expected 1 post, but found ${posts.length}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNewsPosts();

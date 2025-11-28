import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';

async function resetNewsPosts() {
  console.log('🗑️  Deleting all existing news posts...\n');

  try {
    const deleted = await prisma.newsPost.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} existing news posts`);
    console.log('✨ News posts table is now empty and ready for fresh data\n');
  } catch (error) {
    console.error('❌ Error deleting posts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetNewsPosts();

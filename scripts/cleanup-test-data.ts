import 'dotenv/config';
import prisma from '../lib/prisma';

async function cleanupTestData() {
  console.log('🗑️  Cleaning up test data...\n');

  try {
    // Delete all MKStatusInfo entries
    const deletedStatusInfo = await prisma.mKStatusInfo.deleteMany({});
    console.log(`✅ Deleted ${deletedStatusInfo.count} status info entries`);

    // Delete all Tweet entries
    const deletedTweets = await prisma.tweet.deleteMany({});
    console.log(`✅ Deleted ${deletedTweets.count} tweet entries`);

    console.log('\n✨ Test data cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();

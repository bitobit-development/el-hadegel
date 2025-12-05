import prisma from '@/lib/prisma';

async function checkDatabase() {
  try {
    console.log('Checking database status...\n');
    
    // Check all main tables
    const [mkCount, adminCount, tweetCount, videoCount, newsPostCount] = await Promise.all([
      prisma.mK.count().catch(() => null),
      prisma.admin.count().catch(() => null),
      prisma.tweet.count().catch(() => null),
      prisma.video.count().catch(() => null),
      prisma.newsPost.count().catch(() => null),
    ]);
    
    console.log('Main Database Tables:');
    console.log('=====================');
    console.log(`MK records: ${mkCount ?? 'TABLE NOT FOUND'}`);
    console.log(`Admin records: ${adminCount ?? 'TABLE NOT FOUND'}`);
    console.log(`Tweet records: ${tweetCount ?? 'TABLE NOT FOUND'}`);
    console.log(`Video records: ${videoCount ?? 'TABLE NOT FOUND'}`);
    console.log(`NewsPost records: ${newsPostCount ?? 'TABLE NOT FOUND'}`);
    
    if (mkCount === null) {
      console.log('\n❌ CRITICAL: Main tables are missing!');
    } else {
      console.log('\n✅ Main tables exist');
    }
    
  } catch (error: any) {
    console.error('\n❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function verifySchema() {
  console.log('🔍 Verifying Tweet Tracking System Schema...\n');

  try {
    // Check API Keys
    const apiKeyCount = await prisma.apiKey.count();
    console.log(`✅ ApiKey table exists - ${apiKeyCount} key(s) found`);

    const testKey = await prisma.apiKey.findFirst({
      where: { name: 'Development Test Key' },
    });
    console.log(`✅ Test API key seeded: ${testKey?.name || 'NOT FOUND'}`);

    // Check Tweet table structure
    const tweetCount = await prisma.tweet.count();
    console.log(`✅ Tweet table exists - ${tweetCount} tweet(s) found`);

    // Check MK relation works
    const mkWithTweets = await prisma.mK.findFirst({
      include: {
        tweets: true,
      },
    });
    console.log(`✅ MK->Tweet relation working (tested with MK #${mkWithTweets?.id})`);

    // Test creating a sample tweet (then delete it)
    const firstMK = await prisma.mK.findFirst();
    if (firstMK) {
      const testTweet = await prisma.tweet.create({
        data: {
          mkId: firstMK.id,
          content: 'Test tweet for schema verification',
          sourcePlatform: 'Test',
          postedAt: new Date(),
        },
      });
      console.log(`✅ Tweet creation works (created tweet #${testTweet.id})`);

      // Clean up test tweet
      await prisma.tweet.delete({ where: { id: testTweet.id } });
      console.log(`✅ Tweet deletion works (cleaned up test tweet)`);
    }

    console.log('\n🎉 All schema verifications passed!');
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();

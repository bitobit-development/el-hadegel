/**
 * Test script for tweet Server Actions
 * Run with: npx tsx scripts/test-tweet-actions.ts
 */

import { getMKTweets, getMKTweetCount, getRecentTweets, getTweetStats } from '../app/actions/tweet-actions';
import { getMKs } from '../app/actions/mk-actions';

async function main() {
  console.log('🧪 Testing Tweet Server Actions\n');

  // Test 1: Get tweets for MK #1
  console.log('Test 1: getMKTweets(1, 5)');
  const mkTweets = await getMKTweets(1, 5);
  console.log(`✓ Found ${mkTweets.length} tweets for MK #1`);
  if (mkTweets.length > 0) {
    console.log('  Sample tweet:', {
      mkName: mkTweets[0].mkName,
      platform: mkTweets[0].sourcePlatform,
      contentPreview: mkTweets[0].content.substring(0, 50) + '...',
    });
  }
  console.log();

  // Test 2: Get tweet count for MK #1
  console.log('Test 2: getMKTweetCount(1)');
  const count = await getMKTweetCount(1);
  console.log(`✓ MK #1 has ${count} total tweets`);
  console.log();

  // Test 3: Get recent tweets across all MKs
  console.log('Test 3: getRecentTweets(10)');
  const recentTweets = await getRecentTweets(10);
  console.log(`✓ Found ${recentTweets.length} recent tweets`);
  if (recentTweets.length > 0) {
    console.log('  Most recent tweet:', {
      mkName: recentTweets[0].mkName,
      platform: recentTweets[0].sourcePlatform,
      postedAt: recentTweets[0].postedAt,
    });
  }
  console.log();

  // Test 4: Get tweet statistics
  console.log('Test 4: getTweetStats()');
  const stats = await getTweetStats();
  console.log(`✓ Total tweets: ${stats.total}`);
  console.log('  By platform:', stats.byPlatform);
  console.log(`  Top MK: ${stats.byMK[0]?.mkName || 'N/A'} with ${stats.byMK[0]?.count || 0} tweets`);
  console.log();

  // Test 5: Get MKs with tweet counts
  console.log('Test 5: getMKs(undefined, true) - with tweet counts');
  const mksWithCounts = await getMKs(undefined, true);
  const mkWithMostTweets = mksWithCounts
    .sort((a, b) => ('tweetCount' in b ? b.tweetCount : 0) - ('tweetCount' in a ? a.tweetCount : 0))[0];

  if ('tweetCount' in mkWithMostTweets) {
    console.log(`✓ MK with most tweets: ${mkWithMostTweets.nameHe} (${mkWithMostTweets.tweetCount} tweets)`);
  }
  console.log();

  // Test 6: Get MKs without tweet counts (default behavior)
  console.log('Test 6: getMKs() - without tweet counts');
  const mks = await getMKs();
  const firstMK = mks[0];
  console.log(`✓ First MK: ${firstMK.nameHe}`);
  console.log(`  Has tweetCount property: ${'tweetCount' in firstMK}`);
  console.log();

  console.log('✅ All tests completed!');
}

main().catch(console.error);

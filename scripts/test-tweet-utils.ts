/**
 * Test script for tweet utility functions
 * Run with: npx tsx scripts/test-tweet-utils.ts
 */

import {
  formatTweetDate,
  getRelativeTime,
  truncateTweet,
  getPlatformIcon,
  getPlatformColor,
} from '../lib/tweet-utils';

function main() {
  console.log('🧪 Testing Tweet Utility Functions\n');

  // Test 1: Format tweet date
  console.log('Test 1: formatTweetDate()');
  const testDate = new Date('2024-01-15T14:30:00');
  const formatted = formatTweetDate(testDate);
  console.log(`✓ Formatted date: ${formatted}`);
  console.log();

  // Test 2: Relative time
  console.log('Test 2: getRelativeTime()');
  const now = new Date();
  const tests = [
    { date: new Date(now.getTime() - 30 * 1000), expected: 'כרגע' },
    { date: new Date(now.getTime() - 5 * 60 * 1000), expected: '5 דקות' },
    { date: new Date(now.getTime() - 2 * 60 * 60 * 1000), expected: '2 שעות' },
    { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), expected: '3 ימים' },
  ];

  tests.forEach((test, i) => {
    const relative = getRelativeTime(test.date);
    console.log(`  ${i + 1}. ${relative} (expected: ~${test.expected})`);
  });
  console.log();

  // Test 3: Truncate tweet
  console.log('Test 3: truncateTweet()');
  const longTweet = 'זהו טווית ארוך מאוד שמכיל הרבה טקסט ויהיה צריך לקצץ אותו כדי להציג אותו בצורה יפה בממשק המשתמש. הטקסט הזה ארוך מדי בשביל תצוגה מקדימה רגילה.';
  const truncated = truncateTweet(longTweet, 50);
  console.log(`✓ Original length: ${longTweet.length}`);
  console.log(`✓ Truncated: ${truncated}`);
  console.log(`✓ New length: ${truncated.length}`);
  console.log();

  // Test 4: Platform icons
  console.log('Test 4: getPlatformIcon()');
  const platforms = ['Twitter', 'Facebook', 'Instagram', 'News', 'Knesset Website', 'Other', 'Unknown'];
  platforms.forEach(platform => {
    const icon = getPlatformIcon(platform);
    console.log(`  ${platform}: ${icon}`);
  });
  console.log();

  // Test 5: Platform colors
  console.log('Test 5: getPlatformColor()');
  platforms.forEach(platform => {
    const color = getPlatformColor(platform);
    console.log(`  ${platform}: ${color}`);
  });
  console.log();

  console.log('✅ All utility tests completed!');
}

main();

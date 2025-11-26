/**
 * Performance Testing Script
 * Tests API response times and database query performance
 */

import { getMKTweets, getMKTweetCount, getRecentTweets, getTweetStats } from '@/app/actions/tweet-actions';

async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ name: string; duration: number; result: T }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;

  const emoji = duration < 100 ? '🚀' : duration < 500 ? '✅' : '⚠️';
  console.log(`${emoji} ${name}: ${duration}ms`);

  return { name, duration, result };
}

async function runPerformanceTests() {
  console.log('\n⚡ Performance Testing\n');

  // Test 1: Get tweets for single MK
  await measurePerformance('getMKTweets(1, 20)', () => getMKTweets(1, 20));

  // Test 2: Get tweet count
  await measurePerformance('getMKTweetCount(1)', () => getMKTweetCount(1));

  // Test 3: Get recent tweets
  await measurePerformance('getRecentTweets(50)', () => getRecentTweets(50));

  // Test 4: Get tweet stats
  await measurePerformance('getTweetStats()', () => getTweetStats());

  // Test 5: API endpoint POST
  const postResult = await measurePerformance('POST /api/tweets', async () => {
    const response = await fetch('http://localhost:3000/api/tweets', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key-dev-2024',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        content: 'Performance test tweet',
        sourcePlatform: 'Twitter',
        postedAt: new Date().toISOString(),
      }),
    });
    return response.json();
  });

  // Test 6: API endpoint GET
  await measurePerformance('GET /api/tweets?mkId=1', async () => {
    const response = await fetch('http://localhost:3000/api/tweets?mkId=1', {
      headers: {
        'Authorization': 'Bearer test-api-key-dev-2024',
      },
    });
    return response.json();
  });

  // Test 7: API endpoint GET with pagination
  await measurePerformance('GET /api/tweets?limit=50', async () => {
    const response = await fetch('http://localhost:3000/api/tweets?limit=50', {
      headers: {
        'Authorization': 'Bearer test-api-key-dev-2024',
      },
    });
    return response.json();
  });

  console.log('\n📊 Performance Summary\n');
  console.log('Target: < 100ms = 🚀 Excellent');
  console.log('Target: < 500ms = ✅ Good');
  console.log('Target: > 500ms = ⚠️  Needs optimization\n');
}

runPerformanceTests().catch(console.error);

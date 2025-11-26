/**
 * Comprehensive API Integration Tests
 * Tests authentication, validation, CRUD operations, and error handling
 */

import prisma from '@/lib/prisma';

const API_BASE = 'http://localhost:3000';
const VALID_API_KEY = 'test-api-key-dev-2024';
const INVALID_API_KEY = 'invalid-key-12345';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) console.log(`   Error: ${error}`);
}

async function runTests() {
  console.log('\n🧪 Starting API Integration Tests\n');

  // Test 1: Authentication - Missing Header
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mkId: 1,
        content: 'Test',
        sourcePlatform: 'Twitter',
        postedAt: new Date().toISOString(),
      }),
    });
    const passed = response.status === 401;
    logTest('Authentication: Missing Authorization header returns 401', passed);
  } catch (e: any) {
    logTest('Authentication: Missing Authorization header returns 401', false, e.message);
  }

  // Test 2: Authentication - Invalid API Key
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INVALID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        content: 'Test',
        sourcePlatform: 'Twitter',
        postedAt: new Date().toISOString(),
      }),
    });
    const passed = response.status === 401;
    logTest('Authentication: Invalid API key returns 401', passed);
  } catch (e: any) {
    logTest('Authentication: Invalid API key returns 401', false, e.message);
  }

  // Test 3: Validation - Invalid MK ID
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 99999,
        content: 'Test tweet',
        sourcePlatform: 'Twitter',
        postedAt: new Date().toISOString(),
      }),
    });
    const passed = response.status === 404;
    logTest('Validation: Invalid MK ID returns 404', passed);
  } catch (e: any) {
    logTest('Validation: Invalid MK ID returns 404', false, e.message);
  }

  // Test 4: Validation - Missing Required Field
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        // Missing content
        sourcePlatform: 'Twitter',
        postedAt: new Date().toISOString(),
      }),
    });
    const passed = response.status === 400;
    logTest('Validation: Missing required field returns 400', passed);
  } catch (e: any) {
    logTest('Validation: Missing required field returns 400', false, e.message);
  }

  // Test 5: Validation - Invalid Platform
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        content: 'Test tweet',
        sourcePlatform: 'InvalidPlatform',
        postedAt: new Date().toISOString(),
      }),
    });
    const passed = response.status === 400;
    logTest('Validation: Invalid platform returns 400', passed);
  } catch (e: any) {
    logTest('Validation: Invalid platform returns 400', false, e.message);
  }

  // Test 6: Create Tweet - Success
  let createdTweetId: number | null = null;
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        content: 'Integration test tweet',
        sourcePlatform: 'Twitter',
        sourceUrl: 'https://twitter.com/test/status/123',
        postedAt: new Date().toISOString(),
      }),
    });
    const data = await response.json();
    const passed = response.status === 201 && data.success && data.tweet;
    if (passed) createdTweetId = data.tweet.id;
    logTest('Create Tweet: Valid request returns 201 with tweet data', passed);
  } catch (e: any) {
    logTest('Create Tweet: Valid request returns 201 with tweet data', false, e.message);
  }

  // Test 7: Rate Limit Headers
  try {
    const response = await fetch(`${API_BASE}/api/tweets?mkId=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
      },
    });
    const hasHeaders =
      response.headers.has('x-ratelimit-limit') &&
      response.headers.has('x-ratelimit-remaining') &&
      response.headers.has('x-ratelimit-reset');
    logTest('Rate Limiting: Response includes rate limit headers', hasHeaders);
  } catch (e: any) {
    logTest('Rate Limiting: Response includes rate limit headers', false, e.message);
  }

  // Test 8: Get Tweets - All
  try {
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
      },
    });
    const data = await response.json();
    const passed = response.status === 200 && data.success && Array.isArray(data.tweets);
    logTest('Get Tweets: Retrieve all tweets successfully', passed);
  } catch (e: any) {
    logTest('Get Tweets: Retrieve all tweets successfully', false, e.message);
  }

  // Test 9: Get Tweets - Filtered by MK
  try {
    const response = await fetch(`${API_BASE}/api/tweets?mkId=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
      },
    });
    const data = await response.json();
    const passed = response.status === 200 && data.success && data.tweets.every((t: any) => t.mkId === 1);
    logTest('Get Tweets: Filter by MK ID works correctly', passed);
  } catch (e: any) {
    logTest('Get Tweets: Filter by MK ID works correctly', false, e.message);
  }

  // Test 10: Get Tweets - Pagination
  try {
    const response = await fetch(`${API_BASE}/api/tweets?limit=5&offset=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
      },
    });
    const data = await response.json();
    const passed =
      response.status === 200 &&
      data.pagination.limit === 5 &&
      data.tweets.length <= 5;
    logTest('Get Tweets: Pagination works correctly', passed);
  } catch (e: any) {
    logTest('Get Tweets: Pagination works correctly', false, e.message);
  }

  // Test 11: Tweet Data Integrity
  try {
    const response = await fetch(`${API_BASE}/api/tweets?mkId=1&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
      },
    });
    const data = await response.json();
    const tweet = data.tweets[0];
    const hasRequiredFields = tweet &&
      typeof tweet.id === 'number' &&
      typeof tweet.mkId === 'number' &&
      typeof tweet.mkName === 'string' &&
      typeof tweet.content === 'string' &&
      typeof tweet.sourcePlatform === 'string' &&
      typeof tweet.postedAt === 'string' &&
      typeof tweet.createdAt === 'string';
    logTest('Data Integrity: Tweet object contains all required fields', hasRequiredFields);
  } catch (e: any) {
    logTest('Data Integrity: Tweet object contains all required fields', false, e.message);
  }

  // Test 12: Hebrew Content Support
  try {
    const hebrewContent = 'אני תומך בחוק הגיוס השוויוני לצה״ל';
    const response = await fetch(`${API_BASE}/api/tweets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 2,
        content: hebrewContent,
        sourcePlatform: 'News',
        postedAt: new Date().toISOString(),
      }),
    });
    const data = await response.json();
    const passed = response.status === 201 && data.tweet.content === hebrewContent;
    logTest('Hebrew Support: Hebrew content stored and retrieved correctly', passed);
  } catch (e: any) {
    logTest('Hebrew Support: Hebrew content stored and retrieved correctly', false, e.message);
  }

  // Test 13: API Key Last Used Timestamp
  try {
    // Make a request
    await fetch(`${API_BASE}/api/tweets?mkId=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VALID_API_KEY}`,
      },
    });

    // Check database
    const apiKey = await prisma.apiKey.findFirst({
      where: { isActive: true },
    });
    const passed = apiKey?.lastUsedAt !== null;
    logTest('API Key: lastUsedAt timestamp updates on use', passed);
  } catch (e: any) {
    logTest('API Key: lastUsedAt timestamp updates on use', false, e.message);
  }

  // Cleanup: Delete test tweets
  if (createdTweetId) {
    try {
      await prisma.tweet.deleteMany({
        where: {
          content: {
            contains: 'Integration test',
          },
        },
      });
    } catch (e) {
      console.log('⚠️  Warning: Failed to cleanup test tweets');
    }
  }

  // Print Summary
  console.log('\n📊 Test Summary\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${percentage}%)`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }

  console.log(passed === total ? '\n✅ All tests passed!\n' : '\n❌ Some tests failed\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);

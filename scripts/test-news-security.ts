import { config } from 'dotenv';
config();

const API_URL = 'http://localhost:3000/api/news-posts';
const API_KEY = 'test-api-key-dev-2024';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
}

async function createPost(data: any, apiKey: string = API_KEY) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return { status: response.status, data: await response.json() };
}

async function runSecurityTests() {
  console.log('🔒 Running News API Security Tests...\n');

  // Test 1: XSS Prevention - HTML Tags
  console.log('\n--- XSS Prevention Tests ---');
  const xssTest1 = await createPost({
    content: '<script>alert("XSS")</script>This is a test about the recruitment law',
    sourceUrl: `https://www.ynet.co.il/article/xss-test-${Date.now()}`,
  });
  logTest(
    'XSS - Script Tag Removal',
    xssTest1.status === 201 && !xssTest1.data.data?.content.includes('<script>'),
    xssTest1.status === 201 ? 'Script tags removed' : `Failed: ${xssTest1.data.error || 'Unknown error'}`
  );

  // Test 2: XSS Prevention - Event Handlers
  const xssTest2 = await createPost({
    content: '<img src=x onerror="alert(1)">Normal content about the law',
    sourceUrl: `https://www.ynet.co.il/article/xss-test2-${Date.now()}`,
  });
  logTest(
    'XSS - Event Handler Removal',
    xssTest2.status === 201 && !xssTest2.data.data?.content.includes('onerror'),
    xssTest2.status === 201 ? 'Event handlers removed' : `Failed: ${xssTest2.data.error || 'Unknown error'}`
  );

  // Test 3: SSRF Prevention - Localhost
  console.log('\n--- SSRF Prevention Tests ---');
  const ssrfTest1 = await createPost({
    content: 'Testing localhost URL',
    sourceUrl: 'http://localhost:3000/admin',
  });
  logTest(
    'SSRF - Localhost Blocked',
    ssrfTest1.status === 400,
    `Status: ${ssrfTest1.status} - ${ssrfTest1.data.error || 'OK'}`
  );

  // Test 4: SSRF Prevention - Private IP
  const ssrfTest2 = await createPost({
    content: 'Testing private IP',
    sourceUrl: 'http://192.168.1.1/admin',
  });
  logTest(
    'SSRF - Private IP Blocked',
    ssrfTest2.status === 400,
    `Status: ${ssrfTest2.status} - ${ssrfTest2.data.error || 'OK'}`
  );

  // Test 5: SSRF Prevention - Cloud Metadata
  const ssrfTest3 = await createPost({
    content: 'Testing cloud metadata',
    sourceUrl: 'http://169.254.169.254/latest/meta-data/',
  });
  logTest(
    'SSRF - Cloud Metadata Blocked',
    ssrfTest3.status === 400,
    `Status: ${ssrfTest3.status} - ${ssrfTest3.data.error || 'OK'}`
  );

  // Test 6: SSRF Prevention - URL with Credentials
  const ssrfTest4 = await createPost({
    content: 'Testing URL with credentials',
    sourceUrl: 'https://user:pass@example.com/test',
  });
  logTest(
    'SSRF - URL with Credentials Blocked',
    ssrfTest4.status === 400,
    `Status: ${ssrfTest4.status} - ${ssrfTest4.data.error || 'OK'}`
  );

  // Test 7: Duplicate Detection
  console.log('\n--- Duplicate Detection Tests ---');
  const url = `https://example.com/unique-${Date.now()}`;
  const firstPost = await createPost({
    content: 'First post with this URL',
    sourceUrl: url,
  });

  // Wait a second, then try duplicate
  await new Promise(resolve => setTimeout(resolve, 1000));

  const duplicatePost = await createPost({
    content: 'Duplicate post with same URL',
    sourceUrl: url,
  });
  logTest(
    'Duplicate Detection',
    firstPost.status === 201 && duplicatePost.status === 409,
    `First: ${firstPost.status}, Duplicate: ${duplicatePost.status} (${duplicatePost.data.error || 'OK'})`
  );

  // Test 8: Spam Detection
  console.log('\n--- Spam Detection Tests ---');
  const spamTest = await createPost({
    content: 'Buy viagra now! Casino click here $$$',
    sourceUrl: 'https://example.com/spam',
  });
  logTest(
    'Spam Detection - Keywords',
    spamTest.status === 400,
    `Status: ${spamTest.status} - ${spamTest.data.error || 'OK'}`
  );

  // Test 9: Excessive URLs
  const excessiveUrlsTest = await createPost({
    content: 'Check out https://1.com https://2.com https://3.com https://4.com',
    sourceUrl: 'https://example.com/urls',
  });
  logTest(
    'Spam Detection - Excessive URLs',
    excessiveUrlsTest.status === 400,
    `Status: ${excessiveUrlsTest.status} - ${excessiveUrlsTest.data.error || 'OK'}`
  );

  // Test 10: Request Size Limit
  console.log('\n--- Request Size Tests ---');
  const largeContent = 'A'.repeat(200 * 1024); // 200KB
  const sizeTest = await createPost({
    content: largeContent,
    sourceUrl: 'https://example.com/large',
  });
  logTest(
    'Request Size Limit',
    sizeTest.status === 413 || sizeTest.status === 400,
    `Status: ${sizeTest.status} - ${sizeTest.data.error || 'Request too large'}`
  );

  // Test 11: Invalid JSON
  console.log('\n--- Input Validation Tests ---');
  const invalidJsonResponse = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: 'invalid json{',
  });
  const invalidJsonResult = await invalidJsonResponse.json().catch(() => ({ error: 'Parse error' }));
  logTest(
    'Invalid JSON Handling',
    invalidJsonResponse.status === 400,
    `Status: ${invalidJsonResponse.status} - ${invalidJsonResult.error || 'OK'}`
  );

  // Test 12: Missing Required Fields
  const missingFieldTest = await createPost({
    sourceUrl: 'https://example.com/missing',
    // Missing content field
  });
  logTest(
    'Missing Required Fields',
    missingFieldTest.status === 400,
    `Status: ${missingFieldTest.status} - ${missingFieldTest.data.error || 'OK'}`
  );

  // Test 13: Content Too Short (after sanitization)
  const shortContentTest = await createPost({
    content: '<div></div>abc', // After sanitization, only "abc" remains (too short)
    sourceUrl: 'https://example.com/short',
  });
  logTest(
    'Content Too Short After Sanitization',
    shortContentTest.status === 400,
    `Status: ${shortContentTest.status} - ${shortContentTest.data.error || 'OK'}`
  );

  // Test 14: Invalid URL Format
  const invalidUrlTest = await createPost({
    content: 'Valid content here',
    sourceUrl: 'not-a-valid-url',
  });
  logTest(
    'Invalid URL Format',
    invalidUrlTest.status === 400,
    `Status: ${invalidUrlTest.status} - ${invalidUrlTest.data.error || 'OK'}`
  );

  // Test 15: Invalid API Key
  console.log('\n--- Authentication Tests ---');
  const invalidKeyTest = await createPost(
    {
      content: 'Testing with invalid key',
      sourceUrl: 'https://example.com/auth',
    },
    'invalid-api-key-12345'
  );
  logTest(
    'Invalid API Key',
    invalidKeyTest.status === 401,
    `Status: ${invalidKeyTest.status} - ${invalidKeyTest.data.error || 'OK'}`
  );

  // Test 16: Missing API Key
  const noKeyResponse = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'Testing without API key',
      sourceUrl: 'https://example.com/nokey',
    }),
  });
  const noKeyResult = await noKeyResponse.json();
  logTest(
    'Missing API Key',
    noKeyResponse.status === 401,
    `Status: ${noKeyResponse.status} - ${noKeyResult.error || 'OK'}`
  );

  // Test 17: CORS Headers
  console.log('\n--- CORS Tests ---');
  const corsResponse = await fetch(API_URL, {
    method: 'OPTIONS',
  });
  const corsHeaders = corsResponse.headers;
  logTest(
    'CORS OPTIONS Method',
    corsResponse.status === 204 && corsHeaders.has('access-control-allow-origin'),
    `Status: ${corsResponse.status}, CORS headers present: ${corsHeaders.has('access-control-allow-origin')}`
  );

  // Test 18: Valid Post with All Fields
  console.log('\n--- Valid Request Tests ---');
  const validPost = await createPost({
    content: 'This is a valid news post about the IDF recruitment law',
    sourceUrl: `https://www.ynet.co.il/article/${Date.now()}`,
    sourceName: 'ידיעות אחרונות',
    postedAt: new Date().toISOString(),
  });
  logTest(
    'Valid Post Creation',
    validPost.status === 201,
    `Status: ${validPost.status} - Post ID: ${validPost.data.data?.id || 'N/A'}`
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${passRate}%)`);
  console.log(`Failed: ${totalTests - passedTests}`);

  if (passedTests === totalTests) {
    console.log('\n✨ All security tests passed! API is secure.');
  } else {
    console.log('\n⚠️  Some tests failed. Review security implementation.');
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }
}

// Run tests
runSecurityTests().catch(console.error);

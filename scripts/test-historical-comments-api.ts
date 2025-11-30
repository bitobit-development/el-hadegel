#!/usr/bin/env tsx
/**
 * Historical Comments API Integration Tests
 * Tests the /api/historical-comments endpoint with real database
 *
 * Usage: npx tsx scripts/test-historical-comments-api.ts
 */

import dotenv from 'dotenv'

dotenv.config()

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
const API_KEY = process.env.NEWS_API_KEY || 'test-api-key-dev-2024'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    results.push({ name, passed: true, duration: Date.now() - start })
    console.log(`✓ ${name}`)
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    })
    console.error(`✗ ${name}`)
    console.error(`  Error: ${error}`)
  }
}

// Helper function to make API requests
async function apiRequest(
  method: string,
  endpoint: string,
  body?: any,
  useAuth = true
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (useAuth) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()
  return { status: response.status, data, headers: response.headers }
}

// Test data
const validComment = {
  mkId: 1,
  content: 'אני תומך בחוק הגיוס החדש כי זה חשוב לביטחון המדינה',
  sourceUrl: 'https://x.com/test_mk/status/123456789',
  sourcePlatform: 'Twitter',
  sourceType: 'Primary',
  commentDate: '2024-01-15T10:00:00Z',
}

// === AUTHENTICATION TESTS ===
async function testAuthentication() {
  await runTest('Should accept valid API key', async () => {
    const { status } = await apiRequest('GET', '/api/historical-comments')
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
  })

  await runTest('Should reject invalid API key', async () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid-key-12345',
    }

    const response = await fetch(`${API_BASE}/api/historical-comments`, {
      method: 'GET',
      headers,
    })

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`)
    }
  })

  await runTest('Should reject missing API key', async () => {
    const { status } = await apiRequest(
      'GET',
      '/api/historical-comments',
      undefined,
      false
    )
    if (status !== 401) throw new Error(`Expected 401, got ${status}`)
  })
}

// === POST ENDPOINT TESTS ===
async function testPostEndpoint() {
  await runTest('Should create valid comment', async () => {
    const { status, data } = await apiRequest(
      'POST',
      '/api/historical-comments',
      validComment
    )
    if (status !== 201) throw new Error(`Expected 201, got ${status}`)
    if (!data.success) throw new Error('Expected success: true')
    if (!data.comment) throw new Error('Expected comment data')
  })

  await runTest('Should reject invalid MK ID', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      mkId: 99999,
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
    if (!data.error) throw new Error('Expected error message')
  })

  await runTest('Should reject non-coalition MK', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      mkId: 2, // Opposition MK
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
    if (!data.error?.includes('coalition')) {
      throw new Error('Expected coalition error message')
    }
  })

  await runTest('Should reject missing required fields', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      mkId: 1,
      content: 'Test',
      // Missing other required fields
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await runTest('Should reject content without recruitment keywords', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      content: 'דיון על תקציב המדינה',
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
    if (!data.error?.includes('recruitment law')) {
      throw new Error('Expected recruitment law keyword error')
    }
  })

  await runTest('Should detect duplicate content', async () => {
    // Create original comment
    await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      sourceUrl: 'https://x.com/original/123',
    })

    // Try to create duplicate with different URL
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      sourceUrl: 'https://facebook.com/duplicate/456',
    })

    if (status !== 201) throw new Error(`Expected 201, got ${status}`)
    if (!data.comment.isDuplicate) {
      throw new Error('Expected comment to be marked as duplicate')
    }
  })

  await runTest('Should reject content too short', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      content: 'גיוס',
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await runTest('Should reject content too long', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      content: 'גיוס '.repeat(1000), // ~5000 chars
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await runTest('Should reject invalid platform', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      sourcePlatform: 'InvalidPlatform',
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await runTest('Should reject invalid source type', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      sourceType: 'InvalidType',
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })

  await runTest('Should handle optional fields', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      sourceName: 'הארץ',
      imageUrl: 'https://example.com/image.jpg',
      videoUrl: 'https://youtube.com/watch?v=123',
      sourceUrl: 'https://x.com/test_mk/status/987654321', // Unique URL
    })
    if (status !== 201) throw new Error(`Expected 201, got ${status}`)
    if (!data.comment.sourceName) throw new Error('Expected sourceName to be saved')
  })
}

// === GET ENDPOINT TESTS ===
async function testGetEndpoint() {
  await runTest('Should fetch all comments', async () => {
    const { status, data } = await apiRequest('GET', '/api/historical-comments')
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected array of comments')
  })

  await runTest('Should filter by mkId', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?mkId=1'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected array')
    if (data.length > 0 && data[0].mkId !== 1) {
      throw new Error('Expected all comments to have mkId=1')
    }
  })

  await runTest('Should filter by platform', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?platform=Twitter'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected array')
  })

  await runTest('Should filter by verified status', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?verified=true'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected array')
  })

  await runTest('Should respect pagination (limit)', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?limit=5'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected array')
    if (data.length > 5) throw new Error('Expected max 5 items')
  })

  await runTest('Should respect pagination (offset)', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?offset=10'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected array')
  })

  await runTest('Should sort by date', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?sortBy=date&sortOrder=desc'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (data.length > 1) {
      const date1 = new Date(data[0].commentDate).getTime()
      const date2 = new Date(data[1].commentDate).getTime()
      if (date1 < date2) throw new Error('Expected descending date order')
    }
  })

  await runTest('Should sort by credibility', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?sortBy=credibility&sortOrder=desc'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (data.length > 1) {
      if (data[0].sourceCredibility < data[1].sourceCredibility) {
        throw new Error('Expected descending credibility order')
      }
    }
  })

  await runTest('Should reject invalid sort field', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?sortBy=invalid'
    )
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })
}

// === EDGE CASES ===
async function testEdgeCases() {
  await runTest('Should handle empty query parameters', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?mkId=&platform='
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
  })

  await runTest('Should handle very large offset', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?offset=100000'
    )
    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!Array.isArray(data)) throw new Error('Expected empty array')
  })

  await runTest('Should handle negative limit', async () => {
    const { status, data } = await apiRequest(
      'GET',
      '/api/historical-comments?limit=-1'
    )
    // Should either reject or treat as default
    if (status !== 200 && status !== 400) {
      throw new Error(`Expected 200 or 400, got ${status}`)
    }
  })

  await runTest('Should handle invalid date format', async () => {
    const { status, data } = await apiRequest('POST', '/api/historical-comments', {
      ...validComment,
      commentDate: 'invalid-date',
      sourceUrl: 'https://x.com/edge_case/123',
    })
    if (status !== 400) throw new Error(`Expected 400, got ${status}`)
  })
}

// === RATE LIMITING TESTS ===
async function testRateLimiting() {
  await runTest('Should include rate limit headers', async () => {
    const { headers } = await apiRequest('GET', '/api/historical-comments')
    if (!headers.get('X-RateLimit-Limit')) {
      throw new Error('Expected X-RateLimit-Limit header')
    }
    if (!headers.get('X-RateLimit-Remaining')) {
      throw new Error('Expected X-RateLimit-Remaining header')
    }
    if (!headers.get('X-RateLimit-Reset')) {
      throw new Error('Expected X-RateLimit-Reset header')
    }
  })
}

// === MAIN TEST RUNNER ===
async function main() {
  console.log('🧪 Historical Comments API Integration Tests\n')
  console.log(`API Base: ${API_BASE}`)
  console.log(`Using API Key: ${API_KEY.substring(0, 10)}...\n`)

  const startTime = Date.now()

  console.log('--- Authentication Tests ---')
  await testAuthentication()

  console.log('\n--- POST Endpoint Tests ---')
  await testPostEndpoint()

  console.log('\n--- GET Endpoint Tests ---')
  await testGetEndpoint()

  console.log('\n--- Edge Cases ---')
  await testEdgeCases()

  console.log('\n--- Rate Limiting Tests ---')
  await testRateLimiting()

  const totalTime = Date.now() - startTime
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => r.passed === false).length

  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total Tests: ${results.length}`)
  console.log(`Passed: ${passed} ✓`)
  console.log(`Failed: ${failed} ✗`)
  console.log(`Duration: ${totalTime}ms`)
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`)
        console.log(`    Error: ${r.error}`)
      })
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})

#!/usr/bin/env tsx
/**
 * Historical Comments Performance Benchmark Tests
 *
 * Usage: npx tsx scripts/test-historical-comments-performance.ts
 */

import {
  generateContentHash,
  calculateSimilarity,
  normalizeContent,
} from '@/lib/content-hash'
import dotenv from 'dotenv'

dotenv.config()

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
const API_KEY = process.env.NEWS_API_KEY || 'test-api-key-dev-2024'

interface BenchmarkResult {
  name: string
  iterations: number
  totalTime: number
  avgTime: number
  passed: boolean
  threshold: number
}

const results: BenchmarkResult[] = []

function benchmark(
  name: string,
  iterations: number,
  fn: () => void | Promise<void>,
  threshold: number
): Promise<void> {
  return new Promise(async (resolve) => {
    const start = Date.now()

    for (let i = 0; i < iterations; i++) {
      await fn()
    }

    const totalTime = Date.now() - start
    const avgTime = totalTime / iterations
    const passed = totalTime <= threshold

    results.push({
      name,
      iterations,
      totalTime,
      avgTime,
      passed,
      threshold,
    })

    const status = passed ? '✓' : '✗'
    console.log(
      `${status} ${name}: ${totalTime}ms total (${avgTime.toFixed(2)}ms avg) [threshold: ${threshold}ms]`
    )

    resolve()
  })
}

async function runBenchmarks() {
  console.log('🚀 Historical Comments Performance Benchmarks\n')

  // Sample data
  const sampleContent = 'אני תומך בחוק הגיוס לצבא כי זה חשוב לביטחון המדינה'
  const similarContent = 'אני תומך בחוק גיוס צבא כי זה חשוב לביטחון'
  const longContent = 'גיוס '.repeat(500) // ~2500 chars

  // === HASH GENERATION BENCHMARK ===
  console.log('--- Hash Generation ---')
  await benchmark(
    'Generate 1000 content hashes',
    1000,
    () => {
      generateContentHash(sampleContent)
    },
    100 // Should be < 100ms total
  )

  // === SIMILARITY CALCULATION BENCHMARK ===
  console.log('\n--- Similarity Calculation ---')
  await benchmark(
    'Calculate similarity for 100 pairs',
    100,
    () => {
      const normalized1 = normalizeContent(sampleContent)
      const normalized2 = normalizeContent(similarContent)
      calculateSimilarity(normalized1, normalized2)
    },
    500 // Should be < 500ms total
  )

  // === CONTENT NORMALIZATION BENCHMARK ===
  console.log('\n--- Content Normalization ---')
  await benchmark(
    'Normalize 1000 comments',
    1000,
    () => {
      normalizeContent(sampleContent)
    },
    100 // Should be < 100ms total
  )

  // === LONG CONTENT BENCHMARK ===
  console.log('\n--- Long Content Processing ---')
  await benchmark(
    'Hash generation for 100 long comments (2500 chars)',
    100,
    () => {
      generateContentHash(longContent)
    },
    200 // Should be < 200ms total
  )

  // === API RESPONSE TIME ===
  console.log('\n--- API Performance ---')
  await benchmark(
    'GET request average response time',
    10,
    async () => {
      await fetch(`${API_BASE}/api/historical-comments?limit=50`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      })
    },
    3000 // Should be < 3s total (300ms avg per request)
  )

  await benchmark(
    'POST request average response time',
    5,
    async () => {
      await fetch(`${API_BASE}/api/historical-comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mkId: 1,
          content: `אני תומך בחוק הגיוס ${Date.now()}`, // Unique content
          sourceUrl: `https://x.com/test/${Date.now()}`,
          sourcePlatform: 'Twitter',
          sourceType: 'Primary',
          commentDate: new Date().toISOString(),
        }),
      })
    },
    1000 // Should be < 1s total (200ms avg per request)
  )

  // === BATCH OPERATIONS ===
  console.log('\n--- Batch Operations ---')
  const testComments = Array.from({ length: 100 }, (_, i) => ({
    content: `תגובה ${i} על חוק הגיוס`,
    normalized: normalizeContent(`תגובה ${i} על חוק הגיוס`),
  }))

  await benchmark(
    'Filter 100 comments client-side',
    100,
    () => {
      testComments.filter((c) => c.content.includes('גיוס'))
    },
    50 // Should be < 50ms total
  )
}

async function main() {
  await runBenchmarks()

  console.log('\n' + '='.repeat(60))
  console.log('BENCHMARK SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log(`Total Benchmarks: ${results.length}`)
  console.log(`Passed: ${passed} ✓`)
  console.log(`Failed: ${failed} ✗`)

  if (failed > 0) {
    console.log('\n❌ FAILED BENCHMARKS:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}`)
        console.log(`    Total: ${r.totalTime}ms (threshold: ${r.threshold}ms)`)
        console.log(`    Average: ${r.avgTime.toFixed(2)}ms`)
      })
  }

  console.log('\n📊 DETAILED RESULTS:')
  console.table(
    results.map((r) => ({
      Benchmark: r.name,
      Iterations: r.iterations,
      'Total (ms)': r.totalTime,
      'Avg (ms)': r.avgTime.toFixed(2),
      'Threshold (ms)': r.threshold,
      Status: r.passed ? '✓' : '✗',
    }))
  )

  if (failed > 0) {
    console.log('\n⚠️  Some benchmarks exceeded performance thresholds')
    process.exit(1)
  } else {
    console.log('\n✅ All benchmarks passed!')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('Fatal error running benchmarks:', error)
  process.exit(1)
})

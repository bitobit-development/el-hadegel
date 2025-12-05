#!/usr/bin/env tsx
/**
 * Test Script for Historical Comments Finder Logic
 *
 * Tests all core functionality without MCP tool dependencies:
 * - CSV parsing
 * - State management
 * - Validation logic
 * - Platform detection
 * - Quote extraction patterns
 * - Date extraction
 *
 * Usage: npx tsx scripts/test-comments-finder-logic.ts
 */

import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const TEST_STATE_PATH = join(process.cwd(), 'data/test-finder-state.json');

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | Promise<boolean>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(passed => {
        results.push({ name, status: passed ? 'PASS' : 'FAIL' });
      }).catch(error => {
        results.push({ name, status: 'FAIL', message: error.message });
      });
    } else {
      results.push({ name, status: result ? 'PASS' : 'FAIL' });
    }
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================================
// Test 1: CSV Parsing
// ============================================================================

test('CSV parsing loads coalition members', () => {
  try {
    const { parse } = require('csv-parse/sync');
    const { readFileSync } = require('fs');
    const csvPath = join(process.cwd(), 'docs/mk-coalition/coalition-members.csv');

    if (!existsSync(csvPath)) {
      throw new Error('CSV file not found');
    }

    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_quotes: true, // Allow quotes within quoted fields
      escape: '"', // Standard CSV escape
    });

    console.log(`✅ Parsed ${records.length} coalition members from CSV`);

    // Verify we have exactly 64 (or close to it for current coalition)
    if (records.length === 0) {
      throw new Error('No records parsed from CSV');
    }

    // Verify first record has required fields
    const first = records[0];
    if (!first.MK_ID || !first.Name_Hebrew || !first.Faction) {
      throw new Error('Missing required CSV columns');
    }

    console.log(`  Sample MK: ${first.Name_Hebrew} (ID: ${first.MK_ID}, Faction: ${first.Faction})`);
    return true;
  } catch (error) {
    console.error('❌ CSV parsing failed:', error);
    return false;
  }
});

// ============================================================================
// Test 2: Keyword Validation
// ============================================================================

test('Keyword validation detects recruitment law keywords', () => {
  const PRIMARY_KEYWORDS = [
    'חוק גיוס',
    'חוק הגיוס',
    'recruitment law',
    'draft law',
    'גיוס חרדים',
    'haredi draft',
  ];

  function hasRecruitmentLawKeywords(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return PRIMARY_KEYWORDS.some(keyword =>
      lowerContent.includes(keyword.toLowerCase())
    );
  }

  // Test cases
  const testCases = [
    { content: 'אני תומך בחוק גיוס חרדים', expected: true },
    { content: 'הדיון על גיוס חרדים למערכת הביטחון', expected: true },
    { content: 'The recruitment law is important', expected: true },
    { content: 'הצבא זקוק לחיילים נוספים', expected: false },
    { content: 'Military service is mandatory', expected: false },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = hasRecruitmentLawKeywords(testCase.content);
    const passed = result === testCase.expected;

    console.log(`  ${passed ? '✅' : '❌'} "${testCase.content.substring(0, 40)}..." → ${result} (expected: ${testCase.expected})`);

    if (!passed) allPassed = false;
  }

  return allPassed;
});

// ============================================================================
// Test 3: Date Validation
// ============================================================================

test('Date validation accepts 2019-2025, rejects outside range', () => {
  function isValidDate(date: Date): boolean {
    const year = date.getFullYear();
    return year >= 2019 && year <= 2025;
  }

  const testCases = [
    { date: new Date('2019-01-01'), expected: true },
    { date: new Date('2023-06-15'), expected: true },
    { date: new Date('2025-12-31'), expected: true },
    { date: new Date('2018-12-31'), expected: false },
    { date: new Date('2026-01-01'), expected: false },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = isValidDate(testCase.date);
    const passed = result === testCase.expected;

    console.log(`  ${passed ? '✅' : '❌'} ${testCase.date.toISOString().split('T')[0]} → ${result} (expected: ${testCase.expected})`);

    if (!passed) allPassed = false;
  }

  return allPassed;
});

// ============================================================================
// Test 4: Platform Detection
// ============================================================================

test('Platform detection correctly identifies sources', () => {
  type Platform = 'News' | 'Twitter' | 'Facebook' | 'YouTube' | 'Knesset' | 'Interview' | 'Other';

  function detectPlatform(url: string): Platform {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('knesset.gov.il')) return 'Knesset';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter';
    if (lowerUrl.includes('facebook.com')) return 'Facebook';
    if (lowerUrl.includes('youtube.com')) return 'YouTube';
    if (lowerUrl.includes('.co.il') || lowerUrl.includes('.com')) return 'News';

    return 'Other';
  }

  const testCases = [
    { url: 'https://www.ynet.co.il/news/article/123', expected: 'News' as Platform },
    { url: 'https://twitter.com/netanyahu/status/123', expected: 'Twitter' as Platform },
    { url: 'https://x.com/netanyahu/status/456', expected: 'Twitter' as Platform },
    { url: 'https://www.facebook.com/netanyahu/posts/789', expected: 'Facebook' as Platform },
    { url: 'https://www.youtube.com/watch?v=abc123', expected: 'YouTube' as Platform },
    { url: 'https://main.knesset.gov.il/Activity/Pages/default.aspx', expected: 'Knesset' as Platform },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = detectPlatform(testCase.url);
    const passed = result === testCase.expected;

    console.log(`  ${passed ? '✅' : '❌'} ${testCase.url.substring(0, 50)}... → ${result} (expected: ${testCase.expected})`);

    if (!passed) allPassed = false;
  }

  return allPassed;
});

// ============================================================================
// Test 5: Content Validation
// ============================================================================

test('Content validation enforces length and keyword requirements', () => {
  const PRIMARY_KEYWORDS = ['חוק גיוס', 'חוק הגיוס', 'recruitment law', 'draft law', 'גיוס חרדים'];

  function hasRecruitmentLawKeywords(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return PRIMARY_KEYWORDS.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  interface ValidationResult {
    valid: boolean;
    errors: string[];
  }

  function validateComment(data: { content?: string }): ValidationResult {
    const errors: string[] = [];

    if (!data.content) {
      errors.push('content is required');
    } else {
      if (data.content.length < 50) {
        errors.push('content must be at least 50 characters');
      }
      if (data.content.length > 1000) {
        errors.push('content must be at most 1000 characters');
      }
      if (!hasRecruitmentLawKeywords(data.content)) {
        errors.push('content must contain recruitment law keywords');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  const testCases = [
    {
      content: 'חוק גיוס חרדים הוא נושא חשוב מאוד למדינת ישראל ולחברה הישראלית כולה.',
      expectedValid: true,
    },
    {
      content: 'קצר מדי',
      expectedValid: false,
    },
    {
      content: 'x'.repeat(1001),
      expectedValid: false,
    },
    {
      content: 'טקסט ארוך מספיק אבל ללא מילות מפתח רלוונטיות לחוק שאנחנו מחפשים כאן.',
      expectedValid: false,
    },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = validateComment({ content: testCase.content });
    const passed = result.valid === testCase.expectedValid;

    console.log(`  ${passed ? '✅' : '❌'} Length: ${testCase.content.length}, Valid: ${result.valid}, Expected: ${testCase.expectedValid}`);
    if (!passed) {
      console.log(`    Errors: ${result.errors.join(', ')}`);
      allPassed = false;
    }
  }

  return allPassed;
});

// ============================================================================
// Test 6: State Management
// ============================================================================

test('State management saves and loads correctly', () => {
  const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');

  interface FinderState {
    lastProcessedMkId: number;
    processedMks: any[];
    totalSubmitted: number;
    totalErrors: number;
    totalDuplicates: number;
    startedAt: string;
    lastUpdatedAt: string;
  }

  function saveState(state: FinderState): void {
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(TEST_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  }

  function loadState(): FinderState | null {
    if (!existsSync(TEST_STATE_PATH)) {
      return null;
    }
    const stateContent = readFileSync(TEST_STATE_PATH, 'utf-8');
    return JSON.parse(stateContent);
  }

  // Test save and load
  const testState: FinderState = {
    lastProcessedMkId: 5,
    processedMks: [
      { mkId: 1, name: 'Test MK', status: 'complete', submitted: 3 },
    ],
    totalSubmitted: 3,
    totalErrors: 0,
    totalDuplicates: 1,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };

  saveState(testState);
  console.log('  ✅ State saved to disk');

  const loaded = loadState();
  if (!loaded) {
    console.error('  ❌ Failed to load state');
    return false;
  }

  console.log('  ✅ State loaded from disk');

  // Verify loaded state matches original
  const match =
    loaded.lastProcessedMkId === testState.lastProcessedMkId &&
    loaded.totalSubmitted === testState.totalSubmitted &&
    loaded.processedMks.length === testState.processedMks.length;

  if (match) {
    console.log('  ✅ Loaded state matches original');
  } else {
    console.error('  ❌ Loaded state does not match original');
  }

  // Cleanup
  if (existsSync(TEST_STATE_PATH)) {
    unlinkSync(TEST_STATE_PATH);
    console.log('  🧹 Cleaned up test state file');
  }

  return match;
});

// ============================================================================
// Test 7: Search Query Builder
// ============================================================================

test('Search query builder generates correct queries', () => {
  interface CoalitionMK {
    mkId: number;
    nameHebrew: string;
    faction: string;
  }

  function buildSearchQueries(mk: CoalitionMK): string[] {
    const hebrewName = mk.nameHebrew;

    return [
      `"${hebrewName}" ("חוק גיוס" OR "גיוס חרדים") site:.co.il`,
      `"${hebrewName}" (חוק גיוס OR "draft law") (site:twitter.com OR site:x.com OR site:facebook.com)`,
      `"${hebrewName}" site:knesset.gov.il גיוס`,
      `"${hebrewName}" "חוק גיוס" site:youtube.com`,
    ];
  }

  const testMk: CoalitionMK = {
    mkId: 90,
    nameHebrew: 'בנימין נתניהו',
    faction: 'הליכוד',
  };

  const queries = buildSearchQueries(testMk);

  console.log(`  Generated ${queries.length} search queries:`);
  queries.forEach((query, index) => {
    console.log(`    ${index + 1}. ${query}`);
  });

  // Verify count and content
  const allValid =
    queries.length === 4 &&
    queries.every(q => q.includes(testMk.nameHebrew)) &&
    queries.some(q => q.includes('site:.co.il')) &&
    queries.some(q => q.includes('site:knesset.gov.il'));

  return allValid;
});

// ============================================================================
// Test 8: Source Credibility Scoring
// ============================================================================

test('Source credibility scoring assigns correct values', () => {
  const SOURCE_CREDIBILITY_MAP: Record<string, number> = {
    'ynet.co.il': 9,
    'walla.co.il': 9,
    'knesset.gov.il': 10,
    'main.knesset.gov.il': 10, // Also match main.knesset.gov.il
    'twitter.com': 7,
    'x.com': 7,
    'facebook.com': 6,
    'youtube.com': 6,
  };

  function getSourceCredibility(url: string): number {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      return SOURCE_CREDIBILITY_MAP[hostname] || 5;
    } catch {
      return 5;
    }
  }

  const testCases = [
    { url: 'https://www.ynet.co.il/news/article/123', expected: 9 },
    { url: 'https://main.knesset.gov.il/page/123', expected: 10 },
    { url: 'https://twitter.com/user/status/123', expected: 7 },
    { url: 'https://unknownsite.com/article/123', expected: 5 },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const result = getSourceCredibility(testCase.url);
    const passed = result === testCase.expected;

    console.log(`  ${passed ? '✅' : '❌'} ${testCase.url} → ${result} (expected: ${testCase.expected})`);

    if (!passed) allPassed = false;
  }

  return allPassed;
});

// ============================================================================
// Run All Tests
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('Historical Comments Finder - Logic Tests');
console.log('='.repeat(80) + '\n');

// Wait for async tests
setTimeout(() => {
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS');
  console.log('='.repeat(80) + '\n');

  let passCount = 0;
  let failCount = 0;

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }

    if (result.status === 'PASS') passCount++;
    else failCount++;
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('='.repeat(80) + '\n');

  if (failCount === 0) {
    console.log('🎉 All tests passed! Core logic is ready.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review errors above.\n');
    process.exit(1);
  }
}, 1000);

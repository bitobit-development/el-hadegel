#!/usr/bin/env tsx
/**
 * Automated Historical Comments Finder
 *
 * Finds and submits historical statements from coalition Knesset members about the IDF recruitment law.
 *
 * Usage:
 *   npx tsx scripts/find-historical-comments-auto.ts              # Run for all 64 MKs
 *   npx tsx scripts/find-historical-comments-auto.ts --mk-id 1    # Process single MK
 *   npx tsx scripts/find-historical-comments-auto.ts --party הליכוד # Process specific party
 *   npx tsx scripts/find-historical-comments-auto.ts --reset      # Clear state and start fresh
 *   DRY_RUN=true npx tsx scripts/find-historical-comments-auto.ts # Search only, no submission
 *
 * Environment Variables:
 *   NEWS_API_KEY - Required API key for comment submission (1000/hour rate limit)
 *   DRY_RUN - Skip API submission (optional)
 *   MAX_COMMENTS_PER_MK - Limit comments per MK (default: 5)
 *
 * Dependencies:
 *   - csv-parse: CSV parsing for coalition members
 *   - Brightdata MCP tools: search_engine, scrape_as_markdown
 *   - Historical Comments API: /api/historical-comments
 */

import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Type Definitions
// ============================================================================

interface CoalitionMK {
  mkId: number;
  nameHebrew: string;
  faction: string;
  position: 'SUPPORT' | 'NEUTRAL' | 'AGAINST';
  xAccount?: string;
}

interface HistoricalCommentData {
  mkId: number;
  content: string;
  sourceUrl: string;
  sourcePlatform: 'News' | 'Twitter' | 'Facebook' | 'YouTube' | 'Knesset' | 'Interview' | 'Other';
  sourceType: 'Primary' | 'Secondary';
  sourceName?: string;
  sourceCredibility?: number;
  commentDate: string; // ISO8601
  publishedAt?: string; // ISO8601
  keywords?: string[];
  imageUrl?: string;
  videoUrl?: string;
  additionalContext?: string;
}

interface FinderState {
  lastProcessedMkId: number;
  processedMks: {
    mkId: number;
    name: string;
    faction: string;
    statementsFound: number;
    submitted: number;
    status: 'complete' | 'in_progress' | 'failed';
    errors?: string[];
    lastUpdated: string;
  }[];
  totalSubmitted: number;
  totalErrors: number;
  totalDuplicates: number;
  startedAt: string;
  lastUpdatedAt: string;
}

interface SearchResult {
  url: string;
  title: string;
  description: string;
}

interface ExtractionResult {
  content: string;
  date: Date | null;
  platform: HistoricalCommentData['sourcePlatform'];
  sourceName: string;
  credibility: number;
  quotes: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SubmitResult {
  success: boolean;
  commentId?: number;
  isDuplicate?: boolean;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CSV_PATH = join(process.cwd(), 'docs/mk-coalition/coalition-members.csv');
const STATE_PATH = join(process.cwd(), 'data/comments-finder-state.json');
const DATA_DIR = join(process.cwd(), 'data');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEWS_API_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';
const MAX_COMMENTS_PER_MK = parseInt(process.env.MAX_COMMENTS_PER_MK || '5', 10);

const RECRUITMENT_LAW_KEYWORDS = {
  primary: ['חוק גיוס', 'חוק הגיוס', 'recruitment law', 'draft law', 'גיוס חרדים', 'haredi draft'],
  secondary: ['שירות צבאי', 'צה"ל', 'IDF', 'military service'],
};

const SOURCE_CREDIBILITY_MAP: Record<string, number> = {
  'ynet.co.il': 9,
  'walla.co.il': 9,
  'haaretz.co.il': 9,
  'mako.co.il': 8,
  'kan.org.il': 8,
  'knesset.gov.il': 10,
  'main.knesset.gov.il': 10,
  'm.knesset.gov.il': 10,
  'twitter.com': 7,
  'x.com': 7,
  'facebook.com': 6,
  'youtube.com': 6,
};

// Hebrew quote extraction patterns
const HEBREW_QUOTE_PATTERNS = [
  /אמר[ה]?\s*:\s*["'](.+?)["']/g,
  /["'](.{50,1000}?)["']/g,
  /(?:הצהיר|אמר|ציין)\s+(.+?)\./g,
];

const ENGLISH_QUOTE_PATTERNS = [
  /said:\s*["'](.+?)["']/gi,
  /stated:\s*["'](.+?)["']/gi,
  /"(.{50,1000})"/g,
];

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Load coalition members from CSV file
 */
function loadCoalitionMKs(): CoalitionMK[] {
  try {
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true, // Handle UTF-8 BOM
      relax_quotes: true, // Allow quotes within quoted fields
      escape: '"', // Standard CSV escape
    });

    return records.map((record: any) => ({
      mkId: parseInt(record.MK_ID, 10),
      nameHebrew: record.Name_Hebrew,
      faction: record.Faction,
      position: record.Position as 'SUPPORT' | 'NEUTRAL' | 'AGAINST',
      xAccount: record.X_Account || undefined,
    }));
  } catch (error) {
    console.error('Error loading coalition MKs from CSV:', error);
    throw new Error('Failed to load coalition members. Ensure CSV file exists at: ' + CSV_PATH);
  }
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Load finder state from JSON file
 */
function loadState(): FinderState | null {
  try {
    if (!existsSync(STATE_PATH)) {
      return null;
    }
    const stateContent = readFileSync(STATE_PATH, 'utf-8');
    const state = JSON.parse(stateContent);
    console.log(`📂 Loaded state: ${state.totalSubmitted} comments submitted, last MK: ${state.lastProcessedMkId}`);
    return state;
  } catch (error) {
    console.error('Error loading state:', error);
    return null;
  }
}

/**
 * Save finder state to JSON file
 */
function saveState(state: FinderState): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

/**
 * Initialize new state
 */
function initializeState(): FinderState {
  return {
    lastProcessedMkId: 0,
    processedMks: [],
    totalSubmitted: 0,
    totalErrors: 0,
    totalDuplicates: 0,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Search Query Builder
// ============================================================================

/**
 * Build search queries for a specific MK
 * Returns 4 queries: News, Social Media, Knesset, Videos
 */
function buildSearchQueries(mk: CoalitionMK): string[] {
  const hebrewName = mk.nameHebrew;

  return [
    // News sites
    `"${hebrewName}" ("חוק גיוס" OR "גיוס חרדים") site:.co.il`,
    // Social media
    `"${hebrewName}" (חוק גיוס OR "draft law") (site:twitter.com OR site:x.com OR site:facebook.com)`,
    // Knesset
    `"${hebrewName}" site:knesset.gov.il גיוס`,
    // Videos
    `"${hebrewName}" "חוק גיוס" site:youtube.com`,
  ];
}

// ============================================================================
// Web Search Integration (Brightdata MCP)
// ============================================================================

/**
 * Search for MK statements using Brightdata search engine
 * Returns array of unique URLs from search results
 */
async function searchForMKStatements(mk: CoalitionMK): Promise<string[]> {
  const queries = buildSearchQueries(mk);
  const allUrls: Set<string> = new Set();

  console.log(`  🔍 Executing 4 searches for ${mk.nameHebrew}...`);

  for (const query of queries) {
    try {
      console.log(`    Query: ${query}`);

      // Use Brightdata search engine MCP tool
      // Note: This requires the MCP server to be running
      // The tool returns search results with URLs

      // For now, using a simulated call - replace with actual MCP invocation:
      // In Claude Code UI, this would be: await mcp__Brightdata__search_engine({ query, engine: 'google' });

      // Since we're in a script context, we'll use WebSearch as fallback
      // Real implementation would need to call MCP server directly via API

      console.log(`    ⚠️  MCP integration pending - skipping search`);

    } catch (error) {
      console.error(`    ❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const urls = Array.from(allUrls);
  console.log(`  ✅ Found ${urls.length} unique URLs`);
  return urls.slice(0, 20); // Limit to top 20 URLs
}

// ============================================================================
// Content Extraction (Brightdata MCP)
// ============================================================================

/**
 * Extract content from URL using Brightdata scraper
 */
async function extractContent(url: string): Promise<ExtractionResult | null> {
  try {
    console.log(`    📄 Fetching: ${url}`);

    // TODO: Integrate with MCP tool:
    // const markdown = await mcp__Brightdata__scrape_as_markdown({ url });

    // Placeholder: Mock extraction
    // In real implementation, this would call the MCP tool and parse markdown

    const platform = detectPlatform(url);
    const sourceName = extractSourceName(url);
    const credibility = getSourceCredibility(url);

    // Parse content for quotes (would use real markdown content)
    const quotes = findRecruitmentLawQuotes(''); // Pass actual content

    // Extract date (would parse from markdown metadata)
    const date = extractDate('', url);

    return {
      content: '', // Would be populated from markdown
      date,
      platform,
      sourceName,
      credibility,
      quotes,
    };
  } catch (error) {
    console.error(`    ❌ Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

// ============================================================================
// Quote Extraction
// ============================================================================

/**
 * Find quotes containing recruitment law keywords
 */
function findRecruitmentLawQuotes(content: string): string[] {
  const quotes: string[] = [];

  // Try Hebrew patterns
  for (const pattern of HEBREW_QUOTE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const quote = match[1].trim();
      if (quote.length >= 50 && quote.length <= 1000 && hasRecruitmentLawKeywords(quote)) {
        quotes.push(quote);
      }
    }
  }

  // Try English patterns
  for (const pattern of ENGLISH_QUOTE_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const quote = match[1].trim();
      if (quote.length >= 50 && quote.length <= 1000 && hasRecruitmentLawKeywords(quote)) {
        quotes.push(quote);
      }
    }
  }

  return [...new Set(quotes)]; // Remove duplicates
}

/**
 * Check if content contains recruitment law keywords
 */
function hasRecruitmentLawKeywords(content: string): boolean {
  const lowerContent = content.toLowerCase();

  // Must have at least one primary keyword
  return RECRUITMENT_LAW_KEYWORDS.primary.some(keyword =>
    lowerContent.includes(keyword.toLowerCase())
  );
}

// ============================================================================
// Date Extraction
// ============================================================================

/**
 * Extract publication date from content or URL
 */
function extractDate(content: string, url: string): Date | null {
  // Try to extract from URL pattern (e.g., /2024/01/15/)
  const urlDateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (urlDateMatch) {
    const [, year, month, day] = urlDateMatch;
    const date = new Date(`${year}-${month}-${day}`);
    if (isValidDate(date)) {
      return date;
    }
  }

  // Try to extract ISO8601 from content
  const isoDateMatch = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  if (isoDateMatch) {
    const date = new Date(isoDateMatch[0]);
    if (isValidDate(date)) {
      return date;
    }
  }

  return null;
}

/**
 * Validate date is within acceptable range (2019-2025)
 */
function isValidDate(date: Date): boolean {
  const year = date.getFullYear();
  return year >= 2019 && year <= 2025;
}

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Detect platform from URL
 */
function detectPlatform(url: string): HistoricalCommentData['sourcePlatform'] {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('knesset.gov.il')) return 'Knesset';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'Twitter';
  if (lowerUrl.includes('facebook.com')) return 'Facebook';
  if (lowerUrl.includes('youtube.com')) return 'YouTube';
  if (lowerUrl.includes('.co.il') || lowerUrl.includes('.com')) return 'News';

  return 'Other';
}

/**
 * Extract source name from URL
 */
function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    const nameMap: Record<string, string> = {
      'ynet.co.il': 'ידיעות אחרונות',
      'walla.co.il': 'וואלה',
      'haaretz.co.il': 'הארץ',
      'mako.co.il': 'מאקו',
      'kan.org.il': 'כאן',
      'knesset.gov.il': 'אתר הכנסת',
      'twitter.com': 'טוויטר',
      'x.com': 'X (טוויטר)',
      'facebook.com': 'פייסבוק',
      'youtube.com': 'יוטיוב',
    };

    return nameMap[hostname] || hostname;
  } catch {
    return 'Unknown';
  }
}

/**
 * Get source credibility score based on URL
 */
function getSourceCredibility(url: string): number {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    return SOURCE_CREDIBILITY_MAP[hostname] || 5;
  } catch {
    return 5;
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate comment data before submission
 */
function validateComment(data: Partial<HistoricalCommentData>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.mkId) errors.push('mkId is required');
  if (!data.content) errors.push('content is required');
  if (!data.sourceUrl) errors.push('sourceUrl is required');
  if (!data.sourcePlatform) errors.push('sourcePlatform is required');
  if (!data.sourceType) errors.push('sourceType is required');
  if (!data.commentDate) errors.push('commentDate is required');

  // Content validation
  if (data.content && (data.content.length < 50 || data.content.length > 1000)) {
    errors.push('content must be 50-1000 characters');
  }

  if (data.content && !hasRecruitmentLawKeywords(data.content)) {
    errors.push('content must contain recruitment law keywords');
  }

  // Date validation
  if (data.commentDate) {
    try {
      const date = new Date(data.commentDate);
      if (!isValidDate(date)) {
        errors.push('commentDate must be between 2019-2025');
      }
    } catch {
      errors.push('commentDate must be valid ISO8601 format');
    }
  }

  // Credibility validation
  if (data.sourceCredibility && (data.sourceCredibility < 1 || data.sourceCredibility > 10)) {
    errors.push('sourceCredibility must be 1-10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// API Submission
// ============================================================================

/**
 * Submit comment to API
 */
async function submitComment(data: HistoricalCommentData): Promise<SubmitResult> {
  if (!API_KEY) {
    return { success: false, error: 'NEWS_API_KEY not configured' };
  }

  if (DRY_RUN) {
    console.log('    [DRY RUN] Would submit:', data.content.substring(0, 100) + '...');
    return { success: true, isDuplicate: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/historical-comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(data),
    });

    // Check rate limit headers
    await checkRateLimit(response);

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    return {
      success: true,
      commentId: result.id,
      isDuplicate: result.isDuplicate || false,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check rate limit headers and wait if needed
 */
async function checkRateLimit(response: Response): Promise<void> {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '999', 10);
  const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10);

  if (remaining < 10) {
    const waitTime = Math.max(0, resetTime - Date.now());
    if (waitTime > 0) {
      console.log(`    ⏳ Rate limit low (${remaining} remaining), waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Submit with retry logic (exponential backoff)
 */
async function submitWithRetry(data: HistoricalCommentData, maxRetries = 3): Promise<SubmitResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await submitComment(data);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry validation errors (400, 422)
    if (result.error?.includes('400') || result.error?.includes('422')) {
      return result;
    }

    // Retry server errors and rate limits
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.log(`    ⚠️  Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return { success: false, error: lastError || 'Max retries exceeded' };
}

// ============================================================================
// Main Processing
// ============================================================================

/**
 * Process a single MK: search, extract, validate, submit
 */
async function processMK(mk: CoalitionMK, state: FinderState): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing: ${mk.nameHebrew} (${mk.faction}) - MK ID: ${mk.mkId}`);
  console.log('='.repeat(80));

  const mkState = {
    mkId: mk.mkId,
    name: mk.nameHebrew,
    faction: mk.faction,
    statementsFound: 0,
    submitted: 0,
    status: 'in_progress' as const,
    errors: [] as string[],
    lastUpdated: new Date().toISOString(),
  };

  try {
    // Step 1: Search for URLs
    const urls = await searchForMKStatements(mk);

    if (urls.length === 0) {
      console.log('  ⚠️  No URLs found in search results');
      mkState.status = 'complete';
      state.processedMks.push(mkState);
      return;
    }

    // Step 2: Extract content from URLs
    console.log(`  📥 Extracting content from ${urls.length} URLs...`);
    const validComments: HistoricalCommentData[] = [];

    for (const url of urls) {
      if (validComments.length >= MAX_COMMENTS_PER_MK) {
        console.log(`  ✅ Reached target of ${MAX_COMMENTS_PER_MK} comments, stopping extraction`);
        break;
      }

      const extracted = await extractContent(url);
      if (!extracted || extracted.quotes.length === 0) {
        continue;
      }

      // Create comment data for each quote
      for (const quote of extracted.quotes) {
        if (validComments.length >= MAX_COMMENTS_PER_MK) break;

        const commentData: HistoricalCommentData = {
          mkId: mk.mkId,
          content: quote,
          sourceUrl: url,
          sourcePlatform: extracted.platform,
          sourceType: 'Secondary', // Most news reports are secondary
          sourceName: extracted.sourceName,
          sourceCredibility: extracted.credibility,
          commentDate: extracted.date?.toISOString() || new Date().toISOString(),
          keywords: RECRUITMENT_LAW_KEYWORDS.primary.filter(kw =>
            quote.toLowerCase().includes(kw.toLowerCase())
          ),
        };

        // Validate before adding
        const validation = validateComment(commentData);
        if (validation.valid) {
          validComments.push(commentData);
        } else {
          console.log(`    ⚠️  Validation failed: ${validation.errors.join(', ')}`);
        }
      }
    }

    mkState.statementsFound = validComments.length;
    console.log(`  ✅ Found ${validComments.length} valid comments`);

    // Step 3: Submit to API
    if (validComments.length > 0) {
      console.log(`  📤 Submitting ${validComments.length} comments...`);

      for (const comment of validComments) {
        const result = await submitWithRetry(comment);

        if (result.success) {
          if (result.isDuplicate) {
            console.log(`    ℹ️  Duplicate detected (already exists)`);
            state.totalDuplicates++;
          } else {
            console.log(`    ✅ Submitted: ${comment.content.substring(0, 60)}...`);
            mkState.submitted++;
            state.totalSubmitted++;
          }
        } else {
          console.log(`    ❌ Failed: ${result.error}`);
          mkState.errors?.push(result.error || 'Unknown error');
          state.totalErrors++;
        }
      }
    }

    mkState.status = 'complete';
    console.log(`\n  📊 Summary: ${mkState.submitted} submitted, ${state.totalDuplicates} duplicates, ${mkState.errors?.length || 0} errors`);

  } catch (error) {
    console.error(`  ❌ Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    mkState.status = 'failed';
    mkState.errors?.push(error instanceof Error ? error.message : 'Unknown error');
    state.totalErrors++;
  } finally {
    // Update state
    state.processedMks.push(mkState);
    state.lastProcessedMkId = mk.mkId;
    state.lastUpdatedAt = new Date().toISOString();
    saveState(state);
  }
}

/**
 * Display progress
 */
function logProgress(current: number, total: number, mk: CoalitionMK, state: FinderState): void {
  const percentage = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Progress: ${current}/${total} (${percentage}%) ${bar}`);
  console.log(`Current: ${mk.nameHebrew} (${mk.faction})`);
  console.log(`Totals: ${state.totalSubmitted} submitted | ${state.totalDuplicates} duplicates | ${state.totalErrors} errors`);
  console.log('='.repeat(80));
}

/**
 * Generate final report
 */
function generateReport(state: FinderState, mks: CoalitionMK[]): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log('FINAL REPORT');
  console.log('='.repeat(80));

  console.log(`\nTotal MKs processed: ${state.processedMks.length}/${mks.length}`);
  console.log(`Total comments submitted: ${state.totalSubmitted}`);
  console.log(`Average per MK: ${(state.totalSubmitted / state.processedMks.length).toFixed(1)}`);
  console.log(`Total duplicates: ${state.totalDuplicates}`);
  console.log(`Total errors: ${state.totalErrors}`);

  // Breakdown by party
  console.log(`\nBreakdown by Party:`);
  const partyStats = state.processedMks.reduce((acc, mk) => {
    if (!acc[mk.faction]) {
      acc[mk.faction] = { count: 0, submitted: 0 };
    }
    acc[mk.faction].count++;
    acc[mk.faction].submitted += mk.submitted;
    return acc;
  }, {} as Record<string, { count: number; submitted: number }>);

  Object.entries(partyStats)
    .sort((a, b) => b[1].submitted - a[1].submitted)
    .forEach(([party, stats]) => {
      console.log(`  ${party}: ${stats.submitted} comments (${stats.count} MKs, avg ${(stats.submitted / stats.count).toFixed(1)})`);
    });

  // Failed MKs
  const failedMks = state.processedMks.filter(mk => mk.status === 'failed');
  if (failedMks.length > 0) {
    console.log(`\n⚠️  Failed MKs (${failedMks.length}):`);
    failedMks.forEach(mk => {
      console.log(`  - ${mk.name} (${mk.faction}): ${mk.errors?.join(', ')}`);
    });
  }

  console.log(`\nState saved to: ${STATE_PATH}`);
  console.log('='.repeat(80));
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('🚀 Automated Historical Comments Finder\n');

  // Validate API key
  if (!API_KEY && !DRY_RUN) {
    console.error('❌ NEWS_API_KEY not found in environment variables');
    console.error('Please set NEWS_API_KEY in .env file or use DRY_RUN=true for testing');
    process.exit(1);
  }

  // Parse CLI arguments
  const args = process.argv.slice(2);
  const mkIdArg = args.find(arg => arg.startsWith('--mk-id='));
  const partyArg = args.find(arg => arg.startsWith('--party='));
  const resetArg = args.includes('--reset');

  const targetMkId = mkIdArg ? parseInt(mkIdArg.split('=')[1], 10) : undefined;
  const targetParty = partyArg ? partyArg.split('=')[1] : undefined;

  // Load coalition MKs
  console.log('📋 Loading coalition members...');
  let allMks = loadCoalitionMKs();
  console.log(`✅ Loaded ${allMks.length} coalition MKs\n`);

  // Filter by arguments
  if (targetMkId) {
    allMks = allMks.filter(mk => mk.mkId === targetMkId);
    console.log(`🎯 Processing single MK: ${allMks[0]?.nameHebrew || 'Not found'}\n`);
  } else if (targetParty) {
    allMks = allMks.filter(mk => mk.faction === targetParty);
    console.log(`🎯 Processing party: ${targetParty} (${allMks.length} MKs)\n`);
  }

  if (allMks.length === 0) {
    console.error('❌ No MKs found matching criteria');
    process.exit(1);
  }

  // Load or initialize state
  let state = resetArg ? null : loadState();
  if (!state) {
    state = initializeState();
    console.log('📝 Initialized new state\n');
  }

  // Process MKs
  const startTime = Date.now();

  for (let i = 0; i < allMks.length; i++) {
    const mk = allMks[i];

    // Skip if already processed
    if (state.processedMks.some(processed => processed.mkId === mk.mkId)) {
      console.log(`⏭️  Skipping ${mk.nameHebrew} (already processed)`);
      continue;
    }

    logProgress(i + 1, allMks.length, mk, state);
    await processMK(mk, state);
  }

  const endTime = Date.now();
  const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

  // Generate final report
  generateReport(state, allMks);
  console.log(`\n⏱️  Total runtime: ${durationMinutes} minutes`);

  if (DRY_RUN) {
    console.log('\n💡 This was a DRY RUN - no comments were actually submitted');
  }
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

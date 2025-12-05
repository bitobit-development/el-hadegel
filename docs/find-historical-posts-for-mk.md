# Historical Posts Search System - Development Prompt

## Overview

This document guides the development of a web scraping script to find and collect historical posts/statements from coalition Knesset members regarding the IDF recruitment law (חוק גיוס חרדים). The script will search multiple platforms, validate content, and submit findings to the HistoricalComment system via REST API.

## Project Context

### Database Schema
The target table is `HistoricalComment` with the following relevant fields:

```typescript
{
  mkId: number;                    // MK identifier
  content: string;                 // Full text of statement
  sourceUrl: string;               // Original source URL
  sourcePlatform: string;          // News, Twitter, Facebook, YouTube, Knesset, Interview, Other
  sourceType: string;              // Primary (direct quote) or Secondary (reporting)
  commentDate: Date;               // When statement was originally made
  sourceName: string;              // Publication/outlet name
  sourceCredibility: number;       // 1-10 scale (default: 5)
  isVerified: boolean;             // Admin verification (default: false)
}
```

### API Integration
- **Endpoint**: `POST /api/historical-comments`
- **Authentication**: Bearer token via `NEWS_API_KEY` environment variable
- **Rate Limits**: 1000 requests/hour (environment key mode)
- **Validation**: Automatic keyword validation, coalition membership check, deduplication

### Target Audience
64 coalition members across 6 parties:
- הליכוד (Likud) - 32 members
- התאחדות הספרדים שומרי תורה (Shas) - 11 members
- יהדות התורה (United Torah Judaism) - 7 members
- הציונות הדתית (Religious Zionism) - 7 members
- עוצמה יהודית (Otzma Yehudit) - 6 members
- נעם (Noam) - 1 member

**Data Source**: `/Users/haim/Projects/el-hadegel/docs/mk-coalition/coalition-members.csv`

## Implementation Strategy

### Phase 1: Single MK Test (Benjamin Netanyahu)

**Why Netanyahu First?**
- Most documented public figure in Israeli politics
- Extensive media coverage ensures abundant test data
- mkId: 90 in database
- Multiple source platforms (news, Twitter, YouTube, Knesset)
- Known positions on recruitment law

**Success Criteria**:
- Find at least 10 historical posts from last 5 years
- Successfully submit to API without errors
- Verify deduplication works (no duplicate submissions)
- Validate content extraction quality

### Phase 2: Coalition-Wide Deployment

After Phase 1 validation, extend to all 64 coalition members:
- Process members sequentially (avoid rate limiting)
- Log progress per MK (found, submitted, skipped)
- Handle members with limited online presence gracefully
- Generate summary report with statistics

## Search Methodology

### 1. Search Query Construction

**Primary Keywords (at least 1 required)**:
- חוק גיוס / חוק הגיוס (recruitment law)
- גיוס חרדים (haredi draft)
- recruitment law
- draft law

**Secondary Keywords (improve relevance)**:
- צה״ל (IDF)
- חרדים (haredim)
- פטור משירות (military exemption)
- שוויון בנטל (equality in burden)
- בני ישיבה (yeshiva students)

**Query Templates**:
```
Hebrew queries:
1. "[MK Name] חוק גיוס חרדים"
2. "[MK Name] גיוס חרדים צה״ל"
3. "[MK Name] פטור משירות צבאי"
4. "[MK Name] שוויון בנטל חרדים"

English queries (for international coverage):
5. "[MK English Name] IDF recruitment law"
6. "[MK English Name] haredi draft Israel"
```

**Date Filtering**:
- Last 5 years: 2020-01-01 to 2025-12-04
- Use search engine date filters when available
- Fallback: Parse publication dates from content

### 2. Source Platform Strategy

#### A. News Websites (High Priority)

**Major Israeli News Outlets**:
- Ynet (ynet.co.il)
- Walla (walla.co.il)
- Israel Hayom (israelhayom.co.il)
- Haaretz (haaretz.co.il)
- Mako (mako.co.il)
- Channel 12 (mako.co.il/news-channel12)
- Channel 13 (13tv.co.il)
- Kan (kan.org.il)
- Makor Rishon (makorrishon.co.il)
- Kikar HaShabat (kikarehshabbat.co.il)

**Search Strategy**:
- Use `site:` operator for focused searches: `site:ynet.co.il "[MK Name]" חוק גיוס`
- Scrape article text + Open Graph metadata
- Extract publication date from article metadata
- Credibility: 7-9 (major outlets), 5-6 (smaller outlets)

**Example Code Pattern**:
```typescript
// Using Bright Data MCP tool
const searchResults = await mcp__Brightdata__search_engine({
  query: 'site:ynet.co.il "בנימין נתניהו" חוק גיוס חרדים',
  engine: 'google'
});

// Scrape article content
for (const result of searchResults) {
  const content = await mcp__Brightdata__scrape_as_markdown({
    url: result.url
  });

  // Extract relevant quote from article
  const quote = extractRelevantQuote(content, mkName, keywords);
  // Parse date, validate, submit
}
```

#### B. X/Twitter (High Priority)

**Why Important**:
- Direct quotes from MKs (Primary source)
- Real-time statements
- 93.75% of coalition members have X accounts (60/64)

**Search Strategy**:
- Use X account from CSV: `@username חוק גיוס`
- Search by date range: `from:@username since:2020-01-01 until:2025-12-04 חוק גיוס`
- Credibility: 10 (direct quote from verified account)

**Implementation Notes**:
- X/Twitter may block scraping - use Playwright with stealth mode
- Alternative: Use X API (requires developer account)
- Extract tweet text, date, URL
- Handle threads (combine multi-tweet statements)

#### C. Knesset Website (Medium Priority)

**Official Sources**:
- Knesset protocols: knesset.gov.il/protocols
- Committee transcripts: knesset.gov.il/committees
- Plenum debates: knesset.gov.il/plenum

**Search Strategy**:
- Search Knesset site: `site:knesset.gov.il "[MK Name]" גיוס`
- Parse Hebrew PDF transcripts (OCR if needed)
- Credibility: 10 (official government record)

**Challenges**:
- PDF extraction requires specialized tools
- Hebrew OCR quality varies
- Complex site structure

#### D. YouTube (Lower Priority)

**Video Content**:
- Interviews
- Knesset sessions
- News reports

**Search Strategy**:
- YouTube search API: `"[MK Name]" חוק גיוס חרדים`
- Use video title + description (don't transcribe audio)
- Extract from closed captions if available
- Credibility: 6-8 (depends on channel)

**Implementation Notes**:
- Focus on official channels (Knesset, major news)
- Avoid unverified user uploads
- Link to specific timestamp if possible

#### E. Facebook (Lower Priority)

**Public Pages**:
- MK official pages
- Party pages
- News outlet pages

**Search Strategy**:
- Facebook Graph API (requires app registration)
- Alternative: Manual search + Playwright scraping
- Credibility: 9 (official MK page), 7 (news page)

**Challenges**:
- Facebook blocks automated scraping aggressively
- Requires login for full content access
- Consider skipping due to technical barriers

### 3. Content Extraction and Validation

#### A. Extract Relevant Quotes

**Challenge**: News articles may mention MK but not quote them directly.

**Solution - Quote Detection Patterns**:
```typescript
const quotePatterns = [
  // Direct quotes with quotation marks
  /["״]([^"״]+)["״]\s*(?:אמר|אמרה|הצהיר|הצהירה|טען|טענה)/,

  // Attribution patterns
  /(?:אמר|אמרה|הצהיר|הצהירה)\s+([^.]+)\s*:\s*["״]([^"״]+)["״]/,

  // Social media posts
  /כתב[הת]?\s+(?:בטוויטר|בפייסבוק|ברשת)\s*:\s*["״]([^"״]+)["״]/,
];

function extractRelevantQuote(articleText: string, mkName: string): string | null {
  // 1. Find paragraphs mentioning MK
  const paragraphs = articleText.split('\n\n');
  const relevantParagraphs = paragraphs.filter(p => p.includes(mkName));

  // 2. Look for direct quotes
  for (const paragraph of relevantParagraphs) {
    for (const pattern of quotePatterns) {
      const match = paragraph.match(pattern);
      if (match) {
        return match[1] || match[2]; // Return captured quote
      }
    }
  }

  // 3. Fallback: Return paragraph if it contains keywords
  const withKeywords = relevantParagraphs.find(p =>
    recruitmentLawKeywords.some(keyword => p.includes(keyword))
  );

  return withKeywords || null;
}
```

#### B. Date Extraction

**Priority Order**:
1. Structured metadata (Open Graph, JSON-LD)
2. Article publication date (`<meta property="article:published_time">`)
3. URL date patterns (`/2024/03/15/`)
4. Text date mentions ("פורסם ב-15 במרץ 2024")
5. Fallback: Search result date (less reliable)

**Example Implementation**:
```typescript
function extractCommentDate(url: string, html: string, metadata: any): Date | null {
  // 1. Try Open Graph
  if (metadata.ogArticlePublishedTime) {
    return new Date(metadata.ogArticlePublishedTime);
  }

  // 2. Try meta tags
  const publishedMatch = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/);
  if (publishedMatch) {
    return new Date(publishedMatch[1]);
  }

  // 3. Try URL pattern
  const urlDateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (urlDateMatch) {
    const [_, year, month, day] = urlDateMatch;
    return new Date(`${year}-${month}-${day}`);
  }

  // 4. Try Hebrew date patterns
  const hebrewDateMatch = html.match(/פורסם[:\s]+(\d{1,2})[.\s]+ב([א-ת]+)[.\s]+(\d{4})/);
  if (hebrewDateMatch) {
    const [_, day, hebrewMonth, year] = hebrewDateMatch;
    const month = convertHebrewMonthToNumber(hebrewMonth);
    return new Date(`${year}-${month}-${day}`);
  }

  return null; // Unable to extract date
}
```

#### C. Source Credibility Scoring

**Credibility Scale (1-10)**:

| Score | Source Type | Examples |
|-------|-------------|----------|
| 10 | Official direct quote | Verified X/Twitter account, Knesset protocol |
| 9 | Major news (direct quote) | Ynet, Channel 12 with quoted statement |
| 8 | Major news (paraphrased) | Ynet, Haaretz reporting on statement |
| 7 | Regional news (direct quote) | Local news sites with attribution |
| 6 | YouTube (official channel) | Knesset channel, major news channel |
| 5 | Secondary reporting | "According to reports...", unattributed |
| 4 | Blog/opinion site | Personal blogs citing statement |
| 3 | Social media (unverified) | Facebook posts, unofficial accounts |
| 2 | Aggregators | Content farms, copy-paste sites |
| 1 | Unverifiable | No clear source attribution |

**Scoring Function**:
```typescript
function calculateSourceCredibility(
  platform: string,
  sourceUrl: string,
  hasDirectQuote: boolean,
  isVerifiedAccount: boolean
): number {
  // Knesset official = 10
  if (sourceUrl.includes('knesset.gov.il')) return 10;

  // Verified X/Twitter account with direct quote = 10
  if (platform === 'Twitter' && isVerifiedAccount && hasDirectQuote) return 10;

  // Major news outlets
  const majorOutlets = ['ynet.co.il', 'mako.co.il', 'walla.co.il', 'haaretz.co.il'];
  if (majorOutlets.some(outlet => sourceUrl.includes(outlet))) {
    return hasDirectQuote ? 9 : 8;
  }

  // Default medium credibility
  return 5;
}
```

### 4. Deduplication Strategy

**Three Levels of Deduplication**:

#### Level 1: Local Session Cache
Avoid re-processing same URL in current script run.

```typescript
const processedUrls = new Set<string>();

async function processSearchResult(result: SearchResult) {
  if (processedUrls.has(result.url)) {
    console.log(`Skipping duplicate URL: ${result.url}`);
    return;
  }
  processedUrls.add(result.url);
  // Process...
}
```

#### Level 2: API Deduplication (Automatic)
The API automatically detects duplicates via:
- Exact hash matching (SHA-256)
- Fuzzy matching (85% similarity, 90-day window)

**Expected API Responses**:
- `201 Created` + `isDuplicate: false` → New unique comment
- `201 Created` + `isDuplicate: true` → Duplicate detected, linked to existing
- `400 Bad Request` → Validation failed (check error message)

#### Level 3: Pre-Submission Check
Query existing comments before scraping to avoid wasted work.

```typescript
async function getExistingComments(mkId: number): Promise<HistoricalComment[]> {
  const response = await fetch(
    `/api/historical-comments?mkId=${mkId}&limit=1000`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.NEWS_API_KEY}`
      }
    }
  );
  return response.json();
}

// Build set of existing source URLs
const existingUrls = new Set(
  existingComments.map(c => c.sourceUrl)
);

// Skip if already in database
if (existingUrls.has(searchResult.url)) {
  console.log(`Comment already exists: ${searchResult.url}`);
  return;
}
```

## Implementation Guidelines

### Recommended Tech Stack

**Web Scraping**:
- **Playwright** (already in project): Dynamic content, JavaScript rendering
- **Bright Data MCP Tools**: Search engine queries, content scraping
- **open-graph-scraper**: Metadata extraction (already in project)

**Data Processing**:
- **date-fns** (already in project): Hebrew date parsing
- **crypto**: SHA-256 hashing for local deduplication
- **csv-parse** (already in project): Coalition CSV parsing

**HTTP Client**:
- **fetch** (Node.js native): API submissions
- **Playwright browser**: Authenticated requests, anti-bot evasion

### Script Structure

**Recommended File**: `/Users/haim/Projects/el-hadegel/scripts/scrape-historical-posts.ts`

```typescript
#!/usr/bin/env tsx

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

// Configuration
const COALITION_CSV_PATH = './docs/mk-coalition/coalition-members.csv';
const API_BASE_URL = 'http://localhost:3000'; // Change to production URL
const API_KEY = process.env.NEWS_API_KEY;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

// Types
interface CoalitionMember {
  MK_ID: string;
  Name_Hebrew: string;
  Faction: string;
  X_Account?: string;
}

interface SearchResult {
  url: string;
  title: string;
  description: string;
  date?: string;
}

interface HistoricalCommentSubmission {
  mkId: number;
  content: string;
  sourceUrl: string;
  sourcePlatform: string;
  sourceType: 'Primary' | 'Secondary';
  commentDate: string; // ISO8601
  sourceName?: string;
  sourceCredibility?: number;
}

// Main execution flow
async function main() {
  console.log('🚀 Historical Posts Scraper - Starting...\n');

  // Phase 1: Test with Netanyahu
  const netanyahu = {
    MK_ID: '90',
    Name_Hebrew: 'בנימין נתניהו',
    Faction: 'הליכוד',
    X_Account: '@netanyahu'
  };

  console.log('Phase 1: Testing with Benjamin Netanyahu (mkId: 90)');
  await processMK(netanyahu);

  console.log('\n✅ Phase 1 complete. Review results before proceeding to Phase 2.');

  // Phase 2: Uncomment to process all coalition members
  // const members = loadCoalitionMembers();
  // for (const member of members) {
  //   await processMK(member);
  //   await delay(RATE_LIMIT_DELAY);
  // }
}

// Load coalition members from CSV
function loadCoalitionMembers(): CoalitionMember[] {
  const csvContent = readFileSync(COALITION_CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true // Handle UTF-8 BOM
  });
  return records;
}

// Process single MK
async function processMK(mk: CoalitionMember) {
  console.log(`\n📊 Processing: ${mk.Name_Hebrew} (mkId: ${mk.MK_ID})`);

  const stats = {
    searched: 0,
    found: 0,
    submitted: 0,
    duplicates: 0,
    errors: 0
  };

  try {
    // 1. Search news sites
    const newsResults = await searchNewsSites(mk.Name_Hebrew);
    stats.searched += newsResults.length;

    // 2. Search X/Twitter (if account available)
    if (mk.X_Account) {
      const twitterResults = await searchTwitter(mk.X_Account);
      stats.searched += twitterResults.length;
      newsResults.push(...twitterResults);
    }

    // 3. Process each result
    for (const result of newsResults) {
      try {
        const comment = await extractAndValidate(result, mk);
        if (comment) {
          stats.found++;
          const submitted = await submitToAPI(comment);
          if (submitted.isDuplicate) {
            stats.duplicates++;
          } else {
            stats.submitted++;
          }
        }
      } catch (error) {
        stats.errors++;
        console.error(`  ❌ Error processing ${result.url}:`, error.message);
      }

      await delay(1000); // Rate limiting
    }

  } catch (error) {
    console.error(`  ❌ Fatal error processing ${mk.Name_Hebrew}:`, error);
  }

  console.log(`  📈 Results: ${stats.submitted} submitted, ${stats.duplicates} duplicates, ${stats.errors} errors`);
}

// Search news sites
async function searchNewsSites(mkName: string): Promise<SearchResult[]> {
  // Implementation: Use Bright Data or Playwright
  // Return array of search results
}

// Search X/Twitter
async function searchTwitter(xAccount: string): Promise<SearchResult[]> {
  // Implementation: Use X API or Playwright
  // Return array of tweets
}

// Extract and validate comment from search result
async function extractAndValidate(
  result: SearchResult,
  mk: CoalitionMember
): Promise<HistoricalCommentSubmission | null> {
  // 1. Scrape content
  const content = await scrapeContent(result.url);

  // 2. Extract quote
  const quote = extractRelevantQuote(content, mk.Name_Hebrew);
  if (!quote) return null;

  // 3. Validate keywords
  if (!containsRecruitmentLawKeywords(quote)) return null;

  // 4. Extract date
  const commentDate = extractCommentDate(result.url, content, result.date);
  if (!commentDate) return null;

  // 5. Determine platform and credibility
  const platform = detectPlatform(result.url);
  const credibility = calculateSourceCredibility(platform, result.url, true, false);

  return {
    mkId: parseInt(mk.MK_ID),
    content: quote,
    sourceUrl: result.url,
    sourcePlatform: platform,
    sourceType: quote.includes('"') ? 'Primary' : 'Secondary',
    commentDate: commentDate.toISOString(),
    sourceName: extractSourceName(result.url),
    sourceCredibility: credibility
  };
}

// Submit to API
async function submitToAPI(
  comment: HistoricalCommentSubmission
): Promise<{ success: boolean; isDuplicate: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/historical-comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(comment)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error: ${error.message}`);
  }

  const data = await response.json();
  console.log(`  ✅ Submitted: ${comment.sourceUrl.substring(0, 60)}...`);

  return {
    success: true,
    isDuplicate: data.isDuplicate || false
  };
}

// Utility: Delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run script
main().catch(console.error);
```

### Error Handling Best Practices

**1. Network Errors**:
```typescript
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`  ⚠️  Retry ${i + 1}/${retries} for ${url}`);
      await delay(2000 * (i + 1)); // Exponential backoff
    }
  }
}
```

**2. API Rate Limiting**:
```typescript
async function submitWithRateLimit(comment: HistoricalCommentSubmission) {
  const response = await submitToAPI(comment);

  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const waitTime = resetTime ? parseInt(resetTime) * 1000 - Date.now() : 60000;
    console.log(`  ⏳ Rate limited. Waiting ${waitTime / 1000}s...`);
    await delay(waitTime);
    return submitWithRateLimit(comment); // Retry
  }

  return response;
}
```

**3. Scraping Failures**:
```typescript
async function scrapeContent(url: string): Promise<string> {
  try {
    // Try Bright Data first (anti-bot protection)
    return await mcp__Brightdata__scrape_as_markdown({ url });
  } catch (error) {
    console.log(`  ⚠️  Bright Data failed, trying Playwright...`);
    try {
      // Fallback to Playwright
      return await scrapeWithPlaywright(url);
    } catch (playwrightError) {
      console.error(`  ❌ Both scraping methods failed for ${url}`);
      throw playwrightError;
    }
  }
}
```

### Logging and Progress Tracking

**Progress File**: Save state to resume if script crashes.

```typescript
import { writeFileSync, existsSync, readFileSync } from 'fs';

interface Progress {
  lastProcessedMkId: number;
  processedUrls: string[];
  stats: {
    totalSubmitted: number;
    totalDuplicates: number;
    totalErrors: number;
  };
}

function saveProgress(progress: Progress) {
  writeFileSync(
    './data/scraper-progress.json',
    JSON.stringify(progress, null, 2)
  );
}

function loadProgress(): Progress | null {
  if (existsSync('./data/scraper-progress.json')) {
    return JSON.parse(readFileSync('./data/scraper-progress.json', 'utf-8'));
  }
  return null;
}

// In main():
const progress = loadProgress() || {
  lastProcessedMkId: 0,
  processedUrls: [],
  stats: { totalSubmitted: 0, totalDuplicates: 0, totalErrors: 0 }
};

// After processing each MK:
progress.lastProcessedMkId = parseInt(mk.MK_ID);
saveProgress(progress);
```

**Detailed Logging**:
```typescript
// Create log file with timestamp
const logFile = `./logs/scraper-${new Date().toISOString().split('T')[0]}.log`;

function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  // Console output
  console.log(message);

  // File output
  appendFileSync(logFile, logLine);
}

// Usage:
log('Starting scraper...', 'info');
log(`Found 15 search results for ${mkName}`, 'info');
log(`Failed to scrape ${url}`, 'warn');
log(`API submission failed: ${error.message}`, 'error');
```

## Testing Strategy

### Phase 1: Netanyahu Test Checklist

**Prerequisites**:
- [ ] Environment variable `NEWS_API_KEY` is set
- [ ] Database is accessible
- [ ] Coalition CSV file exists at correct path
- [ ] Script has necessary dependencies installed

**Execution Steps**:
1. Run script: `npx tsx scripts/scrape-historical-posts.ts`
2. Monitor console output for progress
3. Verify API submissions succeed (201 responses)
4. Check logs for errors

**Validation**:
```bash
# Check database for new comments
npx tsx scripts/verify-historical-comments.ts --mkId=90

# Expected: At least 10 new comments for Netanyahu
# Check for:
# - Varied source platforms (News, Twitter, Knesset)
# - Dates spanning 2020-2025
# - Hebrew content with recruitment law keywords
# - Credibility scores 7-10 (Netanyahu is well-documented)
```

**Success Criteria**:
- ✅ At least 10 unique comments found
- ✅ No API errors (400, 401, 500)
- ✅ Duplicate detection working (check API responses)
- ✅ Dates extracted correctly (no null commentDate)
- ✅ Content quality: Actual quotes, not just mentions

**Failure Scenarios**:
- ❌ No comments found → Check search queries, keyword validation
- ❌ All duplicates → API working, but search needs broader date range
- ❌ API 401 errors → Check NEWS_API_KEY environment variable
- ❌ API 400 errors → Check content validation (keywords missing?)
- ❌ Dates null → Improve date extraction logic

### Phase 2: Coalition-Wide Rollout

**Preparation**:
```bash
# Backup database before large operation
npx tsx scripts/backup-database.ts

# Dry run: Count expected results without submitting
npx tsx scripts/scrape-historical-posts.ts --dry-run --all-members
```

**Execution Strategy**:
```typescript
// Process in batches (10 MKs at a time)
const members = loadCoalitionMembers();
const batchSize = 10;

for (let i = 0; i < members.length; i += batchSize) {
  const batch = members.slice(i, i + batchSize);

  console.log(`\n📦 Processing batch ${i / batchSize + 1}/${Math.ceil(members.length / batchSize)}`);

  for (const member of batch) {
    await processMK(member);
    await delay(RATE_LIMIT_DELAY);
  }

  // Pause between batches (avoid overloading)
  console.log('⏸️  Pausing 30s between batches...');
  await delay(30000);
}
```

**Monitoring**:
```bash
# Tail logs in real-time
tail -f logs/scraper-$(date +%Y-%m-%d).log

# Check progress periodically
watch -n 60 'npx tsx scripts/check-scraper-progress.ts'
```

**Expected Outcomes by Party**:

| Party | Members | Expected Comments/MK | Reasoning |
|-------|---------|---------------------|-----------|
| הליכוד | 32 | 5-15 | High visibility, many ministers |
| ש״ס | 11 | 8-20 | Strong stance, active on issue |
| יהדות התורה | 7 | 10-25 | Core issue for party, vocal |
| הציונות הדתית | 7 | 5-12 | Moderate media presence |
| עוצמה יהודית | 6 | 3-10 | Less established party |
| נעם | 1 | 2-8 | Single member, limited coverage |

**Post-Execution Validation**:
```bash
# Generate summary report
npx tsx scripts/generate-scraper-report.ts

# Expected output:
# - Total comments found: ~500-800
# - Breakdown by party
# - Breakdown by source platform
# - Breakdown by year
# - Duplicate rate: ~20-30% (normal)
# - Error rate: <10%
```

## Edge Cases and Handling

### 1. MK with No Online Presence
**Problem**: Some MKs (especially UTJ members) have minimal digital footprint.

**Solution**:
- Set minimum threshold: If <3 results after all searches, log and skip
- Focus on Knesset protocols (official record)
- Search for party statements (attribute to party leader)

### 2. Paywalled Content
**Problem**: Haaretz, Globes require subscriptions.

**Solutions**:
- Use Open Graph description (often includes lead paragraph)
- Try archive.is/archive.org mirrors
- Skip if content unavailable (log for manual review)

### 3. Video/Audio Content
**Problem**: YouTube videos, radio interviews lack text transcripts.

**Solutions**:
- Use video title + description only (don't transcribe)
- Check for closed captions (YouTube API)
- Lower priority: Skip if no easy text extraction

### 4. Ambiguous Dates
**Problem**: Article says "אתמול" (yesterday) or "לפני שבוע" (a week ago).

**Solutions**:
- Parse relative dates using article publication date:
  ```typescript
  function parseRelativeDate(text: string, publishDate: Date): Date | null {
    if (text.includes('אתמול')) {
      return subDays(publishDate, 1);
    }
    if (text.includes('לפני שבוע')) {
      return subWeeks(publishDate, 1);
    }
    // Add more patterns...
  }
  ```
- If uncertain, use article publication date (less accurate but better than null)

### 5. Multiple Quotes in Single Article
**Problem**: Article quotes MK multiple times on different aspects.

**Solutions**:
- Submit each distinct quote as separate comment
- Avoid combining quotes (loses context)
- Link via source URL (deduplication will catch exact URL duplicates)

### 6. Translation Issues
**Problem**: English articles about Hebrew statements (secondary source).

**Solutions**:
- Mark as sourceType: 'Secondary'
- Lower credibility score (-1 point for translation)
- Prefer Hebrew original if available

## Output and Reporting

### Summary Report Format

```
╔═══════════════════════════════════════════════════════════════╗
║           Historical Posts Scraper - Summary Report           ║
╠═══════════════════════════════════════════════════════════════╣
║ Execution Date: 2025-12-04 14:30:22                           ║
║ Duration: 2h 15m 33s                                          ║
║ Mode: Phase 2 - All Coalition Members                         ║
╠═══════════════════════════════════════════════════════════════╣
║ MEMBERS PROCESSED                                             ║
║ - Total MKs: 64                                               ║
║ - Successfully processed: 62                                  ║
║ - Skipped (errors): 2                                         ║
╠═══════════════════════════════════════════════════════════════╣
║ SEARCH RESULTS                                                ║
║ - Total URLs searched: 1,847                                  ║
║ - Comments extracted: 782                                     ║
║ - Passed validation: 658                                      ║
║ - Failed validation: 124 (keywords missing, date errors)     ║
╠═══════════════════════════════════════════════════════════════╣
║ API SUBMISSIONS                                               ║
║ - New comments created: 487                                   ║
║ - Duplicates detected: 171 (26%)                             ║
║ - API errors: 12 (rate limit: 8, validation: 4)             ║
╠═══════════════════════════════════════════════════════════════╣
║ BREAKDOWN BY PARTY                                            ║
║ - הליכוד: 198 comments (32 MKs, avg 6.2/MK)                  ║
║ - ש״ס: 134 comments (11 MKs, avg 12.2/MK)                    ║
║ - יהדות התורה: 89 comments (7 MKs, avg 12.7/MK)              ║
║ - הציונות הדתית: 43 comments (7 MKs, avg 6.1/MK)            ║
║ - עוצמה יהודית: 18 comments (6 MKs, avg 3.0/MK)             ║
║ - נעם: 5 comments (1 MK)                                      ║
╠═══════════════════════════════════════════════════════════════╣
║ BREAKDOWN BY PLATFORM                                         ║
║ - News: 389 (80%)                                             ║
║ - Twitter: 67 (14%)                                           ║
║ - Knesset: 18 (4%)                                            ║
║ - YouTube: 9 (2%)                                             ║
║ - Other: 4 (<1%)                                              ║
╠═══════════════════════════════════════════════════════════════╣
║ BREAKDOWN BY YEAR                                             ║
║ - 2025: 42 (9%)                                               ║
║ - 2024: 156 (32%)                                             ║
║ - 2023: 134 (28%)                                             ║
║ - 2022: 89 (18%)                                              ║
║ - 2021: 43 (9%)                                               ║
║ - 2020: 23 (5%)                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ CREDIBILITY DISTRIBUTION                                      ║
║ - High (9-10): 287 (59%)                                      ║
║ - Medium (6-8): 176 (36%)                                     ║
║ - Low (1-5): 24 (5%)                                          ║
║ - Average score: 8.2/10                                       ║
╠═══════════════════════════════════════════════════════════════╣
║ TOP CONTRIBUTORS (Most Comments Found)                        ║
║ 1. בנימין נתניהו (הליכוד) - 34 comments                      ║
║ 2. אריה דרעי (ש״ס) - 28 comments                             ║
║ 3. יצחק גולדקנופף (יהדות התורה) - 22 comments                ║
║ 4. בצלאל סמוטריץ' (הציונות הדתית) - 19 comments             ║
║ 5. איתמר בן גביר (עוצמה יהודית) - 15 comments                ║
╠═══════════════════════════════════════════════════════════════╣
║ ERRORS AND WARNINGS                                           ║
║ - Network timeouts: 5                                         ║
║ - Scraping failures: 8                                        ║
║ - Date extraction failures: 34                                ║
║ - MKs with 0 results: 4 (see detailed log)                   ║
╠═══════════════════════════════════════════════════════════════╣
║ NEXT STEPS                                                    ║
║ 1. Review MKs with 0 results (manual search recommended)     ║
║ 2. Verify high-value comments in admin dashboard             ║
║ 3. Re-run scraper in 1 week to catch new posts               ║
╚═══════════════════════════════════════════════════════════════╝

Detailed logs: ./logs/scraper-2025-12-04.log
Progress file: ./data/scraper-progress.json
Export data: ./data/scraper-results-2025-12-04.csv
```

### CSV Export for Review

**File**: `./data/scraper-results-2025-12-04.csv`

```csv
MK_ID,MK_Name,Party,Comment_Preview,Source_URL,Source_Platform,Comment_Date,Credibility,Is_Duplicate,API_Status
90,בנימין נתניהו,הליכוד,"חוק הגיוס הוא צו...",https://ynet.co.il/...,News,2024-03-15,9,false,201_created
91,אריה דרעי,ש״ס,"אנחנו נתנגד לכל...",https://twitter.com/...,Twitter,2023-11-22,10,false,201_created
...
```

## Maintenance and Iteration

### Scheduled Re-Runs

**Recommended Frequency**: Weekly (every Monday)

**Incremental Scraping**:
```typescript
// Only search for posts from last 7 days
const dateFilter = {
  since: subDays(new Date(), 7),
  until: new Date()
};

// Update search queries with date filter
const query = `"${mkName}" חוק גיוס after:${format(dateFilter.since, 'yyyy-MM-dd')}`;
```

**Automation**:
```bash
# Add to crontab (runs every Monday at 2 AM)
0 2 * * 1 cd /path/to/project && npx tsx scripts/scrape-historical-posts.ts --incremental >> logs/cron-scraper.log 2>&1
```

### Performance Optimization

**Parallel Processing** (use cautiously to avoid rate limits):
```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests

const tasks = searchResults.map(result =>
  limit(() => processSearchResult(result))
);

await Promise.all(tasks);
```

**Caching Search Results**:
```typescript
// Cache search results for 24 hours
const cacheKey = `search:${mkName}:${hashQuery(query)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const results = await performSearch(query);
await redis.setex(cacheKey, 86400, JSON.stringify(results));
return results;
```

### Monitoring and Alerts

**Alert Conditions**:
- Error rate >15% → Email admin
- Zero results for >10 MKs → Investigate search logic
- API rate limit hit frequently → Increase delays
- Duplicate rate >50% → Expand date range

**Monitoring Script**:
```bash
# Check scraper health
npx tsx scripts/monitor-scraper-health.ts

# Expected output:
# ✅ Last run: 2 days ago (OK)
# ✅ Success rate: 92% (OK)
# ⚠️  Average comments/MK: 3.2 (LOW - expected >5)
# ✅ API availability: 100% (OK)
```

## Security and Compliance

### Rate Limiting Best Practices
- **Search engines**: Max 10 queries/minute
- **News sites**: Max 1 request/second per domain
- **X/Twitter**: Follow API rate limits (if using API)
- **Our API**: 1000 requests/hour (environment key mode)

### User Agent Rotation
```typescript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0',
];

const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
```

### Respecting robots.txt
```typescript
import robotsParser from 'robots-parser';

async function canScrape(url: string): Promise<boolean> {
  const robotsTxtUrl = new URL('/robots.txt', url).href;
  const robotsTxt = await fetch(robotsTxtUrl).then(r => r.text());
  const robots = robotsParser(robotsTxtUrl, robotsTxt);

  return robots.isAllowed(url, 'HistoricalPostsBot/1.0');
}
```

### Copyright and Attribution
- Always store `sourceUrl` (attribution)
- Mark secondary sources appropriately
- Don't republish full articles (extract relevant quotes only)
- Respect paywalls (don't circumvent subscriber-only content)

## Troubleshooting Guide

| Issue | Possible Causes | Solutions |
|-------|----------------|-----------|
| No search results | Keywords too specific, MK name misspelled | Broaden keywords, check CSV name spelling |
| All API 400 errors | Content missing keywords | Debug `containsRecruitmentLawKeywords()` |
| API 401 errors | Invalid API key | Check `NEWS_API_KEY` env variable |
| API 429 errors | Rate limit exceeded | Increase `RATE_LIMIT_DELAY`, implement backoff |
| Scraping blocked | Anti-bot detection | Use Bright Data instead of Playwright |
| Null dates extracted | Date extraction logic failing | Add more date patterns, fallback to search result date |
| High duplicate rate | Searching same time period repeatedly | Use incremental mode, expand date range |
| Low credibility scores | Sources are blogs/forums | Focus on major news outlets first |
| Script crashes mid-run | Memory leak, unhandled promise rejection | Implement progress saving, add try-catch blocks |

### Debug Commands

```bash
# Test single URL extraction
npx tsx scripts/test-extract-comment.ts "https://ynet.co.il/article/..."

# Test API submission
npx tsx scripts/test-api-submit.ts --mkId=90 --content="test" --url="https://test.com"

# Validate search queries
npx tsx scripts/test-search-queries.ts --mkName="בנימין נתניהו"

# Check database state
npx tsx scripts/check-historical-comments.ts --mkId=90 --summary
```

## Success Metrics

**Phase 1 (Netanyahu) Success**:
- ✅ 10+ unique comments found
- ✅ <5% error rate
- ✅ Avg credibility ≥7/10
- ✅ Date coverage 2020-2025

**Phase 2 (All Coalition) Success**:
- ✅ 500+ total comments submitted
- ✅ 80%+ MKs with at least 1 comment
- ✅ <15% error rate
- ✅ Duplicate rate 20-40% (indicates thorough search)
- ✅ Platform diversity (News >70%, Twitter >10%)

**Long-term Maintenance**:
- ✅ Weekly incremental runs capture new posts
- ✅ Database grows steadily (50-100 new comments/month)
- ✅ Admin verifies high-value comments regularly

---

## Quick Start Checklist

- [ ] Install dependencies: `pnpm install`
- [ ] Set environment variable: `export NEWS_API_KEY="your-key-here"`
- [ ] Verify database connection: `npx prisma db pull`
- [ ] Check coalition CSV exists: `ls docs/mk-coalition/coalition-members.csv`
- [ ] Run Phase 1 test: `npx tsx scripts/scrape-historical-posts.ts`
- [ ] Review results in admin dashboard: `/admin/historical-comments`
- [ ] If successful, enable Phase 2: Uncomment coalition loop in script
- [ ] Schedule weekly re-runs: Add to crontab

---

**Document Version**: 1.0
**Last Updated**: 2025-12-04
**Maintained By**: EL HADEGEL Development Team
**Questions?** Check existing `docs/historical-comments/` guides or project CLAUDE.md

# Automated Historical Comments Finder

## Overview

Create an automated TypeScript script that finds and submits historical statements from coalition Knesset members about the IDF recruitment law using WebSearch and WebFetch MCP tools.

## User Stories

- As a developer, I want to automate the discovery of historical comments so that I can efficiently process all 64 coalition MKs
- As a developer, I want the script to handle search, extraction, validation, and API submission so that manual effort is minimized
- As a developer, I want progress tracking and error handling so that I can resume from failures

## Requirements

### Functional Requirements

1. **MK Data Loading**: Read coalition members from `docs/mk-coalition/coalition-members.csv`
2. **Web Search Integration**: Use WebSearch MCP to find statements across multiple sources (news, social media, Knesset)
3. **Content Extraction**: Use WebFetch MCP to extract article content and parse quotes
4. **Data Validation**: Validate all extracted data against API requirements before submission
5. **API Submission**: Submit validated comments to `/api/historical-comments` endpoint
6. **Progress Tracking**: Track which MKs have been processed, save state to resume
7. **Error Handling**: Retry failed submissions, log errors, skip invalid sources
8. **Rate Limiting**: Respect API rate limits (1000/hour), wait when exceeded

### Technical Requirements

1. **Script Location**: `scripts/find-historical-comments-auto.ts`
2. **TypeScript**: Fully typed with proper error handling
3. **MCP Tools**: Integration with WebSearch and WebFetch (or Brightdata alternatives)
4. **CSV Parsing**: Use csv-parse library to read coalition members
5. **Environment Variables**: Use NEWS_API_KEY from .env for API authentication
6. **State Persistence**: Save progress to JSON file (`data/comments-finder-state.json`)
7. **Logging**: Detailed console output with progress indicators
8. **Retry Logic**: Exponential backoff for failed API calls (3 retries max)

### Search Strategy

**Per MK, execute 4 searches**:
1. News sites: `"{MK_NAME_HEBREW}" "חוק גיוס" OR "גיוס חרדים" site:.co.il`
2. Social media: `"{MK_NAME_HEBREW}" (חוק גיוס OR draft law) site:twitter.com OR site:facebook.com`
3. Knesset: `"{MK_NAME_HEBREW}" site:knesset.gov.il גיוס`
4. Videos: `"{MK_NAME_HEBREW}" "חוק גיוס" site:youtube.com`

**Target**: 4-5 valid comments per MK (64 MKs × 5 = ~320 total)

### Data Extraction & Validation

**Required Fields**:
- `mkId`: MK database ID from CSV
- `content`: Exact quote (50-1000 chars) with recruitment law keywords
- `sourceUrl`: Full accessible URL
- `sourcePlatform`: News | Twitter | Facebook | YouTube | Knesset | Interview | Other
- `sourceType`: Primary | Secondary
- `commentDate`: ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)
- `sourceName`: Publication name in Hebrew (max 500 chars)
- `sourceCredibility`: 1-10 based on source reputation

**Validation Rules**:
- Quote contains keywords: חוק גיוס, חוק הגיוס, גיוס חרדים, recruitment law, draft law
- Date within 2019-2025 range
- Content length 50-1000 characters
- URL is accessible (HTTP 200 response)
- All required fields present and valid types

**Source Credibility Scoring**:
- 9-10: Knesset official records, major news (Ynet, Walla, Haaretz)
- 7-8: Verified social media, reputable interviews
- 5-6: Smaller news sites
- 3-4: Blogs, personal websites

### Progress State Structure

```typescript
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
  startedAt: string;
  lastUpdatedAt: string;
}
```

## Acceptance Criteria

### Core Functionality
- [ ] Script reads all 64 coalition members from CSV successfully
- [ ] WebSearch MCP integration executes 4 searches per MK
- [ ] WebFetch MCP extracts content from found URLs
- [ ] Content extraction identifies quotes with recruitment law keywords
- [ ] All 7 required fields are extracted and validated
- [ ] API submission includes proper authentication header
- [ ] Successfully submits at least 4-5 comments per high-profile MK

### Validation & Quality
- [ ] Only quotes with recruitment law keywords are submitted
- [ ] Dates are validated (ISO8601, 2019-2025 range)
- [ ] Content length validated (50-1000 chars)
- [ ] Source credibility assigned based on platform
- [ ] Duplicate detection handled by API (check isDuplicate flag)

### Error Handling & Resilience
- [ ] Rate limit detection from X-RateLimit-Remaining header
- [ ] Automatic wait when rate limit exceeded (check X-RateLimit-Reset)
- [ ] Failed submissions retried 3 times with exponential backoff
- [ ] Invalid sources logged and skipped (not fatal)
- [ ] State saved after each MK processed
- [ ] Script can resume from last processed MK on restart

### Progress Tracking
- [ ] Console output shows current MK being processed
- [ ] Progress indicator: "Processing MK 15/64 (23%)"
- [ ] Summary statistics: "Found 5 statements, submitted 4, 1 skipped"
- [ ] State JSON file updated after each MK
- [ ] Final report shows total comments submitted per party

### Performance
- [ ] Processes at least 1 MK per minute (on average)
- [ ] Respects rate limits (no 429 errors)
- [ ] Handles paywalled content gracefully (skip or use archive.org)
- [ ] Total runtime under 2 hours for all 64 MKs

## Implementation Steps

### Phase 1: Setup & Infrastructure (20 min)

1. **Create script file**: `scripts/find-historical-comments-auto.ts`
2. **Install dependencies** (if needed):
   ```bash
   npm install csv-parse dotenv
   ```
3. **Define TypeScript interfaces**:
   - `CoalitionMK` (from CSV)
   - `HistoricalCommentData` (API payload)
   - `FinderState` (progress tracking)
   - `SearchResult` (WebSearch response)
   - `ExtractionResult` (parsed content)

### Phase 2: MK Data Loading (15 min)

4. **CSV Parser**: Read `docs/mk-coalition/coalition-members.csv`
   - Parse with csv-parse library
   - Extract: MK_ID, Name_Hebrew, Name_English, Faction
   - Filter only coalition members (64 total)
   - Handle UTF-8 encoding

5. **State Management**:
   - Load existing state from `data/comments-finder-state.json` (if exists)
   - Determine starting MK (resume from lastProcessedMkId + 1)
   - Initialize state if first run

### Phase 3: Search Implementation (30 min)

6. **WebSearch Integration**:
   - Function: `searchForMKStatements(mk: CoalitionMK): Promise<string[]>`
   - Execute 4 searches per MK (news, social, Knesset, video)
   - Use Brightdata search_engine MCP tool (mcp__Brightdata__search_engine)
   - Collect URLs from search results (top 5 per search = ~20 URLs)
   - Return array of unique URLs

7. **Search Query Builder**:
   - Function: `buildSearchQueries(mk: CoalitionMK): string[]`
   - Generate 4 queries using Hebrew and English names
   - Include recruitment law keywords
   - Apply site restrictions (site:.co.il, site:twitter.com, etc.)

### Phase 4: Content Extraction (40 min)

8. **WebFetch Integration**:
   - Function: `extractContent(url: string): Promise<ExtractionResult | null>`
   - Use Brightdata scrape_as_markdown MCP tool (mcp__Brightdata__scrape_as_markdown)
   - Parse markdown for quotes (look for quote patterns in Hebrew/English)
   - Extract publication date from metadata
   - Return structured data or null if invalid

9. **Quote Extraction**:
   - Function: `findRecruitmentLawQuotes(content: string): string[]`
   - Search for recruitment law keywords in content
   - Extract surrounding context (±100 chars)
   - Find quotes marked with quotation marks or "אמר"/"said"
   - Return array of candidate quotes

10. **Date Extraction**:
    - Function: `extractDate(content: string, url: string): Date | null`
    - Parse ISO8601 dates from content
    - Check meta tags if available in markdown
    - Fallback to URL pattern matching (if date in URL)
    - Validate date is in 2019-2025 range

11. **Platform Detection**:
    - Function: `detectPlatform(url: string): SourcePlatform`
    - Match URL domain to platform enum
    - ynet.co.il → News, twitter.com → Twitter, knesset.gov.il → Knesset
    - Return platform with credibility score

### Phase 5: Validation Layer (25 min)

12. **Field Validator**:
    - Function: `validateComment(data: Partial<HistoricalCommentData>): ValidationResult`
    - Check all required fields present
    - Validate content length (50-1000 chars)
    - Verify recruitment law keywords present
    - Validate date format and range
    - Validate credibility score (1-10)
    - Return validation result with specific errors

13. **Keyword Validator**:
    - Function: `hasRecruitmentLawKeywords(content: string): boolean`
    - Check for primary keywords: חוק גיוס, חוק הגיוס, גיוס חרדים
    - Check for secondary keywords: recruitment law, draft law
    - Return true if at least one primary keyword found

### Phase 6: API Submission (20 min)

14. **API Client**:
    - Function: `submitComment(data: HistoricalCommentData): Promise<SubmitResult>`
    - POST to `/api/historical-comments`
    - Include Authorization header with NEWS_API_KEY
    - Parse response (check isDuplicate flag)
    - Return result with comment ID

15. **Rate Limit Handler**:
    - Function: `checkRateLimit(response: Response): Promise<void>`
    - Check X-RateLimit-Remaining header
    - If < 10 remaining, wait proactively
    - If 429 response, extract X-RateLimit-Reset and wait
    - Log waiting time to console

16. **Retry Logic**:
    - Function: `submitWithRetry(data: HistoricalCommentData): Promise<SubmitResult>`
    - Try up to 3 times
    - Exponential backoff: 1s, 2s, 4s
    - Skip on validation errors (400, 422)
    - Retry on server errors (500) or rate limits (429)

### Phase 7: Main Orchestration (30 min)

17. **Per-MK Processor**:
    - Function: `processMK(mk: CoalitionMK, state: FinderState): Promise<void>`
    - Execute searches (collect URLs)
    - Fetch and extract content from each URL
    - Validate extracted data
    - Submit valid comments to API
    - Update state with results
    - Save state to JSON file

18. **Main Loop**:
    - Function: `main(): Promise<void>`
    - Load coalition MKs from CSV
    - Load or initialize state
    - Iterate through MKs (skip if already complete)
    - Call processMK for each
    - Display progress to console
    - Save final state and statistics

19. **Progress Display**:
    - Function: `logProgress(current: number, total: number, mk: CoalitionMK)`
    - Show current MK name and faction
    - Show progress: "Processing 15/64 (23%)"
    - Show ETA based on average time per MK
    - Show running totals (submitted, errors, duplicates)

### Phase 8: State Persistence (15 min)

20. **State Saver**:
    - Function: `saveState(state: FinderState): Promise<void>`
    - Serialize state to JSON
    - Write to `data/comments-finder-state.json`
    - Create data directory if not exists
    - Handle file write errors gracefully

21. **State Loader**:
    - Function: `loadState(): Promise<FinderState | null>`
    - Read from `data/comments-finder-state.json`
    - Parse JSON, validate structure
    - Return null if file doesn't exist or invalid
    - Log loaded state summary to console

### Phase 9: Reporting (15 min)

22. **Final Report Generator**:
    - Function: `generateReport(state: FinderState): void`
    - Summary statistics:
      - Total MKs processed: X/64
      - Total comments submitted: X
      - Average per MK: X.X
      - Total errors: X
      - Duplicates detected: X
    - Breakdown by party (Likud: X, Shas: X, etc.)
    - List of failed MKs (if any)
    - Recommendations for manual review

23. **CLI Arguments** (optional enhancement):
    - `--mk-id <id>`: Process single MK by ID
    - `--party <name>`: Process all MKs from specific party
    - `--reset`: Clear state and start fresh
    - `--dry-run`: Search and extract only, no API submission

### Phase 10: Testing & Validation (30 min)

24. **Unit Tests** (Uri agent):
    - Test CSV parsing
    - Test search query building
    - Test date extraction
    - Test keyword validation
    - Test platform detection
    - Target: 80%+ coverage

25. **Integration Test**:
    - Test with single high-profile MK (Netanyahu)
    - Verify all 4 searches execute
    - Verify content extraction works
    - Verify API submission succeeds
    - Check state file created correctly

26. **Error Scenario Tests**:
    - Test rate limit handling (simulate 429 response)
    - Test invalid URL (404 response)
    - Test missing keywords (validation failure)
    - Test network timeout
    - Test state recovery after crash

## Technical Notes

### MCP Tool Selection

**Primary**: Brightdata MCP Tools (better for Israeli sites)
- `mcp__Brightdata__search_engine`: Google/Bing search with SERP results
- `mcp__Brightdata__scrape_as_markdown`: Fetch URLs with bot detection bypass

**Fallback**: Standard MCP Tools
- `WebSearch`: Generic web search (may have limitations with Hebrew)
- `WebFetch`: Basic URL fetching (may fail on paywalls)

**Recommendation**: Use Brightdata for Israeli news sites (bypasses bot detection, better Hebrew support)

### Quote Extraction Patterns

**Hebrew Patterns**:
```typescript
const hebrewQuotePatterns = [
  /אמר[ה]?\s*:\s*["'](.+?)["']/g,  // Said: "quote"
  /["'](.{50,1000}?)["']/g,          // Direct quotes
  /(?:הצהיר|אמר|ציין)\s+(.+?)\./g,   // Declared/said/noted
];
```

**English Patterns**:
```typescript
const englishQuotePatterns = [
  /said:\s*["'](.+?)["']/gi,
  /stated:\s*["'](.+?)["']/gi,
  /"(.{50,1000})"/g,
];
```

### Environment Variables

Required in `.env`:
```bash
NEWS_API_KEY="your-api-key-here"  # 1000/hour rate limit
```

Optional:
```bash
DRY_RUN=true                       # Skip API submission
MAX_COMMENTS_PER_MK=5              # Limit comments per MK
START_FROM_MK_ID=1                 # Resume from specific MK
```

### Data Directory Structure

```
data/
  comments-finder-state.json       # Progress tracking
  comments-finder-errors.log       # Error log
  extracted-comments/              # JSON files per MK
    comments_mk_1.json
    comments_mk_2.json
    ...
```

### Performance Considerations

**Bottlenecks**:
- WebSearch: ~3-5 seconds per search (4 searches × 64 MKs = ~13 min)
- WebFetch: ~2-3 seconds per URL (20 URLs × 64 MKs = ~43 min)
- API submission: ~0.5 seconds per comment (320 comments = ~3 min)
- **Total**: ~60-90 minutes for all 64 MKs

**Optimizations**:
- Parallel searches (Promise.all for 4 searches)
- Batch URL fetching (10 URLs at once)
- Cache search results (avoid re-searching on resume)
- Skip MKs with 5+ existing comments (check API first)

### Error Handling Strategy

**Fatal Errors** (stop execution):
- CSV file not found
- API key missing or invalid
- Network completely down

**Recoverable Errors** (skip and continue):
- Single URL fetch fails (404, timeout)
- Quote extraction returns empty
- Validation fails (missing keywords)
- API returns 422 (validation error)

**Retryable Errors** (retry with backoff):
- API returns 500 (server error)
- API returns 429 (rate limit)
- Network timeout (temporary)

## Testing Requirements

### Unit Tests (Jest)

**Test Coverage Areas**:
1. CSV parsing: Valid/invalid formats, UTF-8 encoding
2. Search query building: Hebrew/English names, special characters
3. Quote extraction: Various quote formats, multi-line quotes
4. Date parsing: ISO8601, Hebrew dates, missing dates
5. Keyword validation: All keyword variations, case sensitivity
6. Platform detection: All domain patterns
7. Validation logic: All field validations, edge cases

**Target**: 80%+ code coverage

### Integration Tests

**Scenario 1: Single MK Success**:
- Input: Netanyahu (MK_ID: 1)
- Expected: 4-5 valid comments submitted
- Verify: State updated, no errors

**Scenario 2: Rate Limit Handling**:
- Simulate: 100 rapid submissions
- Expected: Script waits when rate limit hit
- Verify: No 429 errors, all submitted eventually

**Scenario 3: Resume from State**:
- Setup: Process 5 MKs, stop script
- Restart: Script resumes from MK 6
- Verify: No duplicate submissions

**Scenario 4: Invalid Sources**:
- Input: URLs with no quotes
- Expected: Validation fails, skipped
- Verify: Logged as skipped, not submitted

### Manual Testing Checklist

- [ ] Run full script on test MK (Netanyahu)
- [ ] Verify all 4 searches return results
- [ ] Check content extraction quality (quotes make sense)
- [ ] Verify API submissions appear in admin dashboard
- [ ] Test state recovery (stop and restart script)
- [ ] Check final report statistics are accurate
- [ ] Verify error logging works (introduce bad URL)

## Success Criteria

### Quantitative
- [ ] Processes all 64 coalition MKs successfully
- [ ] Submits minimum 256 comments (64 × 4 average)
- [ ] Target 320 comments (64 × 5 average)
- [ ] Less than 5% error rate
- [ ] Runtime under 2 hours total

### Qualitative
- [ ] All submitted comments have recruitment law keywords
- [ ] Source credibility scores are reasonable (avg 7+)
- [ ] Dates are accurate and diverse (not all same year)
- [ ] URLs are accessible (no 404s in submitted data)
- [ ] State file allows reliable resume after crash

## Future Enhancements

**Phase 2 Features**:
1. Parallel processing (process 5 MKs simultaneously)
2. Smart URL filtering (skip low-quality sources early)
3. Archive.org integration (handle paywalled content)
4. ML-based quote extraction (better accuracy)
5. Duplicate prevention (check existing before search)
6. Email notifications (daily progress reports)
7. Web UI for monitoring (real-time progress dashboard)

## Documentation

**README section**: Add to main README:
```markdown
### Automated Historical Comments Finder

Find and submit historical statements about recruitment law:

\`\`\`bash
# Run full automation (all 64 MKs)
npx tsx scripts/find-historical-comments-auto.ts

# Process single MK
npx tsx scripts/find-historical-comments-auto.ts --mk-id 1

# Dry run (no API submission)
DRY_RUN=true npx tsx scripts/find-historical-comments-auto.ts
\`\`\`
```

**Script header comments**: Include usage examples and dependencies

---

**Implementation Date**: 2025-12-05
**Estimated Time**: 4-5 hours (including testing)
**Priority**: High
**Dependencies**: WebSearch/WebFetch MCP, Historical Comments API

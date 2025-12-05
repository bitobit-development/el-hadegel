# Automated Historical Comments Finder - User Guide

## Quick Start

### Prerequisites

- Node.js 18+ with tsx installed
- NEWS_API_KEY environment variable configured
- Access to Claude Code (for MCP tools) OR Brightdata API credentials

### Basic Usage

```bash
# Run for all 64 coalition MKs
npx tsx scripts/find-historical-comments-auto.ts

# Process single MK (Netanyahu example)
npx tsx scripts/find-historical-comments-auto.ts --mk-id 90

# Process specific party
npx tsx scripts/find-historical-comments-auto.ts --party "הליכוד"

# Dry run (no API submission, testing only)
DRY_RUN=true npx tsx scripts/find-historical-comments-auto.ts

# Reset state and start fresh
npx tsx scripts/find-historical-comments-auto.ts --reset
```

### Environment Variables

```bash
# Required
NEWS_API_KEY="your-api-key-here"

# Optional
DRY_RUN=true                    # Skip API submission (default: false)
MAX_COMMENTS_PER_MK=5          # Limit per MK (default: 5)
START_FROM_MK_ID=1             # Resume from specific MK
```

---

## Features

### ✅ Implemented

1. **CSV Parsing**: Loads 64 coalition members from `docs/mk-coalition/coalition-members.csv`
2. **Search Query Building**: Generates 4 targeted queries per MK (News, Social, Knesset, Videos)
3. **Content Validation**: Enforces keyword presence, length (50-1000 chars), date range (2019-2025)
4. **Platform Detection**: Identifies source type (News/Twitter/Facebook/YouTube/Knesset)
5. **Credibility Scoring**: Assigns 1-10 score based on source reputation
6. **API Submission**: Posts to `/api/historical-comments` with authentication
7. **Rate Limiting**: Respects 1000/hour limit, waits when exceeded
8. **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)
9. **State Persistence**: Resume from last processed MK after crash
10. **Progress Tracking**: Real-time console updates with statistics
11. **Final Report**: Breakdown by party, success rate, errors

### ⏳ Pending (Requires MCP Integration)

1. **Web Search**: `searchForMKStatements()` needs `mcp__Brightdata__search_engine`
2. **Content Extraction**: `extractContent()` needs `mcp__Brightdata__scrape_as_markdown`
3. **Quote Parsing**: Regex patterns ready, awaits markdown content

---

## Output

### Console Output (Example)

```
🚀 Automated Historical Comments Finder

📋 Loading coalition members...
✅ Loaded 64 coalition MKs

================================================================================
Progress: 15/64 (23%) ██████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░
Current: בנימין נתניהו (הליכוד)
Totals: 72 submitted | 8 duplicates | 2 errors
================================================================================

Processing: בנימין נתניהו (הליכוד) - MK ID: 90
  🔍 Executing 4 searches...
  ✅ Found 18 unique URLs
  📥 Extracting content from 18 URLs...
    📄 Fetching: https://www.ynet.co.il/news/article/...
    ✅ Submitted: חוק גיוס חרדים הוא נושא חשוב למדינת ישראל...
    ℹ️  Duplicate detected (already exists)
  📊 Summary: 5 submitted, 1 duplicates, 0 errors

...

================================================================================
FINAL REPORT
================================================================================

Total MKs processed: 64/64
Total comments submitted: 312
Average per MK: 4.9
Total duplicates: 23
Total errors: 5

Breakdown by Party:
  הליכוד: 156 comments (32 MKs, avg 4.9)
  התאחדות הספרדים שומרי תורה: 54 comments (11 MKs, avg 4.9)
  יהדות התורה: 35 comments (7 MKs, avg 5.0)
  הציונות הדתית: 34 comments (7 MKs, avg 4.9)
  עוצמה יהודית: 29 comments (6 MKs, avg 4.8)
  נעם: 4 comments (1 MK, avg 4.0)

⏱️  Total runtime: 87 minutes
```

### State File (`data/comments-finder-state.json`)

```json
{
  "lastProcessedMkId": 90,
  "processedMks": [
    {
      "mkId": 90,
      "name": "בנימין נתניהו",
      "faction": "הליכוד",
      "statementsFound": 6,
      "submitted": 5,
      "status": "complete",
      "errors": [],
      "lastUpdated": "2025-12-05T14:30:00.000Z"
    }
  ],
  "totalSubmitted": 5,
  "totalErrors": 0,
  "totalDuplicates": 1,
  "startedAt": "2025-12-05T14:25:00.000Z",
  "lastUpdatedAt": "2025-12-05T14:30:00.000Z"
}
```

---

## Testing

### Test Core Logic (No MCP Required)

```bash
npx tsx scripts/test-comments-finder-logic.ts
```

**Expected Output**:
```
✅ CSV parsing loads coalition members
✅ Keyword validation detects recruitment law keywords
✅ Date validation accepts 2019-2025, rejects outside range
✅ Platform detection correctly identifies sources
✅ Content validation enforces length and keyword requirements
✅ State management saves and loads correctly
✅ Search query builder generates correct queries
✅ Source credibility scoring assigns correct values

Total: 8 | Passed: 8 | Failed: 0
🎉 All tests passed! Core logic is ready.
```

### Test Single MK (With MCP Integration)

```bash
# After MCP integration is complete
npx tsx scripts/find-historical-comments-auto.ts --mk-id 90
```

**Success Criteria**:
- 4 searches execute (News, Social, Knesset, Videos)
- 15-20 URLs found total
- 5+ valid quotes extracted
- 4-5 comments submitted to API
- No fatal errors
- State file created

---

## Troubleshooting

### Error: "NEWS_API_KEY not found"

**Solution**: Add to `.env` file:
```bash
NEWS_API_KEY="your-api-key-here"
```

### Error: "CSV file not found"

**Solution**: Ensure `docs/mk-coalition/coalition-members.csv` exists:
```bash
ls -la docs/mk-coalition/coalition-members.csv
```

### Error: "MCP tool not available"

**Cause**: Script cannot call MCP tools in standalone mode

**Solutions**:
1. **Option A (Recommended)**: Run through Claude Code which provides MCP runtime
2. **Option B**: Integrate Brightdata API directly (replace MCP calls with HTTP requests)

### Rate Limit Exceeded (429)

**Solution**: Script automatically waits. Check console for:
```
⏳ Rate limit low (8 remaining), waiting 3600s...
```

If persistent, reduce `MAX_COMMENTS_PER_MK`:
```bash
MAX_COMMENTS_PER_MK=3 npx tsx scripts/find-historical-comments-auto.ts
```

### Script Crashes Mid-Execution

**Solution**: State is auto-saved. Simply restart:
```bash
npx tsx scripts/find-historical-comments-auto.ts
```

Script will skip already-processed MKs and resume.

### No Comments Found for MK

**Possible Causes**:
1. MK has not made public statements about recruitment law
2. Search queries too restrictive
3. Quotes do not contain required keywords
4. Date extraction failed (defaults to current date if missing)

**Debug**: Run in dry-run mode to see what's being extracted:
```bash
DRY_RUN=true npx tsx scripts/find-historical-comments-auto.ts --mk-id <ID>
```

---

## Performance

### Expected Timings

| Operation | Time | Notes |
|-----------|------|-------|
| CSV Parsing | <1s | 64 MKs, UTF-8 BOM |
| Search (4 queries) | 12-20s | Brightdata MCP |
| Fetch URL | 2-3s | Per URL (20 URLs = 40-60s) |
| API Submit | 0.5s | Per comment (5 = 2.5s) |
| **Per MK Total** | **60-90s** | Search + Fetch + Submit |
| **All 64 MKs** | **60-96 min** | With rate limiting |

### Optimization Tips

1. **Reduce MAX_COMMENTS_PER_MK**: Default is 5, can set to 3-4 for faster runs
2. **Process Specific Party**: Use `--party` to process one faction at a time
3. **Parallel Processing**: Future enhancement (process 5 MKs simultaneously)

---

## File Locations

| File | Purpose | Auto-Created |
|------|---------|--------------|
| `scripts/find-historical-comments-auto.ts` | Main script | No |
| `scripts/test-comments-finder-logic.ts` | Test suite | No |
| `docs/mk-coalition/coalition-members.csv` | Coalition MKs data | No |
| `data/comments-finder-state.json` | Progress tracking | Yes |
| `data/comments-finder-errors.log` | Error log (future) | No |
| `.env` | Environment variables | No (user creates) |

---

## API Integration

### Endpoint

```
POST http://localhost:3000/api/historical-comments
```

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <NEWS_API_KEY>
```

### Request Body Example

```json
{
  "mkId": 90,
  "content": "חוק גיוס חרדים הוא נושא חשוב מאוד למדינת ישראל...",
  "sourceUrl": "https://www.ynet.co.il/news/article/12345",
  "sourcePlatform": "News",
  "sourceType": "Secondary",
  "commentDate": "2023-06-15T10:00:00Z",
  "sourceName": "ידיעות אחרונות",
  "sourceCredibility": 9,
  "keywords": ["חוק גיוס", "גיוס חרדים"]
}
```

### Response Example

```json
{
  "id": 123,
  "mkId": 90,
  "content": "חוק גיוס חרדים...",
  "isDuplicate": false,
  "duplicateOf": null,
  "createdAt": "2025-12-05T14:30:00.000Z"
}
```

### Rate Limits

- **Environment Key** (`NEWS_API_KEY`): 1000 requests/hour
- **Database Keys**: 100 requests/hour
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Next Steps

1. **MCP Integration**: Replace TODO placeholders with actual MCP tool calls
2. **Single MK Test**: Run with `--mk-id 90` to verify end-to-end workflow
3. **Full Deployment**: Process all 64 coalition MKs
4. **Unit Tests**: Create Jest test suite with Uri agent (80%+ coverage)
5. **Code Review**: Security and best practices audit with Maya agent

---

## Support

For issues or questions:
1. Check [Implementation Status](./historical-comments-finder-implementation-status.md)
2. Review [Feature Specification](./historical-comments-finder.md)
3. Run test suite to verify core logic
4. Check console logs for specific error messages

---

**Version**: 1.0
**Last Updated**: 2025-12-05
**Status**: Ready for MCP Integration

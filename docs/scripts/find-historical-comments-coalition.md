# Find Historical Comments - Coalition MKs

## Overview

This script automates the collection of historical public statements from 64 coalition Knesset members regarding the IDF recruitment law (חוק הגיוס). It searches across multiple sources, extracts relevant comments, and submits them to the Historical Comments API for storage and deduplication.

**Purpose**: Build comprehensive historical record of coalition MKs' positions on the recruitment law over multiple years.

**Target**: 4-5 comments per MK × 64 members = ~256-320 total comments

**Time Span**: 2020-2025 (historical perspective across multiple Knesset terms)

---

## Coalition Members Data

**Source File**: `docs/mk-coalition/coalition-members.csv`

**Structure**:
```csv
MK_ID,Name_Hebrew,Faction,Position,X_Account,Phone,Email,Profile_URL
1,בנימין נתניהו,הליכוד,תומך בחוק הפטור,@netanyahu,...
```

**Coalition Parties** (6 total):
1. **הליכוד** - 32 members (Likud)
2. **התאחדות הספרדים שומרי תורה** - 11 members (Shas)
3. **יהדות התורה** - 7 members (United Torah Judaism)
4. **הציונות הדתית** - 7 members (Religious Zionism)
5. **עוצמה יהודית** - 6 members (Otzma Yehudit)
6. **נעם** - 1 member (Noam)

**Key Fields**:
- `MK_ID`: Database ID for API submission
- `Name_Hebrew`: Full name for search queries
- `Faction`: Party affiliation
- `X_Account`: Twitter handle (93.75% coverage)

---

## Search Strategy

### Search Sources (Priority Order)

1. **News Websites** (Primary Sources):
   - **Ynet** (ידיעות אחרונות): `https://www.ynet.co.il`
   - **Walla News**: `https://news.walla.co.il`
   - **Mako** (חדשות 12): `https://www.mako.co.il`
   - **Haaretz** (הארץ): `https://www.haaretz.co.il`
   - **Israel Hayom** (ישראל היום): `https://www.israelhayom.co.il`
   - **Globes** (גלובס): `https://www.globes.co.il`

2. **X/Twitter** (Direct Statements):
   - Search user timeline: `https://twitter.com/{X_Account}/status/*`
   - Search with keywords: `from:@{X_Account} (חוק הגיוס OR גיוס חרדים)`
   - Use Twitter Advanced Search or third-party APIs

3. **Knesset Website** (Official Statements):
   - Plenum speeches: `https://main.knesset.gov.il/Activity/plenum/Pages/default.aspx`
   - Committee protocols: `https://main.knesset.gov.il/Activity/committees/Pages/default.aspx`
   - Search: `https://main.knesset.gov.il/mk/Pages/default.aspx`

4. **YouTube** (Video Interviews):
   - Search: `[MK Name] חוק הגיוס interview`
   - Check news channels: Channel 12, Channel 13, Channel 14, Kan 11
   - Extract quotes from video descriptions or auto-generated subtitles

5. **Facebook** (Public Posts):
   - MK official pages
   - Public statements shared by news outlets

### Hebrew Search Keywords

**Primary Keywords** (must include at least one):
- `חוק גיוס` - Draft law
- `חוק הגיוס` - The draft law
- `גיוס חרדים` - Haredi draft
- `recruitment law` - English variant
- `draft law` - English variant

**Secondary Keywords** (context):
- `פטור משירות צבאי` - Military service exemption
- `חרדים בצה״ל` - Haredim in IDF
- `שירות צבאי` - Military service
- `גיוס כללי` - Universal draft
- `תלמידי ישיבות` - Yeshiva students
- `שוויון בנטל` - Equal burden sharing

**Search Query Templates**:
```
"{MK_Name}" AND ("חוק הגיוס" OR "גיוס חרדים")
"{MK_Name}" פטור משירות צבאי
"{MK_Name}" חרדים בצה״ל site:ynet.co.il
from:@{X_Account} (חוק הגיוס OR גיוס חרדים)
```

### Search Execution Process

**Per MK**:
1. Extract MK name, ID, X account from CSV
2. Generate 3-4 search queries with different keyword combinations
3. Execute web searches (use Google Search API or manual scraping)
4. Filter results by date (spread across 2020-2025)
5. Extract 4-5 most relevant comments with:
   - Clear quote attribution
   - Identifiable source URL
   - Publication date
   - Platform type (News, Twitter, etc.)
6. Validate comment content (keyword presence, length 10-5000 chars)
7. Submit to API

**Recommended Tools**:
- **Google Custom Search API**: 100 free queries/day
- **Bright Data MCP**: Web scraping for news sites
- **Twitter API v2**: Search tweets (requires developer account)
- **Manual extraction**: For sources without API access

---

## API Integration

### Endpoint

```
POST http://localhost:3000/api/historical-comments
```

(For production: `https://your-domain.com/api/historical-comments`)

### Authentication

**Header**:
```
Authorization: Bearer YOUR_API_KEY
```

**API Key Source**: Environment variable `NEWS_API_KEY` in `.env` file

**Generation** (if needed):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Rate Limiting

- **Environment-based keys**: 1000 requests/hour
- **Database-based keys**: 100 requests/hour
- **Headers returned**:
  - `X-RateLimit-Limit`: 1000
  - `X-RateLimit-Remaining`: 995
  - `X-RateLimit-Reset`: Unix timestamp

**Rate Limit Strategy**:
- Add 100ms delay between API calls (safety margin)
- Monitor `X-RateLimit-Remaining` header
- If limit reached, wait until `X-RateLimit-Reset` timestamp

### Request Schema

**Required Fields**:
```typescript
{
  mkId: number;              // MK database ID from CSV
  content: string;           // 10-5000 chars, must include recruitment law keywords
  sourceUrl: string;         // Max 2000 chars, valid URL
  sourcePlatform: string;    // Enum: News | Twitter | Facebook | YouTube | Knesset | Interview | Other
  sourceType: string;        // Primary (direct quote) | Secondary (reporting)
  commentDate: string;       // ISO8601: YYYY-MM-DDTHH:MM:SSZ
}
```

**Optional Fields**:
```typescript
{
  sourceName?: string;       // Max 500 chars (e.g., "ידיעות אחרונות")
  sourceCredibility?: number; // 1-10 scale
  imageUrl?: string;         // Valid URL
  videoUrl?: string;         // Valid URL
  keywords?: string[];       // Matched keywords
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/historical-comments \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 1,
    "content": "חוק הגיוס הוא נושא מרכזי עבור ממשלת ישראל. אנחנו מחויבים למצוא פתרון צודק ומאוזן שישרת את כל אזרחי המדינה.",
    "sourceUrl": "https://www.ynet.co.il/news/article/example123",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "commentDate": "2024-01-15T10:30:00Z",
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 8
  }'
```

### Response Examples

**Success (201 Created)**:
```json
{
  "success": true,
  "comment": {
    "id": 1,
    "mkId": 1,
    "content": "חוק הגיוס הוא נושא מרכזי...",
    "contentHash": "abc123...",
    "isDuplicate": false,
    "duplicateGroup": null,
    "createdAt": "2025-12-05T12:00:00Z"
  }
}
```

**Duplicate Detected (201 Created)**:
```json
{
  "success": true,
  "comment": {
    "id": 2,
    "isDuplicate": true,
    "duplicateOf": 1,
    "duplicateGroup": "uuid-123-456",
    "similarity": 0.92
  },
  "message": "תגובה נוספה אך זוהתה כדומה לתגובה קיימת (92% דמיון)"
}
```

**Validation Error (400 Bad Request)**:
```json
{
  "error": "התוכן אינו קשור לחוק הגיוס - חסרות מילות מפתח רלוונטיות",
  "details": "Content must include recruitment law keywords"
}
```

**Coalition Verification Error (400)**:
```json
{
  "error": "חבר הכנסת [Name] ([Faction]) אינו חלק מהקואליציה",
  "coalitionParties": ["הליכוד", "ש\"ס", ...]
}
```

**Rate Limit Error (429 Too Many Requests)**:
```json
{
  "error": "חרגת ממכסת הבקשות המותרת",
  "limit": 1000,
  "remaining": 0,
  "resetAt": "2025-12-05T13:00:00Z"
}
```

---

## Error Handling

### Expected Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | Validation error | Missing required field, invalid format | Log error, skip comment, continue |
| 400 | Content not related to recruitment law | Missing keywords | Verify content, refine search |
| 400 | MK not in coalition | MK ID is opposition member | Verify CSV data, check coalition list |
| 409 | Duplicate comment | Exact or similar comment exists | Expected behavior, count and continue |
| 429 | Rate limit exceeded | Too many requests | Wait until reset time, retry |
| 500 | Server error | API internal issue | Retry with exponential backoff (3 attempts) |

### Retry Strategy

**Retriable Errors**: 429, 500, Network errors

**Implementation**:
```typescript
async function submitWithRetry(data: CommentData, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  let delay = 1000; // Start with 1 second

  while (attempt < maxRetries) {
    try {
      const response = await fetch('/api/historical-comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEWS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const waitMs = (parseInt(resetTime!) * 1000) - Date.now();
        console.log(`Rate limited. Waiting ${waitMs}ms until reset...`);
        await sleep(waitMs);
        continue; // Don't count as retry attempt
      }

      if (response.ok || response.status === 400 || response.status === 409) {
        return response; // Success or expected error
      }

      // Server error - retry with exponential backoff
      if (response.status >= 500) {
        attempt++;
        if (attempt < maxRetries) {
          console.log(`Server error (${response.status}). Retry ${attempt}/${maxRetries} in ${delay}ms...`);
          await sleep(delay);
          delay *= 2; // Exponential backoff
        }
      }
    } catch (error) {
      // Network error
      attempt++;
      if (attempt < maxRetries) {
        console.log(`Network error. Retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`);
}
```

### Progress Tracking

**Save progress to JSON file after each MK**:
```typescript
interface ProgressData {
  lastProcessedMK: number;
  results: {
    mkId: number;
    mkName: string;
    faction: string;
    commentsSubmitted: number;
    duplicatesFound: number;
    errors: Array<{ comment: string; error: string }>;
  }[];
  summary: {
    totalMKsProcessed: number;
    totalCommentsSubmitted: number;
    totalDuplicates: number;
    totalErrors: number;
  };
}
```

**File**: `output/historical-comments-progress.json`

**Resume capability**: Read progress file on start, skip already processed MKs

---

## Deduplication Awareness

### System Behavior

The API automatically detects duplicates using two methods:

1. **Exact Hash Matching** (SHA-256):
   - Instant detection of identical content
   - Returns 201 Created with `isDuplicate: true`

2. **Fuzzy Matching** (Levenshtein Distance):
   - 85% similarity threshold within 90-day window
   - Links to existing comment with `duplicateOf` field
   - Assigns shared `duplicateGroup` UUID

### Script Implications

**Expected Duplicate Rate**: 20-40% for coalition MKs (high media coverage)

**Handling**:
- **DO NOT** treat duplicates as errors
- **DO** count duplicates separately
- **DO** continue processing after duplicate detection
- **DO** log duplicate info for manual review

**Example Log Output**:
```
Processing: בנימין נתניהו (הליכוד)
  Comment 1: ✓ Submitted (ID: 1)
  Comment 2: ⚠ Duplicate of #1 (92% similarity)
  Comment 3: ✓ Submitted (ID: 3)
  Comment 4: ⚠ Duplicate of #3 (88% similarity)
  Comment 5: ✓ Submitted (ID: 5)
Summary: 3 new, 2 duplicates

Coalition Progress: 1/64 MKs (1.6%)
Total: 3 submitted, 2 duplicates, 0 errors
```

---

## Script Implementation Guide

### File Structure

```
scripts/
├── collect-coalition-historical-comments.ts    # Main script
├── lib/
│   ├── csv-parser.ts                          # Parse coalition CSV
│   ├── web-search.ts                          # Search wrapper (Google/manual)
│   ├── comment-extractor.ts                   # Extract comments from sources
│   └── api-client.ts                          # API submission with retry
└── output/
    ├── historical-comments-progress.json      # Progress tracking
    └── historical-comments-report.json        # Final summary
```

### Dependencies

```json
{
  "dependencies": {
    "csv-parse": "^5.5.0",       // CSV parsing
    "node-fetch": "^3.3.0",      // HTTP requests
    "dotenv": "^16.0.0"          // Environment variables
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Execution

```bash
# Set API key
export NEWS_API_KEY="your-api-key-here"

# Run script
npx tsx scripts/collect-coalition-historical-comments.ts

# Resume from saved progress (automatic)
npx tsx scripts/collect-coalition-historical-comments.ts

# Dry run (no API calls, just search)
npx tsx scripts/collect-coalition-historical-comments.ts --dry-run
```

### Command-Line Options

```bash
--dry-run              # Search and validate, don't submit to API
--limit=N              # Process only first N MKs (testing)
--mk-id=ID             # Process single MK by ID
--comments-per-mk=N    # Collect N comments per MK (default: 4)
--start-from=ID        # Start from specific MK ID (resume)
--output=FILE          # Custom output file path
```

### Expected Output

**Console Progress**:
```
[1/64] Processing: בנימין נתניהו (הליכוד)
  Searching: "בנימין נתניהו" AND "חוק הגיוס"
  Found 12 potential comments
  Extracting top 4 comments...
  ✓ Comment 1: Submitted (ID: 1)
  ✓ Comment 2: Submitted (ID: 2)
  ⚠ Comment 3: Duplicate of #1 (90% similarity)
  ✓ Comment 4: Submitted (ID: 4)
  Summary: 3 new, 1 duplicate, 0 errors

[2/64] Processing: ישראל כ"ץ (הליכוד)
  ...

=== FINAL SUMMARY ===
Total MKs Processed: 64/64 (100%)
Comments Submitted: 187
Duplicates Detected: 69
Errors: 4
Success Rate: 97.9%
Duration: 45 minutes
```

**Report JSON** (`output/historical-comments-report.json`):
```json
{
  "executionDate": "2025-12-05T12:00:00Z",
  "duration": 2700000,
  "totalMKs": 64,
  "summary": {
    "commentsSubmitted": 187,
    "duplicatesDetected": 69,
    "totalErrors": 4,
    "successRate": 0.979
  },
  "byFaction": {
    "הליכוד": { "submitted": 96, "duplicates": 32, "errors": 1 },
    "ש\"ס": { "submitted": 33, "duplicates": 12, "errors": 0 },
    ...
  },
  "errors": [
    {
      "mkId": 5,
      "mkName": "Name",
      "error": "Rate limit exceeded",
      "timestamp": "2025-12-05T12:30:00Z"
    }
  ]
}
```

---

## Validation Checklist

Before submitting a comment, verify:

- [ ] MK ID exists in CSV and is coalition member
- [ ] Content length: 10-5000 characters
- [ ] Content includes at least one primary keyword (חוק גיוס/גיוס חרדים/recruitment law)
- [ ] Source URL is valid and accessible (max 2000 chars)
- [ ] Source platform is valid enum value (News, Twitter, Facebook, YouTube, Knesset, Interview, Other)
- [ ] Source type is Primary or Secondary
- [ ] Comment date is valid ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)
- [ ] Comment date is within reasonable range (2000-2025)
- [ ] Source name provided (optional but recommended)

**Validation Function Example**:
```typescript
function validateComment(comment: CommentData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!comment.content || comment.content.length < 10 || comment.content.length > 5000) {
    errors.push('Content length must be 10-5000 chars');
  }

  const keywords = ['חוק גיוס', 'חוק הגיוס', 'גיוס חרדים', 'recruitment law', 'draft law'];
  const hasKeyword = keywords.some(kw => comment.content.includes(kw));
  if (!hasKeyword) {
    errors.push('Content missing recruitment law keywords');
  }

  if (!comment.sourceUrl || comment.sourceUrl.length > 2000) {
    errors.push('Invalid source URL');
  }

  const validPlatforms = ['News', 'Twitter', 'Facebook', 'YouTube', 'Knesset', 'Interview', 'Other'];
  if (!validPlatforms.includes(comment.sourcePlatform)) {
    errors.push('Invalid source platform');
  }

  try {
    new Date(comment.commentDate);
  } catch {
    errors.push('Invalid date format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## Performance Considerations

### Rate Limiting Math

- **API Limit**: 1000 requests/hour
- **Safety Margin**: 100ms delay between calls = 600 calls/hour (safe)
- **Expected Total**: ~256 comments
- **Estimated Time**: ~30-45 minutes (including search time)

### Optimization Strategies

1. **Batch search queries**: Group multiple MKs in single search (e.g., search for party leader statements covering multiple MKs)
2. **Cache search results**: Save intermediate search results to avoid re-searching
3. **Parallel processing**: Search for next MK while submitting current MK's comments
4. **Resume capability**: Save progress after each MK to handle interruptions

### Memory Usage

- **CSV file**: ~10 KB (64 MKs)
- **Progress file**: ~50 KB (full execution data)
- **In-memory comments**: ~1 MB (256 comments × 4 KB average)
- **Total**: <5 MB (negligible)

---

## Testing Strategy

### Unit Tests

```bash
# Test CSV parsing
npm test -- csv-parser.test.ts

# Test comment validation
npm test -- comment-validation.test.ts

# Test API client retry logic
npm test -- api-client.test.ts
```

### Integration Test

```bash
# Test with single MK (dry run)
npx tsx scripts/collect-coalition-historical-comments.ts --mk-id=1 --dry-run

# Test with 3 MKs (actual submission)
npx tsx scripts/collect-coalition-historical-comments.ts --limit=3

# Verify in admin dashboard
# Navigate to: http://localhost:3000/admin
# Check Historical Comments section
```

### Validation Test

```bash
# Test duplicate detection
# Submit same comment twice, verify 409 or duplicate flag

# Test coalition verification
# Try submitting for opposition MK, expect 400 error

# Test rate limiting
# Rapid fire 1001 requests, verify 429 response
```

---

## Troubleshooting

### Common Issues

**Issue**: "Content not related to recruitment law" error

**Solution**:
- Verify content includes keywords: חוק גיוס, גיוס חרדים, recruitment law, draft law
- Check Hebrew encoding (UTF-8)
- Review `lib/comment-constants.ts` for full keyword list

---

**Issue**: "MK not in coalition" error

**Solution**:
- Verify MK ID matches CSV file
- Check coalition parties list in `lib/coalition.ts`
- Ensure CSV file is up-to-date

---

**Issue**: High duplicate rate (>60%)

**Solution**:
- Expected for high-profile MKs (Netanyahu, party leaders)
- Diversify search queries (different time periods, sources)
- Check `duplicateGroup` UUID to see clustered duplicates
- Review similar comments manually for quality

---

**Issue**: Rate limit exceeded

**Solution**:
- Wait for reset time (check `X-RateLimit-Reset` header)
- Increase delay between calls (from 100ms to 500ms)
- Reduce `--comments-per-mk` value
- Use `--start-from` to resume after cooldown

---

**Issue**: Search results not Hebrew-friendly

**Solution**:
- Use Google Custom Search with `&lr=lang_he` parameter
- Verify search query encoding (URL encode Hebrew chars)
- Try different news sources (some have better Hebrew search)
- Use X/Twitter Advanced Search with Hebrew keywords

---

**Issue**: Invalid date format error

**Solution**:
- Use ISO8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- Always include timezone (Z for UTC or +HH:MM)
- Example: `2024-01-15T10:30:00Z`
- Convert relative dates ("לפני שבוע") to exact dates

---

## Success Criteria

**Quantitative**:
- [ ] ✓ 256+ comments submitted (4 per MK × 64 MKs)
- [ ] ✓ <50% duplicate rate (shows diverse sources)
- [ ] ✓ >95% success rate (errors <5%)
- [ ] ✓ All 64 coalition MKs covered
- [ ] ✓ Comments span 2020-2025 (multi-year coverage)

**Qualitative**:
- [ ] ✓ Comments are direct quotes or clear paraphrases
- [ ] ✓ Sources are credible (major news outlets, official Knesset)
- [ ] ✓ Content clearly relates to recruitment law (keyword validation)
- [ ] ✓ Dates are accurate (verifiable from source)
- [ ] ✓ Platform types correctly identified

---

## Next Steps

After successful execution:

1. **Verify in Admin Dashboard**:
   - Navigate to `/admin`
   - Check Historical Comments section
   - Review submitted comments
   - Verify duplicate grouping

2. **Quality Review**:
   - Sample 10-20 comments manually
   - Verify source URLs are accessible
   - Check content accuracy
   - Review duplicate matches

3. **Expand Collection** (Optional):
   - Increase `--comments-per-mk` to 10
   - Extend date range to 2015-2025
   - Add more source platforms (podcasts, radio)
   - Include opposition MKs for comparison

4. **Automation** (Future):
   - Schedule weekly/monthly runs (cron job)
   - Integrate with news RSS feeds
   - Set up alerts for new comments
   - Build comment analytics dashboard

---

## Resources

**API Documentation**: `docs/historical-comments/API_INTEGRATION_GUIDE.md`

**Developer Guide**: `docs/historical-comments/DEVELOPER_GUIDE.md`

**Coalition Data**: `docs/mk-coalition/coalition-members.csv`

**Keyword Reference**: `lib/comment-constants.ts`

**Error Codes**: HTTP 400, 409, 429, 500 (see API section)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-05
**Author**: EL HADEGEL Development Team

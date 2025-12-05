# Hybrid MCP Workflow for Historical Comments

## Overview

This hybrid approach leverages Claude's built-in MCP tool access for web search and content extraction, while using a helper script for validation and API submission.

**Why Hybrid?**
- ✅ MCP tools (WebSearch, WebFetch) only work in Claude's context
- ✅ Avoids complex MCP server connection setup
- ✅ Claude handles intelligent quote extraction
- ✅ Script handles systematic validation and submission

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude (with MCP)                     │
│  - WebSearch: Find articles about MK + recruitment law  │
│  - WebFetch: Extract content and quotes                 │
│  - Save to: data/extracted-comments/mk_{id}.json        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Helper Script (TypeScript)                  │
│  - Read extracted JSON files                            │
│  - Validate all fields                                  │
│  - Submit to API with authentication                    │
│  - Handle rate limiting and retries                     │
│  - Move to submitted/ directory when done               │
└─────────────────────────────────────────────────────────┘
```

## Workflow Steps

### Step 1: Claude Extracts Comments (Manual/Assisted)

Ask Claude to search for and extract historical comments for an MK:

```
Find 4-5 historical statements from Benjamin Netanyahu (MK ID: 90) about
the IDF recruitment law. Use WebSearch and WebFetch to:

1. Search for articles mentioning Netanyahu and recruitment law
2. Extract direct quotes that include keywords: חוק גיוס, גיוס חרדים
3. Save extracted data to: data/extracted-comments/mk_90.json

Format:
[
  {
    "mkId": 90,
    "mkName": "בנימין נתניהו",
    "content": "exact quote with keywords",
    "sourceUrl": "https://...",
    "sourcePlatform": "News",
    "sourceType": "Secondary",
    "commentDate": "2024-09-22T12:00:00Z",
    "sourceName": "כלכליסט",
    "sourceCredibility": 9
  }
]
```

### Step 2: Script Submits to API (Automated)

Once Claude has saved the JSON files, run the helper script:

```bash
# Submit all pending extracted files
npx tsx scripts/find-comments-helper.ts --submit-pending

# Or submit for specific MK
npx tsx scripts/find-comments-helper.ts --mk-id 90
```

**Script Features:**
- ✅ Reads JSON from `data/extracted-comments/`
- ✅ Validates all required fields
- ✅ Submits with proper authentication
- ✅ Handles rate limiting (500ms between requests)
- ✅ Logs success/errors for each comment
- ✅ Moves successfully submitted files to `data/submitted-comments/`
- ✅ Keeps failed files in extracted/ for manual review

### Step 3: Verify in Admin Dashboard

Check submitted comments:
```
http://localhost:3000/admin/historical-comments
Filter by MK: Benjamin Netanyahu
```

## File Structure

```
data/
  extracted-comments/       # Claude saves here
    mk_90.json             # Netanyahu comments (pending)
    mk_105.json            # Deri comments (pending)

  submitted-comments/       # Helper script moves here after success
    mk_90.json             # Netanyahu (submitted)

  errors/                   # Failed submissions (manual review needed)
    mk_105_errors.json     # Deri (had validation errors)
```

## Example JSON Format

```json
[
  {
    "mkId": 90,
    "mkName": "בנימין נתניהו",
    "content": "הצבא לא יכול לקלוט יותר מ-3,000 מהמגזר החרדי, ולכן נעביר חוק גיוס שיהיה על המספרים האלו",
    "sourceUrl": "https://www.calcalist.co.il/local_news/article/syx2t96pa",
    "sourcePlatform": "News",
    "sourceType": "Secondary",
    "commentDate": "2024-09-22T12:00:00Z",
    "sourceName": "כלכליסט",
    "sourceCredibility": 9
  },
  {
    "mkId": 90,
    "mkName": "בנימין נתניהו",
    "content": "אנחנו מחויבים לגיוס חרדים בצורה שתשמור על אופי המדינה היהודי וגם תתרום לצרכי הביטחון",
    "sourceUrl": "https://www.ynet.co.il/news/article/example456",
    "sourcePlatform": "News",
    "sourceType": "Secondary",
    "commentDate": "2024-11-15T10:30:00Z",
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 9
  }
]
```

## Validation Rules

The helper script validates each comment:

**Required Fields:**
- ✅ `mkId`: Must exist in database
- ✅ `content`: 50-1000 characters, must include recruitment law keywords
- ✅ `sourceUrl`: Valid URL format
- ✅ `sourcePlatform`: Must be valid enum
- ✅ `sourceType`: Primary or Secondary
- ✅ `commentDate`: Valid ISO8601 date (2019-2025 range)
- ✅ `sourceName`: Max 500 characters
- ✅ `sourceCredibility`: 1-10

**Keywords Required** (at least one):
- חוק גיוס
- חוק הגיוס
- גיוס חרדים
- recruitment law
- draft law

## Batch Processing Workflow

**For all 64 coalition MKs:**

1. **Organize by party** (easier context switching):
   ```
   - Process all 32 Likud MKs
   - Process all 11 Shas MKs
   - Process all 7 UTJ MKs
   - Process all 7 Religious Zionism MKs
   - Process all 6 Otzma Yehudit MKs
   - Process 1 Noam MK
   ```

2. **Per-party session** (1-2 hours):
   ```
   Ask Claude: "Find 4-5 statements from each Likud MK about recruitment law.
   Save each to data/extracted-comments/mk_{id}.json"

   Claude will:
   - Search for each MK (32 searches)
   - Extract quotes (4-5 per MK)
   - Save 32 JSON files
   ```

3. **Submit batch**:
   ```bash
   npx tsx scripts/find-comments-helper.ts --submit-pending

   # Output:
   # 📄 Processing: mk_90.json
   #   Found 5 comments for בנימין נתניהו
   #   ✅ Submitted (ID: 27)
   #   ✅ Submitted (ID: 28)
   #   ...
   # Summary: 160 submitted, 12 duplicates, 3 errors
   ```

4. **Review errors**:
   ```
   Check data/extracted-comments/ for remaining files
   Fix validation errors manually
   Re-run: npx tsx scripts/find-comments-helper.ts --submit-pending
   ```

## Estimated Timeline

**Per MK** (Claude-assisted):
- Search: 2-3 minutes (4 searches)
- Extract: 3-4 minutes (parse 10-15 articles)
- Save JSON: 1 minute
- **Total**: 6-8 minutes per MK

**Per Party** (batch):
- Likud (32 MKs): ~4 hours
- Shas (11 MKs): ~1.5 hours
- UTJ (7 MKs): ~1 hour
- Religious Zionism (7 MKs): ~1 hour
- Otzma Yehudit (6 MKs): ~1 hour
- Noam (1 MK): ~10 minutes

**Total Project**: ~8-10 hours (spread over 2-3 days)

**Submission** (automated):
- 64 MKs × 5 comments = 320 submissions
- Rate limit: 500ms per request
- **Total**: ~3 minutes

## Error Handling

**Common Issues:**

1. **No keywords found**:
   ```
   Error: "התוכן אינו קשור לחוק הגיוס"
   Fix: Claude re-extracts quote ensuring "חוק גיוס" appears
   ```

2. **Content too short**:
   ```
   Error: "Content must be at least 50 characters"
   Fix: Add surrounding context to quote
   ```

3. **Invalid date**:
   ```
   Error: "Invalid date format"
   Fix: Ensure ISO8601: YYYY-MM-DDTHH:MM:SSZ
   ```

4. **Rate limit exceeded**:
   ```
   Error: "429 Too Many Requests"
   Solution: Script automatically waits (X-RateLimit-Reset header)
   ```

## Advantages of Hybrid Approach

**Compared to full automation**:
- ✅ No need for Google Custom Search API ($5/month)
- ✅ No complex MCP server connection code
- ✅ Claude's intelligence for quote extraction
- ✅ Works with any MCP tools Claude has access to
- ✅ Easy to verify/correct before submission

**Compared to manual process**:
- ✅ Systematic validation (no human errors)
- ✅ Automatic API submission with retries
- ✅ Progress tracking (submitted/ directory)
- ✅ Batch processing support
- ✅ Error logging and recovery

## Tips for Efficiency

1. **Use specific prompts**:
   ```
   Find statements from [MK Name] that:
   - Explicitly mention "חוק גיוס" or "גיוס חרדים"
   - Are from 2019-2025
   - Are from high-credibility sources (Ynet, Knesset, etc.)
   - Include direct quotes (not paraphrased)
   ```

2. **Process high-profile MKs first**:
   - Netanyahu, Deri, Smotrich, Ben-Gvir have most statements
   - Easier to find 5 quality quotes
   - Builds confidence in workflow

3. **Review extracted files before submission**:
   ```bash
   cat data/extracted-comments/mk_90.json | jq '.[].content'
   # Quick review of quotes
   ```

4. **Monitor API responses**:
   ```bash
   # Watch for duplicate warnings
   # If many duplicates, may need to search different time periods
   ```

## Alternative: Semi-Automated with Claude API

If you have Claude API access, you could automate Claude's part too:

```typescript
// Pseudo-code
async function extractWithClaude(mkId: number, mkName: string) {
  const prompt = `Find 4-5 historical statements from ${mkName} about...`;

  const response = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: prompt }],
    tools: ['mcp__WebSearch', 'mcp__WebFetch'], // If available via API
  });

  // Parse response, save to JSON
}
```

**Cost**: ~$0.10 per MK (64 MKs = $6.40 total)

---

## Next Steps

1. ✅ Test workflow with Netanyahu (1 MK)
2. Expand to all Likud ministers (5 MKs)
3. Process full Likud party (32 MKs)
4. Process remaining parties (32 MKs)
5. Quality review (spot-check 10%)
6. Generate final statistics report

**Ready to start?**
```bash
# Create directories
mkdir -p data/extracted-comments data/submitted-comments

# Ask Claude to extract first MK
# Then run helper script
npx tsx scripts/find-comments-helper.ts --mk-id 90
```

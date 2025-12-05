# Historical Comments Discovery Guide for Coalition MKs

## Overview

**Purpose**: Find and document 4-5 historical statements per coalition Knesset member about the IDF recruitment law (חוק הגיוס).

**Scope**:
- **Target**: 64 coalition members across 6 parties
- **Goal**: ~320 total historical comments (64 MKs × 5 average)
- **Time Range**: 2019-2025 (past 6 years)
- **Output**: Structured data submitted via Historical Comments API

**Coalition Parties**:
1. הליכוד (Likud) - 32 members
2. התאחדות הספרדים שומרי תורה (Shas) - 11 members
3. יהדות התורה (United Torah Judaism) - 7 members
4. הציונות הדתית (Religious Zionism) - 7 members
5. עוצמה יהודית (Otzma Yehudit) - 6 members
6. נעם (Noam) - 1 member

---

## Web Search Prompt

Use this prompt with WebSearch MCP tool to find historical statements:

```
Find historical public statements about the IDF recruitment law (חוק גיוס) from Israeli coalition Knesset member {MK_NAME} ({FACTION_NAME}).

SEARCH PARAMETERS:
- Time range: 2019-2025 (past 6 years)
- Topics: חוק גיוס, חוק הגיוס, גיוס חרדים, draft law, recruitment law
- Required: Direct quotes or recorded statements (not speculation/analysis)
- Exclude: Opinion pieces about the MK (must be BY the MK, not ABOUT)

PRIORITY SOURCES (in order):
1. Knesset official records (knesset.gov.il)
2. Major Israeli news outlets (ynet, mako, walla, haaretz, jpost, maariv)
3. MK's verified social media (Twitter/X, Facebook)
4. Interviews on news sites or YouTube channels
5. Press releases from MK's office

SEARCH STRATEGY:
1. Primary query: "{MK_NAME_HEBREW}" "חוק גיוס" OR "גיוס חרדים" site:.co.il OR site:.com
2. Social media: "{MK_NAME_HEBREW}" OR "{MK_NAME_ENGLISH}" (חוק גיוס OR draft law) (site:twitter.com OR site:facebook.com)
3. Knesset records: "{MK_NAME_HEBREW}" site:knesset.gov.il (גיוס OR חוק)
4. Video interviews: "{MK_NAME_HEBREW}" "חוק גיוס" site:youtube.com

TARGET: Find 4-5 distinct statements from different dates/contexts
AVOID: Duplicate statements, indirect quotes, commentary by others

Return: URLs and brief context (date, source type) for each finding
```

### Search Query Examples

**For Benjamin Netanyahu (בנימין נתניהו)**:
```
"בנימין נתניהו" "חוק גיוס" OR "גיוס חרדים" site:.co.il
"Benjamin Netanyahu" (חוק גיוס OR draft law) site:twitter.com
"בנימין נתניהו" site:knesset.gov.il גיוס
```

**For Aryeh Deri (אריה דרעי)**:
```
"אריה דרעי" "חוק גיוס" OR "גיוס חרדים" site:.co.il
"Aryeh Deri" (חוק גיוס OR draft law) site:twitter.com
```

---

## Content Extraction Prompt

Use this prompt to extract structured data from each found URL:

```
Extract structured data from the following article/post about {MK_NAME}'s statement on the IDF recruitment law.

EXTRACTION REQUIREMENTS:

1. **Exact Quote** (content field):
   - Extract the EXACT quote from the MK (in original language: Hebrew or English)
   - Must be direct quote, not paraphrased
   - Must mention recruitment law keywords: חוק גיוס, חוק הגיוס, גיוס חרדים, recruitment law, draft law
   - Length: 50-1000 characters
   - If multiple relevant quotes, choose the most substantial/clear statement
   - Format: Remove quote marks, keep original punctuation

2. **Source URL** (sourceUrl field):
   - Full URL of the article/post (must be accessible)
   - Use archive.org URL if original is paywalled/deleted
   - Validate URL is working before submission

3. **Source Platform** (sourcePlatform field):
   - Classify as ONE of: News, Twitter, Facebook, YouTube, Knesset, Interview, Other
   - "News" = news websites (ynet, walla, etc.)
   - "Knesset" = knesset.gov.il official records
   - "Interview" = video/audio interviews on any platform
   - "Other" = blogs, personal websites, press releases

4. **Source Type** (sourceType field):
   - "Primary" = Direct quote from MK (interview, speech, social media post)
   - "Secondary" = News report quoting the MK (indirect source)
   - Default to "Secondary" if unsure

5. **Comment Date** (commentDate field):
   - ISO8601 format: YYYY-MM-DDTHH:MM:SSZ
   - Extract from article date, post timestamp, or video upload date
   - If only date (no time), use: YYYY-MM-DDT12:00:00Z
   - If no date found, skip this source (date is required)

6. **Source Name** (sourceName field):
   - Publication/outlet name: "ידיעות אחרונות", "חדשות 12", "Twitter", "ועדת החוקה"
   - Use Hebrew name for Israeli outlets
   - Max 500 characters

7. **Source Credibility** (sourceCredibility field):
   - Rate 1-10 based on source reputation:
     - 9-10: Knesset official records, major news outlets (Ynet, Mako, Walla, Haaretz)
     - 7-8: Verified social media, reputable interviews (Channel 12, Channel 13)
     - 5-6: Smaller news sites, unverified social media
     - 3-4: Blogs, personal websites
     - 1-2: Questionable sources, rumors
   - Consider: Source reputation, verification status, editorial standards

VALIDATION CHECKLIST:
✓ Quote is in Hebrew or English (not translated)
✓ Quote explicitly mentions recruitment law (contains keywords)
✓ Quote is attributed to {MK_NAME} (not someone else)
✓ Date is within 2019-2025 range
✓ URL is accessible (test before submitting)
✓ Content length is 50-1000 chars (not too short/long)
✓ All required fields present (content, sourceUrl, sourcePlatform, sourceType, commentDate)

OUTPUT FORMAT (JSON):
{
  "mkId": {MK_ID},
  "content": "הציבור הדתי לא יתפשר על חוק הגיוס המקורי...",
  "sourceUrl": "https://www.ynet.co.il/news/article/example123",
  "sourcePlatform": "News",
  "sourceType": "Primary",
  "commentDate": "2024-03-15T14:30:00Z",
  "sourceName": "ידיעות אחרונות",
  "sourceCredibility": 9
}

EDGE CASES:
- **Paywall**: Use archive.org or skip if inaccessible
- **Missing date**: Skip source (date is required)
- **Ambiguous quote**: Skip if not clearly from MK
- **Multiple quotes**: Create separate entries for each distinct statement
- **Mixed Hebrew/English**: Keep original language, don't translate
- **Quote too long**: Extract most relevant 1-2 sentences (up to 1000 chars)

REJECTION CRITERIA (do not submit):
❌ Quote does not mention recruitment law keywords
❌ Quote is about MK, not BY MK
❌ Quote is paraphrased/indirect (unless Secondary source)
❌ Date missing or outside 2019-2025 range
❌ URL inaccessible/broken
❌ Quote too vague or generic ("החוק חשוב" without context)
```

---

## Workflow Steps

### Phase 1: Setup (30 minutes)

#### 1.1 Obtain MK Data
```bash
# Export coalition members with IDs
npx tsx scripts/export-coalition-mks.ts

# Output: docs/mk-coalition/coalition-members.csv
# Contains: 64 coalition members with MK_ID, Name, Faction, X_Account
```

#### 1.2 Verify API Access
```bash
# Check environment API key
echo $NEWS_API_KEY

# Test API connection
curl -X GET https://your-domain.com/api/historical-comments?limit=1 \
  -H "Authorization: Bearer $NEWS_API_KEY"

# Expected: 200 OK with comments array
```

#### 1.3 Create Tracking Spreadsheet

**Columns**:
- MK_ID (number)
- Name_Hebrew (text)
- Faction (text)
- Statements_Found (number, 0-10)
- Submitted_Count (number, 0-5)
- Status (dropdown: Not Started | In Progress | Complete | Blocked)
- Notes (text, errors/issues)

**Pre-populate**:
- Import 64 MKs from coalition CSV
- Add formulas: `=SUM(Submitted_Count)` for total, `=COUNTIF(Status, "Complete")` for completion

---

### Phase 2: Per-MK Processing (30-40 minutes each)

#### 2.1 Search for Statements (10-15 min)

**Step 1**: Select MK from tracking sheet
- Note: MK_ID, Name (Hebrew + English), Faction

**Step 2**: Execute 4 targeted searches using Web Search Prompt

**Search 1 - News Sites** (Priority):
```
"{MK_NAME_HEBREW}" "חוק גיוס" OR "גיוס חרדים" site:.co.il
```
- Target: Ynet, Walla, Mako, Haaretz, Jerusalem Post
- Expected: 5-10 results
- Quick scan: Check if quote is BY MK (not ABOUT)

**Search 2 - Social Media**:
```
"{MK_NAME_HEBREW}" OR "{MK_NAME_ENGLISH}" (חוק גיוס OR draft law) (site:twitter.com OR site:facebook.com)
```
- Target: Twitter/X, Facebook posts
- Expected: 3-7 results
- Verify: Account is verified (blue checkmark)

**Search 3 - Knesset Records**:
```
"{MK_NAME_HEBREW}" site:knesset.gov.il (גיוס OR חוק)
```
- Target: Committee protocols, plenary speeches
- Expected: 2-5 results
- Note: Highest credibility (9-10)

**Search 4 - Video Interviews**:
```
"{MK_NAME_HEBREW}" "חוק גיוס" site:youtube.com
```
- Target: News channel interviews, Knesset channel
- Expected: 2-5 results
- Check: Video is from 2019-2025

**Step 3**: Collect candidate URLs
- Save 10-15 URLs total across all searches
- Bookmark or paste into temporary text file
- Quick relevance check (scan first paragraph for keywords)

#### 2.2 Extract Structured Data (15-20 min)

**Step 1**: For each URL, use Content Extraction Prompt

**Step 2**: Fill extraction template
```json
{
  "mkId": 1,  // From tracking sheet
  "content": "",  // EXACT quote (50-1000 chars)
  "sourceUrl": "",  // Full URL
  "sourcePlatform": "",  // News|Twitter|Facebook|YouTube|Knesset|Interview|Other
  "sourceType": "",  // Primary|Secondary
  "commentDate": "",  // YYYY-MM-DDTHH:MM:SSZ
  "sourceName": "",  // Publication name (Hebrew)
  "sourceCredibility": 0  // 1-10
}
```

**Step 3**: Run validation checklist (9 items)
- [ ] Quote in Hebrew/English (original language)
- [ ] Contains recruitment law keyword
- [ ] Attributed to correct MK
- [ ] Date within 2019-2025
- [ ] URL accessible (not 404/paywall)
- [ ] Content length 50-1000 chars
- [ ] All required fields filled
- [ ] Platform/type valid enums
- [ ] Credibility score 1-10

**Step 4**: Check rejection criteria
- If ANY criterion met → Skip source, move to next URL
- Document reason in Notes column

**Step 5**: Save validated JSON
- Create file: `comments_mk_{MK_ID}.json`
- Array format: `[{comment1}, {comment2}, ...]`
- Target: 4-5 comments per MK

#### 2.3 Submit to API (2-3 min)

**Option A - Manual cURL** (for testing):
```bash
curl -X POST https://your-domain.com/api/historical-comments \
  -H "Authorization: Bearer $NEWS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 1,
    "content": "חוק הגיוס הוא...",
    "sourceUrl": "https://...",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "commentDate": "2024-03-15T14:30:00Z",
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 9
  }'

# Expected response:
# Status: 201 Created
# Body: { "id": 123, "mkId": 1, "isDuplicate": false, ... }
```

**Option B - Batch Script** (for production):
```bash
# Submit all comments in file
npx tsx scripts/submit-historical-comments.ts comments_mk_1.json

# Script features:
# - Validates JSON before submission
# - Handles rate limiting (waits for reset)
# - Retries failed submissions (3 attempts)
# - Logs errors to file
# - Shows progress (5/5 submitted)
```

**Step**: Monitor submission
- Check HTTP status: 201 = success
- Check response body: `isDuplicate` flag (true if similar exists)
- Log errors for retry
- Update tracking sheet: Submitted_Count

#### 2.4 Update Tracking Sheet

**After each MK**:
- Statements_Found: Total URLs collected (e.g., 12)
- Submitted_Count: Successful submissions (e.g., 5)
- Status: "Complete" (if 4-5 submitted) or "In Progress"
- Notes: Any issues ("Paywall blocked 3 sources", "No Knesset records found")

---

### Phase 3: Quality Assurance (10% sample, ~30 min)

#### 3.1 Spot-Check Submissions

**Step 1**: Select random sample (6-7 MKs)
```bash
# Generate random MK IDs for checking
shuf -i 1-64 -n 7
```

**Step 2**: Verify in admin dashboard
- Navigate: `/admin/historical-comments`
- Filter by MK: Select sampled MK
- Check criteria:
  - [ ] All 4-5 comments appear
  - [ ] Credibility scores reasonable (avg 6-9)
  - [ ] Dates diverse (not all from same year)
  - [ ] Platforms diverse (mix of News, Twitter, Knesset)
  - [ ] Content quality (substantial quotes, not soundbites)
  - [ ] URLs accessible (click through to verify)

**Step 3**: Manual validation
- Read 2-3 quotes from each MK
- Verify quote matches source URL
- Check attribution is correct
- Ensure recruitment law relevance

#### 3.2 Fix Issues

**If errors found**:
1. Identify pattern (e.g., all dates wrong, credibility scores too high)
2. Review extraction process for systematic errors
3. Update prompts or checklist if needed
4. Re-process affected MKs
5. Document fix in Notes

**Common issues**:
- Dates in wrong format → Re-extract with correct ISO8601
- Credibility scores inflated → Re-calibrate using guidelines
- Quotes too short → Add context or skip source
- Wrong MK attribution → Delete comment, re-search

---

### Phase 4: Scale & Complete

#### 4.1 Process Remaining MKs

**Strategy**:
- Work through list systematically by party (keeps context)
- Process high-profile MKs first (ministers, party leaders - easier to find statements)
- Take breaks every 5 MKs (10 min rest to avoid fatigue)
- Target: 8-10 MKs per day (full-time) or 3-5 per day (part-time)

**Daily routine**:
1. Morning: Setup (10 min) + Process 4 MKs (2.5 hours)
2. Lunch break (1 hour)
3. Afternoon: QA spot-check (30 min) + Process 4 MKs (2.5 hours)
4. End of day: Update tracking, review errors (20 min)

**Estimated completion**:
- Full-time (8 MKs/day): 8 business days
- Part-time (4 MKs/day): 16 business days
- Weekend work: Add 2-3 days for QA and fixes

#### 4.2 Final Verification

**Step 1**: Generate statistics
```bash
# Run stats script
npx tsx scripts/historical-comments-stats.ts

# Output:
# Total comments: 328
# Per-MK breakdown: 64 MKs (min: 4, max: 6, avg: 5.1)
# Source distribution: News 45%, Twitter 25%, Knesset 20%, Other 10%
# Avg credibility: 7.3
# Primary sources: 62%
```

**Step 2**: Check targets
- [ ] Total ≥ 320 comments
- [ ] All 64 MKs have ≥ 4 comments
- [ ] Avg credibility ≥ 7
- [ ] Primary sources ≥ 60%
- [ ] Date range coverage (at least 3 different years represented)

**Step 3**: Final admin review
- Navigate: `/admin/historical-comments`
- Sort by MK: Verify each MK has entries
- Filter by platform: Check distribution is reasonable
- Filter by pending: Ensure status is not stuck in PENDING

---

## Data Validation Checklist

### Pre-Submission Validation

**Content Field**:
- [x] Contains exact quote (not paraphrase)
- [x] Includes recruitment law keyword (חוק גיוס, גיוס חרדים, recruitment law, draft law)
- [x] Length: 50-1000 characters
- [x] Original language (Hebrew or English, not translated)
- [x] Attributed to correct MK (name mentioned in source)

**URL Field**:
- [x] Full URL (not shortened link)
- [x] Accessible (not behind paywall, test in incognito mode)
- [x] Not 404/broken (click to verify)
- [x] Matches content (correct article, not homepage)

**Date Field**:
- [x] ISO8601 format: YYYY-MM-DDTHH:MM:SSZ (e.g., 2024-03-15T14:30:00Z)
- [x] Within 2019-2025 range
- [x] Matches article/post date (check page source if needed)
- [x] Realistic (not future date, not before MK was in office)

**Platform/Type Fields**:
- [x] Platform is valid enum (News, Twitter, Facebook, YouTube, Knesset, Interview, Other)
- [x] Source type matches reality (Primary = direct quote, Secondary = news report)
- [x] Source name provided (publication name in Hebrew, max 500 chars)

**Credibility Score**:
- [x] Within 1-10 range
- [x] Matches source reputation (Knesset=9-10, major news=8-9, social=5-7, blogs=3-4)
- [x] Consistent with guidelines (see extraction prompt)

### Post-Submission Validation

**API Response**:
- [x] Status 201 Created (success)
- [x] Check duplicate warning (`isDuplicate` flag in response body)
- [x] Verify returned comment ID (save for reference)
- [x] Log any errors for retry (400, 422, 500 status codes)

**Database Verification**:
- [x] Comment appears in admin dashboard (`/admin/historical-comments`)
- [x] Linked to correct MK (filter by MK name)
- [x] Status is PENDING (awaiting manual approval)
- [x] Duplicate group assigned if similar exists (`duplicateGroup` UUID)

---

## Common Pitfalls & Solutions

### Pitfall 1: Paywalled Content
**Problem**: Major news sites (Haaretz, Maariv) require subscription

**Solutions**:
1. **Archive.org**: `https://web.archive.org/web/*/ORIGINAL_URL`
   - Search for URL, find snapshot from publication date
   - Use archived version URL in sourceUrl field
2. **Google Cache**: `cache:ORIGINAL_URL` (paste in search bar)
   - May not always available
   - Screenshot if needed for reference
3. **Find alternate source**: Search for same quote on free sites (Ynet, Walla)
   - Use quote snippet as search query
   - Verify quote is identical before using alternate URL
4. **Skip if inaccessible**: Don't guess content, move to next source

**Prevention**: Prioritize free news sites in searches (Ynet, Walla, Mako)

---

### Pitfall 2: Missing Dates
**Problem**: Social media posts or articles don't show publication date

**Solutions**:
1. **Check page source HTML**: Right-click → View Source → Search for "published"
   ```html
   <meta property="article:published_time" content="2024-03-15T14:30:00Z">
   ```
2. **Use archive.org snapshot date**: If archived, use snapshot timestamp
3. **Twitter/X**: Tweet ID in URL can be decoded to estimate date (if visible)
4. **YouTube**: Video upload date shown below player
5. **Last resort**: Skip source (date is required field, cannot be null)

**Prevention**: Prioritize sources with clear timestamps (news sites, Knesset records)

---

### Pitfall 3: Indirect Quotes
**Problem**: Article says "Cohen supports the law" but no direct quote

**Solutions**:
1. **Mark as Secondary source**: Set `sourceType: "Secondary"` (not Primary)
2. **Extract closest quote**: Use reporter's paraphrase if no direct quote
3. **Lower credibility**: Reduce score by 1-2 points for indirect reporting
4. **Prefer direct quotes**: When available, prioritize sources with actual quotes

**Prevention**: Use "quote" OR "אמר" OR "stated" in search queries

---

### Pitfall 4: Translation Confusion
**Problem**: English article quotes Hebrew statement (translated)

**Solutions**:
1. **Find original Hebrew source**: Search for key phrase from English quote in Hebrew
2. **Use English quote if unavoidable**: But note in `additionalContext` field (future enhancement)
3. **Don't back-translate**: Never translate English → Hebrew yourself (accuracy issues)
4. **Prefer original language**: Hebrew quotes from Israeli sources most reliable

**Prevention**: Prioritize Hebrew-language sources (Israeli news sites)

---

### Pitfall 5: Ambiguous Attribution
**Problem**: Article quotes multiple MKs, unclear who said what

**Solutions**:
1. **Only extract if 100% clear**: Look for "אמר [MK_NAME]" or "said [MK_NAME]"
2. **Check quote tags**: HTML may have `<blockquote cite="MK_NAME">`
3. **Skip if unsure**: Better to skip than attribute incorrectly
4. **Single-MK articles preferred**: When possible, use sources focused on one MK

**Prevention**: Include MK name in search query to find focused articles

---

### Pitfall 6: Generic Statements
**Problem**: Quote mentions "גיוס" but not about the law specifically

**Solutions**:
1. **Verify context**: Ensure "חוק" (law) is mentioned nearby in article
2. **Check keyword match**: Must include primary keyword (חוק גיוס, גיוס חרדים)
3. **Skip if too vague**: Generic statements like "גיוס חשוב" without context
4. **Prefer specific policy statements**: Look for mentions of bill numbers, vote positions

**Prevention**: Use full phrase "חוק גיוס" in search (not just "גיוס")

---

### Pitfall 7: Duplicate Detection
**Problem**: Same quote submitted multiple times from different sources

**Solutions**:
1. **API auto-detects**: System uses 85% similarity threshold to link duplicates
2. **Check `isDuplicate` flag**: Response body shows if similar comment exists
3. **Keep highest credibility**: If duplicate, original with higher score is kept
4. **Don't manually check**: Let system handle deduplication (more efficient)

**Note**: Duplicates are linked but not rejected (useful for cross-referencing sources)

---

### Pitfall 8: Rate Limiting
**Problem**: API returns `429 Too Many Requests`

**Solutions**:
1. **Check reset header**: `X-RateLimit-Reset` shows Unix timestamp when limit resets
2. **Wait until reset**: Calculate wait time: `resetTime - currentTime`
3. **Reduce batch size**: Submit 10 comments instead of 20 per batch
4. **Use environment API key**: 1000/hour limit (vs 100/hour for database keys)

**Example wait script**:
```bash
# Extract reset time from response header
RESET_TIME=$(curl -I /api/historical-comments | grep X-RateLimit-Reset | awk '{print $2}')

# Calculate wait seconds
WAIT_SECONDS=$((RESET_TIME - $(date +%s)))

# Wait and retry
echo "Rate limited. Waiting $WAIT_SECONDS seconds..."
sleep $WAIT_SECONDS
```

**Prevention**: Space out submissions, monitor `X-RateLimit-Remaining` header

---

### Pitfall 9: Content Length Issues
**Problem**: Quote is too short (<50 chars) or too long (>1000 chars)

**Solutions - Too Short**:
1. **Add context**: Include adjacent sentence for clarity
   - Example: "הוא אמר: 'החוק חשוב'" → "בדיון אמש, הוא אמר: 'החוק חשוב למדינת ישראל'"
2. **Verify keyword present**: Ensure expanded quote still includes recruitment law term
3. **Skip if still too short**: Don't pad artificially

**Solutions - Too Long**:
1. **Extract core statement**: Identify most relevant 1-2 sentences
2. **Use ellipsis**: Indicate omitted text: "... החוק הזה ..."
3. **Prioritize completeness**: Better slightly over limit than missing key context
4. **Max 1000 chars**: Hard limit, truncate if necessary

**Prevention**: Scan quote length before full extraction

---

### Pitfall 10: Source Credibility Bias
**Problem**: Over-rating or under-rating sources based on political views

**Solutions**:
1. **Use objective criteria**: Follow credibility guidelines strictly
   - Knesset records: Always 9-10 (official government source)
   - Major news outlets: Always 8-9 (editorial standards)
   - Social media: 5-7 (depends on verification status)
2. **Separate content from credibility**: MK's statement quality ≠ source credibility
3. **Cross-check ratings**: Review 10 submissions, check for consistency
4. **Ask for second opinion**: If unsure, consult with team member

**Prevention**: Create reference list of common sources with pre-assigned scores

---

## Performance Optimization

### Batch Processing Strategy

**By Party** (Recommended):
- Process all Likud MKs together (32 members)
- Then Shas (11 members)
- Then UTJ (7 members)
- Advantage: Shared context, similar search results

**By Profile** (Alternative):
- High-profile first: Ministers, party leaders (easier to find statements)
- Mid-profile: Committee chairs, spokespersons
- Low-profile: Backbenchers (may take longer)
- Advantage: Early wins boost morale

**Parallel Processing**:
- Open 3-4 browser tabs for concurrent searches
- One tab per search type (news, social, Knesset, video)
- Extract in batches (10 URLs at once)
- Submit in batches (20 comments per API call)

### Time Estimates

**Per MK (Sequential)**:
- Search phase: 10-15 min (4 searches × 3 min avg)
- Extraction phase: 15-20 min (10 URLs × 1.5 min avg)
- Submission phase: 2-3 min (batch API call + validation)
- **Total**: 30-40 minutes per MK

**Per MK (Optimized with Parallel)**:
- Search phase: 8-10 min (parallel searches)
- Extraction phase: 12-15 min (batch extraction)
- Submission phase: 2 min (automated script)
- **Total**: 22-27 minutes per MK

**Full Project**:
- 64 MKs × 35 min avg = 2,240 minutes = **37 hours**
- With optimization: 64 MKs × 25 min = 1,600 minutes = **27 hours**
- Realistic timeline:
  - Full-time (8 hours/day): 5-7 business days
  - Part-time (4 hours/day): 10-14 business days

### Efficiency Tips

1. **Reuse searches**: If processing multiple MKs from same party, combine search queries
   - Example: "(Netanyahu OR Levin OR Katz) חוק גיוס" instead of 3 separate searches
   - Extract 15 URLs total, distribute across 3 MKs

2. **Prioritize high-profile MKs**: Ministers and party leaders have more public statements
   - Start with: Netanyahu, Deri, Smotrich, Ben-Gvir (easier to find 5+ each)
   - Builds confidence and momentum

3. **Use browser extensions**:
   - Archive.org quick check extension (one-click wayback lookup)
   - Date extraction bookmarklet (auto-extract from page source)
   - JSON formatter (pretty-print for validation)

4. **Template JSON**: Pre-fill common fields for batch work
   ```json
   {
     "mkId": 1,
     "sourcePlatform": "News",
     "sourceType": "Primary",
     "sourceCredibility": 8
   }
   ```
   - Fill in only: content, sourceUrl, commentDate, sourceName per quote

5. **Track progress obsessively**: Update spreadsheet immediately after each MK
   - Prevents: "Did I already do this MK?" confusion
   - Enables: Quick progress check (70% done!)
   - Motivates: Visual completion bar

---

## Tools & Resources

### Required Tools

**WebSearch MCP**:
- Purpose: Search Israeli news sites, social media, Knesset records
- Usage: `WebSearch` tool with optimized queries
- Alternative: Google Search + manual web browsing

**WebFetch MCP** (Optional):
- Purpose: Extract article content from URLs
- Usage: Fetch HTML, parse for quotes and dates
- Alternative: Manual copy-paste from browser

**API Key**:
- Environment variable: `NEWS_API_KEY` in `.env` file
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- Rate limit: 1000 requests/hour (environment keys)

**Tracking Spreadsheet**:
- Google Sheets (recommended for cloud sync) or Excel
- Template: See "Create Tracking Spreadsheet" section above
- Backup: Export to CSV daily

### Helpful Resources

**MK Data**:
- Coalition member list: `docs/mk-coalition/coalition-members.csv` (64 members)
- Knesset directory: https://knesset.gov.il/mk/heb/mkindex_current.asp
- X/Twitter accounts: Included in coalition CSV (93.75% coverage)

**Archive Tools**:
- Wayback Machine: https://web.archive.org
- Google Cache: `cache:URL` in search bar
- Archive.today: https://archive.ph (alternative archiver)

**Date Extraction**:
- Online parser: https://dateparser.io (paste text, extracts dates)
- Browser DevTools: F12 → Network tab → Headers → Look for timestamp
- Page source: Right-click → View Source → Search for "time" or "date"

**API Reference**:
- Documentation: `docs/api/HISTORICAL_COMMENTS_API.md`
- Integration guide: `docs/historical-comments/API_INTEGRATION_GUIDE.md`
- Endpoint: `POST /api/historical-comments`
- Auth header: `Authorization: Bearer YOUR-API-KEY`

### Coalition MK Reference

**הליכוד (Likud) - 32 members**:
- High-profile: Benjamin Netanyahu, Yariv Levin, Israel Katz, Yoav Gallant
- Full list: See `docs/mk-coalition/coalition-members.csv`

**ש״ס (Shas) - 11 members**:
- High-profile: Aryeh Deri, Moshe Arbel, Yitzhak Cohen

**יהדות התורה (UTJ) - 7 members**:
- High-profile: Moshe Gafni, Uri Maklev, Yitzhak Goldknopf

**הציונות הדתית (Religious Zionism) - 7 members**:
- High-profile: Bezalel Smotrich, Simcha Rothman, Orit Strook

**עוצמה יהודית (Otzma Yehudit) - 6 members**:
- High-profile: Itamar Ben-Gvir, Zvika Fogel

**נעם (Noam) - 1 member**:
- Avi Maoz

---

## Success Metrics

### Quantitative Goals

**Volume**:
- [ ] **320+ total comments** (64 MKs × 5 average)
- [ ] **All 64 MKs have ≥4 comments** (minimum coverage)
- [ ] **80%+ from high-credibility sources** (score ≥7)
- [ ] **60%+ Primary sources** (direct quotes preferred)
- [ ] **<10% duplicate rate** (system auto-detects, linked not rejected)
- [ ] **100% date coverage** (all have valid dates in 2019-2025 range)

**Distribution**:
- [ ] **Source platforms**: Mix of News (40-50%), Social Media (20-30%), Knesset (15-25%), Other (5-10%)
- [ ] **Time spread**: At least 3 different years represented per MK
- [ ] **Credibility average**: ≥7.0 overall (weighted by count)

### Qualitative Goals

**Content Quality**:
- [ ] **Substantial quotes**: Meaningful policy statements, not soundbites ("החוק חשוב" insufficient)
- [ ] **Accurate attribution**: No misattributed quotes (100% verified)
- [ ] **Accessible sources**: All URLs work, not behind paywalls (or archived versions provided)
- [ ] **Relevance**: All quotes explicitly mention recruitment law (keywords present)

**Process Quality**:
- [ ] **Validation compliance**: 100% of submissions passed checklist (9 items)
- [ ] **Rejection discipline**: No invalid sources submitted (rejection criteria enforced)
- [ ] **Tracking accuracy**: Spreadsheet reflects actual database state
- [ ] **Error handling**: All failed submissions documented and retried or resolved

---

## Error Recovery

### API Errors

**401 Unauthorized**:
- **Cause**: Invalid or missing API key
- **Solution**:
  1. Check `.env` file: `NEWS_API_KEY="your-key-here"`
  2. Verify header: `Authorization: Bearer YOUR-API-KEY` (space after Bearer)
  3. Restart dev server if `.env` changed
  4. Test with cURL before batch submission

**400 Bad Request**:
- **Cause**: Malformed JSON or missing required field
- **Solution**:
  1. Validate JSON syntax (use jsonlint.com)
  2. Check required fields: mkId, content, sourceUrl, sourcePlatform, sourceType, commentDate
  3. Review error message in response body (Hebrew)
  4. Fix and resubmit

**422 Unprocessable Entity**:
- **Cause**: Validation error (content too short, invalid date, etc.)
- **Solution**:
  1. Read error message (specific field and reason)
  2. Common issues:
     - Content <50 chars → Add context
     - Date format wrong → Use ISO8601 (YYYY-MM-DDTHH:MM:SSZ)
     - Missing keyword → Re-check quote relevance
     - MK not coalition member → Verify MK ID
  3. Fix data and resubmit

**429 Too Many Requests**:
- **Cause**: Rate limit exceeded (100 or 1000 per hour depending on key type)
- **Solution**:
  1. Check `X-RateLimit-Reset` header (Unix timestamp)
  2. Calculate wait time: `resetTime - currentTime`
  3. Wait until reset (usually 1 hour from first request)
  4. Monitor `X-RateLimit-Remaining` to prevent future limits
  5. Consider using environment key (1000/hour vs 100/hour)

**500 Internal Server Error**:
- **Cause**: Server-side error (bug, database issue)
- **Solution**:
  1. Retry after 1 minute (may be temporary)
  2. If persists, report to developer with:
     - Request body (JSON)
     - Timestamp of error
     - Error message (if any)
  3. Skip submission temporarily, log for later retry

### Data Quality Errors

**Content Too Short**:
- **Symptom**: Validation error "Content must be at least 50 characters"
- **Fix**: Add context from surrounding sentences, ensure keyword still present

**Invalid Date Format**:
- **Symptom**: Validation error "Invalid date format"
- **Fix**: Convert to ISO8601
  - From: "15/03/2024 14:30"
  - To: "2024-03-15T14:30:00Z"
  - Tool: https://www.timestamp-converter.com

**Broken URL**:
- **Symptom**: 404 when clicking source link
- **Fix**:
  1. Check for typos in URL
  2. Use archive.org to find snapshot
  3. If unavailable, skip source and find alternate

**Missing Recruitment Law Keyword**:
- **Symptom**: Validation error "Content not related to recruitment law"
- **Fix**: Re-check quote, ensure it includes: חוק גיוס, חוק הגיוס, גיוס חרדים, recruitment law, or draft law
- **If not present**: Skip source (quote not relevant)

**Wrong MK Attribution**:
- **Symptom**: Comment appears under wrong MK in admin
- **Fix**:
  1. Delete comment via admin dashboard
  2. Find correct MK ID from coalition CSV
  3. Resubmit with correct mkId

---

## Completion Checklist

### Per-MK Completion
- [ ] 4-5 statements found and validated (quality over quantity)
- [ ] All submissions successful (201 status, no errors)
- [ ] Tracking sheet updated (Submitted_Count, Status = "Complete")
- [ ] No critical errors (all required fields present, validation passed)
- [ ] Comments visible in admin dashboard (filter by MK name)

### Project Completion
- [ ] All 64 MKs processed (100% coverage)
- [ ] Total count ≥320 comments (verify with stats script)
- [ ] Quality spot-check passed (10% sample, no major issues)
- [ ] Error log reviewed (all errors resolved or documented)
- [ ] Final statistics generated (distribution, credibility, platforms)
- [ ] Tracking spreadsheet backed up (export to CSV)
- [ ] Admin dashboard reviewed (all MKs have entries, no orphaned comments)

---

## Appendix: Example Workflow

### Complete Example: Processing Benjamin Netanyahu

**Step 1: Setup**
- MK_ID: 1 (from coalition CSV)
- Name: בנימין נתניהו (Benjamin Netanyahu)
- Faction: הליכוד

**Step 2: Search Phase** (10 min)

**Search 1 - News Sites**:
```
"בנימין נתניהו" "חוק גיוס" OR "גיוס חרדים" site:.co.il
```
Results:
- Ynet article (2024-03-15): Netanyahu defends recruitment law
- Walla article (2023-11-20): PM speaks on draft exemptions
- Mako article (2024-01-10): Coalition meeting on recruitment

**Search 2 - Social Media**:
```
"בנימין נתניהו" (חוק גיוס OR draft law) site:twitter.com
```
Results:
- Twitter post (2024-02-05): Netanyahu's statement on law
- Facebook post (2023-09-12): PM's stance on exemptions

**Search 3 - Knesset**:
```
"בנימין נתניהו" site:knesset.gov.il גיוס
```
Results:
- Knesset protocol (2024-01-25): PM speech in plenary
- Committee meeting (2023-10-30): Coalition discussion

**Collected**: 7 candidate URLs

**Step 3: Extraction Phase** (15 min)

**URL 1 - Ynet Article**:
```json
{
  "mkId": 1,
  "content": "חוק הגיוס החדש ישמר על הצרכים הביטחוניים של מדינת ישראל תוך שמירה על אופי המדינה היהודית",
  "sourceUrl": "https://www.ynet.co.il/news/article/example123",
  "sourcePlatform": "News",
  "sourceType": "Secondary",
  "commentDate": "2024-03-15T14:30:00Z",
  "sourceName": "ידיעות אחרונות",
  "sourceCredibility": 9
}
```
✅ Validation: All fields present, quote 75 chars, date valid, credibility appropriate

**URL 2 - Twitter Post**:
```json
{
  "mkId": 1,
  "content": "הצבענו היום בעד חוק הגיוס המתוקן. זהו חוק שמאזן בין צרכי הצבא לבין שמירה על המסורת",
  "sourceUrl": "https://twitter.com/netanyahu/status/1234567890",
  "sourcePlatform": "Twitter",
  "sourceType": "Primary",
  "commentDate": "2024-02-05T10:15:00Z",
  "sourceName": "Twitter",
  "sourceCredibility": 7
}
```
✅ Validation: Direct quote (Primary), verified account, date from tweet timestamp

**URL 3 - Knesset Protocol**:
```json
{
  "mkId": 1,
  "content": "אנחנו עומדים בפני אתגר לאזן בין הצרכים הביטחוניים של המדינה לבין הצורך לשמר את אופייה היהודי. חוק הגיוס הנוכחי אינו מושלם, אך הוא צעד נכון בכיוון הנכון",
  "sourceUrl": "https://main.knesset.gov.il/Activity/plenum/Pages/SessionItem.aspx?itemID=12345",
  "sourcePlatform": "Knesset",
  "sourceType": "Primary",
  "commentDate": "2024-01-25T15:00:00Z",
  "sourceName": "ועדת הכנסת",
  "sourceCredibility": 10
}
```
✅ Validation: Official Knesset record (highest credibility), substantial quote

**Continued for 2 more URLs...**

**Total extracted**: 5 valid comments

**Step 4: Submission Phase** (3 min)

```bash
# Save to file
cat > comments_mk_1.json << EOF
[
  { ... comment 1 ... },
  { ... comment 2 ... },
  { ... comment 3 ... },
  { ... comment 4 ... },
  { ... comment 5 ... }
]
EOF

# Submit batch
npx tsx scripts/submit-historical-comments.ts comments_mk_1.json

# Output:
# Submitting 5 comments for MK ID 1...
# ✓ Comment 1/5 submitted (ID: 123)
# ✓ Comment 2/5 submitted (ID: 124, DUPLICATE detected)
# ✓ Comment 3/5 submitted (ID: 125)
# ✓ Comment 4/5 submitted (ID: 126)
# ✓ Comment 5/5 submitted (ID: 127)
# Success: 5/5 comments submitted
```

**Step 5: Update Tracking Sheet**
- Statements_Found: 7
- Submitted_Count: 5
- Status: Complete
- Notes: "One duplicate detected (comment 2), linked to existing"

**Total time**: ~28 minutes (optimized workflow)

---

## Contact & Support

**Developer Documentation**:
- API Reference: `docs/api/HISTORICAL_COMMENTS_API.md`
- Integration Guide: `docs/historical-comments/API_INTEGRATION_GUIDE.md`
- Database Schema: `docs/historical-comments/DEVELOPER_GUIDE.md`

**Issue Reporting**:
- GitHub: Create issue with label "historical-comments"
- Include: Error message, request body, timestamp, MK ID

**Questions**:
- Technical: Check developer guides first
- Process: Re-read this guide, Common Pitfalls section
- Data quality: Use validation checklist, consult QA section

---

**Last Updated**: 2025-12-05
**Version**: 1.0
**Status**: ✅ Production-Ready

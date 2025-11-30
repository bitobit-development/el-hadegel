# Historical Comments API Integration Guide

> **📋 For**: Developers integrating with the Historical Comments API
> **⏱️ Reading time**: 20 minutes
> **🎯 Goal**: Successfully integrate external systems to submit and retrieve historical comments

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Endpoints Reference](#endpoints-reference)
4. [Data Validation](#data-validation)
5. [Deduplication Behavior](#deduplication-behavior)
6. [CSV Bulk Import](#csv-bulk-import)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Error Handling](#error-handling)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- API key (environment variable or database-generated)
- HTTPS endpoint access
- JSON request/response capability
- Coalition MK IDs (64 members)

### Your First API Call

```bash
# 1. Get your API key
export API_KEY="your-api-key-here"

# 2. Submit a historical comment
curl -X POST https://your-domain.com/api/historical-comments \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 1,
    "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל",
    "sourceUrl": "https://www.ynet.co.il/news/article/example",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "commentDate": "2024-01-15T10:00:00Z"
  }'

# 3. Verify success (201 Created)
# Response includes comment ID and duplicate status
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "id": 123,
    "mkId": 1,
    "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל",
    "sourceUrl": "https://www.ynet.co.il/news/article/example",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "commentDate": "2024-01-15T10:00:00.000Z",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "keywords": ["חוק גיוס"],
    "isDuplicate": false,
    "duplicateOf": null,
    "duplicateGroup": "abc-123-def-456"
  }
}
```

---

## Authentication

The API supports two authentication modes for flexibility and scalability.

### Environment Variable Method (Development/Simple Setup)

**Best for**:
- Development and testing
- Single-user/single-system integration
- Quick prototyping
- Internal tools

**Setup**:

1. **Generate API Key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

2. **Add to Environment Variables**:
```bash
# Local development (.env file)
NEWS_API_KEY="generated-key-here"

# Vercel deployment
vercel env add NEWS_API_KEY production
```

3. **Use in Requests**:
```bash
curl -H "Authorization: Bearer $NEWS_API_KEY" \
  https://your-domain.com/api/historical-comments
```

**Advantages**:
- ✅ Simple setup (no database needed)
- ✅ Higher rate limit (1000 requests/hour)
- ✅ No key management overhead
- ✅ Instant revocation (change env variable)

**Disadvantages**:
- ❌ Single key only
- ❌ No usage tracking
- ❌ No lastUsedAt timestamp
- ❌ Server restart required to change key

### Database API Key Method (Production/Multi-User)

**Best for**:
- Production deployments
- Multiple external systems
- Usage tracking and analytics
- Granular access control

**Setup**:

1. **Generate API Key via Admin Interface** (future feature):
```
/admin/api-keys → Create New Key → Name: "External Scraper"
```

2. **Copy Plain Key** (shown only once):
```
Generated API Key: abc123def456...
⚠️ Save this key securely. It will not be shown again.
```

3. **Use in Requests**:
```bash
curl -H "Authorization: Bearer abc123def456..." \
  https://your-domain.com/api/historical-comments
```

**Advantages**:
- ✅ Multiple keys supported
- ✅ Usage tracking (lastUsedAt)
- ✅ Individual key enable/disable
- ✅ Key naming for organization
- ✅ No server restart for revocation

**Disadvantages**:
- ❌ Lower rate limit (100 requests/hour per key)
- ❌ Requires database setup
- ❌ Key management overhead

### Authentication Headers

All authenticated requests must include:

```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Example**:
```bash
curl -X POST https://your-domain.com/api/historical-comments \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{"mkId":1,"content":"..."}'
```

### Rate Limits

| Authentication Method | Limit | Window | Headers |
|----------------------|-------|--------|---------|
| Environment Variable | 1000 requests | 1 hour | X-RateLimit-Limit: 1000 |
| Database API Key | 100 requests | 1 hour | X-RateLimit-Limit: 100 |

**Rate Limit Headers** (included in every response):
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1705334400
```

**When Rate Limit Exceeded** (429 Too Many Requests):
```json
{
  "error": "חריגה ממגבלת קצב הבקשות",
  "retryAfter": 1705334400
}
```

**Response Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705334400
Retry-After: 3600
```

---

## Endpoints Reference

### POST /api/historical-comments

Create a new historical comment with automatic deduplication.

**URL**: `https://your-domain.com/api/historical-comments`

**Method**: `POST`

**Authentication**: Required (Bearer token)

**Request Body** (JSON):

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `mkId` | number | ✅ Yes | Must exist in DB, coalition member | MK ID (1-120) |
| `content` | string | ✅ Yes | 10-5000 chars, recruitment law keywords | Comment text |
| `sourceUrl` | string | ✅ Yes | Valid URL, max 2000 chars | Original source |
| `sourcePlatform` | string | ✅ Yes | Enum: News, Twitter, Facebook, YouTube, Knesset, Interview, Other | Platform type |
| `sourceType` | string | ✅ Yes | Enum: Primary, Secondary | Source type |
| `commentDate` | string | ✅ Yes | ISO8601 format | When comment made |
| `sourceName` | string | ❌ No | Max 500 chars | Source name |
| `sourceCredibility` | number | ❌ No | 1-10 range | Credibility score |
| `imageUrl` | string | ❌ No | Valid URL | Image link |
| `videoUrl` | string | ❌ No | Valid URL | Video link |
| `keywords` | string[] | ❌ No | Array of strings | Keywords |

**Example Request**:
```bash
curl -X POST https://your-domain.com/api/historical-comments \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 1,
    "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל ויש להעביר אותו במהרה",
    "sourceUrl": "https://www.ynet.co.il/news/article/example123",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "commentDate": "2024-01-15T10:30:00Z",
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 8,
    "imageUrl": "https://images.ynet.co.il/example.jpg"
  }'
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 123,
    "mkId": 1,
    "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל ויש להעביר אותו במהרה",
    "contentHash": "a1b2c3d4...",
    "sourceUrl": "https://www.ynet.co.il/news/article/example123",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 8,
    "commentDate": "2024-01-15T10:30:00.000Z",
    "publishedAt": "2024-01-15T10:30:00.000Z",
    "keywords": ["חוק גיוס", "מדינת ישראל"],
    "imageUrl": "https://images.ynet.co.il/example.jpg",
    "videoUrl": null,
    "isDuplicate": false,
    "duplicateOf": null,
    "duplicateGroup": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:35:22.123Z"
  }
}
```

**Duplicate Detected Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 124,
    "isDuplicate": true,
    "duplicateOf": 123,
    "duplicateGroup": "550e8400-e29b-41d4-a716-446655440000",
    "similarity": 0.92,
    "message": "התוכן זוהה ככפילות (92% דמיון) והוקשר להערה #123"
  }
}
```

### GET /api/historical-comments

Retrieve historical comments with filtering and pagination.

**URL**: `https://your-domain.com/api/historical-comments`

**Method**: `GET`

**Authentication**: Required (Bearer token)

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mkId` | number | - | Filter by specific MK |
| `platform` | string | - | Filter by platform (News, Twitter, etc.) |
| `verified` | boolean | - | Filter by verification status |
| `sourceType` | string | - | Filter by Primary/Secondary |
| `limit` | number | 50 | Results per page (max 100) |
| `offset` | number | 0 | Pagination offset |
| `sortBy` | string | "date" | Sort by: "date" or "credibility" |
| `order` | string | "desc" | Sort order: "asc" or "desc" |

**Example Request**:
```bash
curl -X GET "https://your-domain.com/api/historical-comments?mkId=1&limit=20&verified=true&sortBy=credibility&order=desc" \
  -H "Authorization: Bearer YOUR-API-KEY"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 123,
        "mkId": 1,
        "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל",
        "sourceUrl": "https://www.ynet.co.il/news/article/example",
        "sourcePlatform": "News",
        "sourceType": "Primary",
        "sourceName": "ידיעות אחרונות",
        "sourceCredibility": 8,
        "commentDate": "2024-01-15T10:00:00.000Z",
        "publishedAt": "2024-01-15T10:00:00.000Z",
        "keywords": ["חוק גיוס"],
        "isVerified": true,
        "imageUrl": null,
        "videoUrl": null,
        "duplicateOf": null,
        "mk": {
          "id": 1,
          "nameHe": "בנימין נתניהו",
          "faction": "הליכוד"
        },
        "duplicates": [
          {
            "id": 124,
            "sourceUrl": "https://twitter.com/user/status/123",
            "sourcePlatform": "Twitter",
            "sourceName": null,
            "publishedAt": "2024-01-16T12:00:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### OPTIONS /api/historical-comments

CORS preflight request handler.

**URL**: `https://your-domain.com/api/historical-comments`

**Method**: `OPTIONS`

**Authentication**: Not required

**Response Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

---

## Data Validation

### Coalition Member Verification

**Only coalition MKs are accepted** (64 members across 6 parties):

1. **הליכוד (Likud)** - 32 members
2. **התאחדות הספרדים שומרי תורה (Shas)** - 11 members
3. **יהדות התורה (United Torah Judaism)** - 7 members
4. **הציונות הדתית (Religious Zionism)** - 7 members
5. **עוצמה יהודית (Otzma Yehudit)** - 6 members
6. **נעם (Noam)** - 1 member

**Getting Coalition MK IDs**:
```bash
# Query the database
SELECT id, nameHe, faction FROM MK
WHERE faction IN (
  'הליכוד',
  'התאחדות הספרדים שומרי תורה',
  'יהדות התורה',
  'הציונות הדתית',
  'עוצמה יהודית',
  'נעם'
)
ORDER BY id;
```

**Or use the coalition CSV**:
```bash
cat docs/mk-coalition/coalition-members.csv
```

**Error if Opposition MK**:
```json
{
  "error": "חבר הכנסת 'יאיר לפיד' אינו חלק מהקואליציה - מערכת זו מיועדת רק לחברי קואליציה",
  "mkName": "יאיר לפיד",
  "faction": "יש עתיד"
}
```

### Content Validation: Recruitment Law Keywords

**All comments must include at least ONE primary keyword**:

**Primary Keywords** (required, at least 1):
- `חוק גיוס` (recruitment law)
- `חוק הגיוס` (the recruitment law)
- `גיוס חרדים` (haredi draft)
- `recruitment law`
- `draft law`

**Secondary Keywords** (optional, boost relevance):
- `צה״ל` / `IDF`
- `חרדים` / `haredim`
- `ישיבות` / `yeshiva`
- `לימוד תורה` / `Torah study`
- `שירות צבאי` / `military service`

**Valid Examples**:
- ✅ "חוק הגיוס הוא חוק חשוב למדינה"
- ✅ "אני תומך בגיוס חרדים לצה״ל"
- ✅ "The recruitment law must be passed soon"
- ✅ "על ישיבות לתמוך בחוק גיוס"

**Invalid Examples**:
- ❌ "זה חשוב למדינה" (no keywords)
- ❌ "אני חושב שצריך לשנות את המצב" (too vague)
- ❌ "The government should do better" (generic)

**Error Response**:
```json
{
  "error": "התוכן אינו קשור לחוק הגיוס - נא להזין תוכן הכולל מילות מפתח רלוונטיות",
  "hint": "התוכן צריך לכלול לפחות אחת ממילות המפתח: חוק גיוס, גיוס חרדים, recruitment law, draft law"
}
```

### Field Constraints

#### content (string)
- **Min length**: 10 characters
- **Max length**: 5000 characters
- **Must include**: Recruitment law keywords (see above)
- **Allowed**: Hebrew, English, numbers, punctuation
- **Sanitized**: XSS prevention, HTML tags removed

#### sourceUrl (string)
- **Format**: Valid URL (http:// or https://)
- **Max length**: 2000 characters
- **Allowed**: Public URLs only (no localhost, private IPs)
- **Example**: `https://www.ynet.co.il/news/article/12345`

#### sourcePlatform (enum)
- **Allowed values**: `News`, `Twitter`, `Facebook`, `YouTube`, `Knesset`, `Interview`, `Other`
- **Case-sensitive**: Must match exactly
- **Example**: `"News"` ✅ | `"news"` ❌

#### sourceType (enum)
- **Allowed values**: `Primary`, `Secondary`
- **Primary**: Direct quote from MK
- **Secondary**: Reporting about MK's statement
- **Example**: `"Primary"` ✅ | `"primary"` ❌

#### commentDate (string)
- **Format**: ISO8601 (YYYY-MM-DDTHH:MM:SSZ)
- **Timezone**: UTC (Z suffix required)
- **Valid**: `2024-01-15T10:30:00Z` ✅
- **Invalid**: `2024-01-15` ❌ | `2024-01-15 10:30` ❌

#### sourceName (string, optional)
- **Max length**: 500 characters
- **Example**: `"ידיעות אחרונות"`, `"Channel 12 News"`

#### sourceCredibility (number, optional)
- **Range**: 1-10 (inclusive)
- **Default**: 5 (if not provided)
- **Example**: `8` ✅ | `11` ❌ | `0` ❌

#### imageUrl / videoUrl (string, optional)
- **Format**: Valid URL (https:// preferred)
- **Max length**: 2000 characters
- **Validation**: URL format check only (not fetched)

#### keywords (array, optional)
- **Type**: Array of strings
- **Auto-generated**: If not provided, extracted from content
- **Example**: `["חוק גיוס", "צה״ל", "חרדים"]`

### Request Size Limit

- **Maximum**: 100KB per request
- **Exceeds**: 413 Payload Too Large error

```json
{
  "error": "גודל הבקשה גדול מדי (מקסימום 100KB)"
}
```

---

## Deduplication Behavior

The system automatically detects and handles duplicates using a two-tier approach.

### Exact Match Detection (SHA-256 Hash)

**How it Works**:
1. Generate SHA-256 hash of trimmed content
2. Check database for existing hash
3. If match found → Duplicate detected (100% confidence)

**Example**:
```
Content 1: "חוק הגיוס חשוב למדינה"
Hash:      "a1b2c3d4e5f6..."

Content 2: "חוק הגיוס חשוב למדינה"  (identical)
Hash:      "a1b2c3d4e5f6..."  (match!)

Result: Duplicate detected instantly
```

### Fuzzy Match Detection (Levenshtein Distance)

**How it Works**:
1. Normalize content (lowercase, remove punctuation, remove Hebrew particles)
2. Calculate similarity with recent comments (last 90 days)
3. If similarity ≥ 85% → Duplicate detected

**Normalization Process**:
```
Original:   "חוק הגיוס הוא חשוב למדינת ישראל!"
Normalized: "חוק גיוס חשוב למדינת ישראל"

Original:   "חוק הגיוס - חשוב למדינת ישראל."
Normalized: "חוק גיוס חשוב למדינת ישראל"

Similarity: 100% → Duplicate!
```

**Similarity Threshold**:
- **≥ 85%**: Considered duplicate
- **< 85%**: Unique comment

**Example**:
```
Comment A: "חוק הגיוס הוא חוק חשוב למדינת ישראל"
Comment B: "חוק הגיוס הינו חוק חשוב למדינת ישראל"

Normalized A: "חוק גיוס חוק חשוב למדינת ישראל"
Normalized B: "חוק גיוס חוק חשוב למדינת ישראל"

Similarity: 92% → Duplicate!
```

### 90-Day Window

**Why 90 days?**
- Performance optimization (limits comparison scope)
- Relevance (older comments less likely to be duplicates)
- Scalability (prevents exponential growth of comparisons)

**Behavior**:
- Comments older than 90 days are **not checked** for fuzzy duplicates
- Exact hash duplicates are **always detected** (no time limit)

**Example**:
```
Today: 2024-01-15

Comment A (2024-01-10): "חוק הגיוס חשוב" → Within 90 days, checked
Comment B (2023-09-01): "חוק הגיוס חשוב" → Outside 90 days, NOT checked

New Comment (2024-01-15): "חוק הגיוס חשוב"
- Compared with A? ✅ Yes (5 days ago)
- Compared with B? ❌ No (4+ months ago)
```

### Duplicate Group UUIDs

**Purpose**: Link related duplicates together

**How it Works**:
1. First comment creates new UUID: `550e8400-e29b-41d4-a716-446655440000`
2. Duplicate comments get same UUID
3. All comments in group share the UUID

**Example**:
```
Comment 1 (Twitter):  duplicateGroup = "abc-123-def-456"
Comment 2 (Ynet):     duplicateGroup = "abc-123-def-456" (duplicate of 1)
Comment 3 (Facebook): duplicateGroup = "abc-123-def-456" (duplicate of 1)

All three linked via shared UUID
```

### API Response for Duplicates

**Primary Comment (First)**:
```json
{
  "id": 123,
  "isDuplicate": false,
  "duplicateOf": null,
  "duplicateGroup": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Duplicate Comment (Later)**:
```json
{
  "id": 124,
  "isDuplicate": true,
  "duplicateOf": 123,
  "duplicateGroup": "550e8400-e29b-41d4-a716-446655440000",
  "similarity": 0.92,
  "message": "התוכן זוהה ככפילות (92% דמיון) והוקשר להערה #123"
}
```

### Should You Handle Duplicates?

**No, the system handles it automatically**:
- ✅ Duplicate detection is automatic
- ✅ Duplicates are linked to primary comment
- ✅ Statistics exclude duplicates
- ✅ Admin dashboard shows only primary comments

**You should**:
- Track `isDuplicate` flag in response
- Log duplicate detection for monitoring
- Avoid resubmitting known duplicates

**Example Integration**:
```javascript
const response = await submitComment(comment);

if (response.isDuplicate) {
  console.log(`Duplicate detected: linked to comment #${response.duplicateOf}`);
  // Don't retry or resubmit
} else {
  console.log(`New comment created: #${response.id}`);
}
```

---

## CSV Bulk Import

For large-scale historical data import, use the CSV seeding script.

### CSV File Format

**Required Columns** (in order):
```
mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,imageUrl,videoUrl
```

**Example CSV**:
```csv
mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,imageUrl,videoUrl
1,"חוק הגיוס הוא חוק חשוב למדינת ישראל","https://www.ynet.co.il/article/1","News","Primary","2024-01-15T10:00:00Z","ידיעות אחרונות","",""
1,"גיוס חרדים נכון וצודק","https://twitter.com/user/123","Twitter","Primary","2024-01-16T14:30:00Z","","",""
2,"על הממשלה לקדם את חוק הגיוס","https://www.mako.co.il/article/2","News","Secondary","2024-01-17T09:00:00Z","מאקו","https://img.mako.co.il/123.jpg",""
```

**Important**:
- ✅ UTF-8 encoding required (Hebrew characters)
- ✅ Header row mandatory
- ✅ Dates in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)
- ✅ Empty optional fields use empty string: `""`
- ✅ Wrap content in quotes if it contains commas

### Running the Seeding Script

**Command**:
```bash
npx tsx scripts/seed-historical-comments.ts path/to/comments.csv
```

**With Environment Variables**:
```bash
export DATABASE_URL="your-database-url"
npx tsx scripts/seed-historical-comments.ts docs/historical-comments/data.csv
```

**Example Output**:
```
📋 Historical Comments CSV Seeding Script
==========================================

📂 Reading CSV file: data.csv
✅ Found 100 rows to process

🔄 Processing rows...

[1/100] Processing row 2... ✅ CREATED (ID: 1)
[2/100] Processing row 3... ✅ CREATED (ID: 2)
[3/100] Processing row 4... ⚠️  DUPLICATE (linked to #1, 92% similar)
[4/100] Processing row 5... ✅ CREATED (ID: 3)
[5/100] Processing row 6... ❌ FAILED
  Error: Content is not related to recruitment law (missing required keywords)

...

==========================================
📊 SEEDING SUMMARY
==========================================
Total rows processed:    100
✅ Successfully created: 85
⚠️  Marked as duplicate:  10
❌ Failed with errors:   5
==========================================

❌ ERROR DETAILS:
------------------------------------------
Row 6: Content is not related to recruitment law (missing required keywords)
Row 23: Invalid MK ID: 999 (not found in database)
Row 45: Invalid date format (must be ISO8601)
Row 67: MK 'Yair Lapid' is not part of coalition
Row 89: Content too short (minimum 10 characters)
------------------------------------------

✅ Seeding completed! 85 new comments added.
```

### CSV Validation Rules

Same as API validation:
- Coalition member verification
- Recruitment law keywords required
- Field constraints enforced
- Duplicate detection active

### Error Handling in CSV

**Row-by-Row Processing**:
- Each row processed independently
- Errors don't stop the entire process
- Failed rows reported at end

**Common CSV Errors**:
1. **Invalid mkId**: MK doesn't exist or is opposition member
2. **Missing keywords**: Content doesn't include recruitment law keywords
3. **Invalid date**: Not in ISO8601 format
4. **Invalid platform**: Not in allowed enum values
5. **Content too short**: Less than 10 characters
6. **UTF-8 encoding**: Hebrew characters corrupted

**Best Practices**:
- Validate CSV locally before running script
- Start with small batch (10-20 rows) to test
- Review error output and fix issues
- Re-run with corrected CSV

---

## Code Examples

### cURL

**Submit Comment**:
```bash
curl -X POST https://your-domain.com/api/historical-comments \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "mkId": 1,
    "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל",
    "sourceUrl": "https://www.ynet.co.il/news/article/example",
    "sourcePlatform": "News",
    "sourceType": "Primary",
    "commentDate": "2024-01-15T10:00:00Z",
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 8
  }'
```

**Get Comments**:
```bash
curl -X GET "https://your-domain.com/api/historical-comments?mkId=1&limit=20" \
  -H "Authorization: Bearer YOUR-API-KEY"
```

### JavaScript / Node.js

**Using Fetch API**:
```javascript
const API_KEY = process.env.API_KEY;
const API_URL = 'https://your-domain.com/api/historical-comments';

async function submitComment(commentData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.data.isDuplicate) {
      console.log(`Duplicate detected: linked to #${result.data.duplicateOf}`);
    } else {
      console.log(`Comment created: #${result.data.id}`);
    }

    return result.data;
  } catch (error) {
    console.error('Failed to submit comment:', error.message);
    throw error;
  }
}

// Usage
const comment = {
  mkId: 1,
  content: 'חוק הגיוס הוא חוק חשוב למדינת ישראל',
  sourceUrl: 'https://www.ynet.co.il/news/article/example',
  sourcePlatform: 'News',
  sourceType: 'Primary',
  commentDate: new Date().toISOString(),
  sourceName: 'ידיעות אחרונות',
  sourceCredibility: 8,
};

submitComment(comment);
```

**Get Comments with Pagination**:
```javascript
async function getComments(mkId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    verified = null,
    sortBy = 'date',
    order = 'desc',
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    sortBy,
    order,
  });

  if (mkId) params.set('mkId', mkId.toString());
  if (verified !== null) params.set('verified', verified.toString());

  const response = await fetch(`${API_URL}?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

// Usage
const { data } = await getComments(1, { limit: 20, verified: true });
console.log(`Found ${data.pagination.total} comments`);
console.log(`Showing ${data.comments.length} results`);
```

### Python

**Using requests library**:
```python
import requests
import os
from datetime import datetime

API_KEY = os.getenv('API_KEY')
API_URL = 'https://your-domain.com/api/historical-comments'

def submit_comment(comment_data):
    """Submit a historical comment"""
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    }

    response = requests.post(API_URL, headers=headers, json=comment_data)

    if response.status_code == 429:
        # Rate limit exceeded
        retry_after = response.headers.get('Retry-After', 3600)
        print(f'Rate limit exceeded. Retry after {retry_after} seconds.')
        return None

    response.raise_for_status()
    result = response.json()

    if result['data']['isDuplicate']:
        print(f"Duplicate detected: linked to #{result['data']['duplicateOf']}")
    else:
        print(f"Comment created: #{result['data']['id']}")

    return result['data']

# Usage
comment = {
    'mkId': 1,
    'content': 'חוק הגיוס הוא חוק חשוב למדינת ישראל',
    'sourceUrl': 'https://www.ynet.co.il/news/article/example',
    'sourcePlatform': 'News',
    'sourceType': 'Primary',
    'commentDate': datetime.utcnow().isoformat() + 'Z',
    'sourceName': 'ידיעות אחרונות',
    'sourceCredibility': 8,
}

submit_comment(comment)
```

**Get Comments**:
```python
def get_comments(mk_id=None, limit=50, offset=0, verified=None):
    """Retrieve historical comments with filters"""
    headers = {
        'Authorization': f'Bearer {API_KEY}',
    }

    params = {
        'limit': limit,
        'offset': offset,
    }

    if mk_id is not None:
        params['mkId'] = mk_id
    if verified is not None:
        params['verified'] = str(verified).lower()

    response = requests.get(API_URL, headers=headers, params=params)
    response.raise_for_status()

    return response.json()

# Usage
result = get_comments(mk_id=1, limit=20, verified=True)
print(f"Found {result['data']['pagination']['total']} comments")
for comment in result['data']['comments']:
    print(f"- {comment['content'][:50]}...")
```

### Go

**Using net/http**:
```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "time"
)

const apiURL = "https://your-domain.com/api/historical-comments"

type Comment struct {
    MkID             int       `json:"mkId"`
    Content          string    `json:"content"`
    SourceURL        string    `json:"sourceUrl"`
    SourcePlatform   string    `json:"sourcePlatform"`
    SourceType       string    `json:"sourceType"`
    CommentDate      time.Time `json:"commentDate"`
    SourceName       string    `json:"sourceName,omitempty"`
    SourceCredibility int      `json:"sourceCredibility,omitempty"`
}

type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data"`
    Error   string      `json:"error,omitempty"`
}

func submitComment(comment Comment) error {
    apiKey := os.Getenv("API_KEY")

    jsonData, err := json.Marshal(comment)
    if err != nil {
        return err
    }

    req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }

    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return err
    }

    var result APIResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return err
    }

    if !result.Success {
        return fmt.Errorf("API error: %s", result.Error)
    }

    fmt.Println("Comment submitted successfully!")
    return nil
}

func main() {
    comment := Comment{
        MkID:             1,
        Content:          "חוק הגיוס הוא חוק חשוב למדינת ישראל",
        SourceURL:        "https://www.ynet.co.il/news/article/example",
        SourcePlatform:   "News",
        SourceType:       "Primary",
        CommentDate:      time.Now().UTC(),
        SourceName:       "ידיעות אחרונות",
        SourceCredibility: 8,
    }

    if err := submitComment(comment); err != nil {
        fmt.Printf("Error: %v\n", err)
    }
}
```

---

## Best Practices

### 1. API Key Security

**✅ DO**:
- Store API key in environment variables
- Never commit API key to version control
- Use different keys for dev/staging/production
- Rotate keys periodically (every 90 days)
- Use database keys for production (tracking)

**❌ DON'T**:
- Hard-code API key in source code
- Share API key via email or chat
- Use same key across multiple systems
- Log API key in application logs
- Include API key in URLs or query params

### 2. Rate Limiting

**✅ DO**:
- Monitor rate limit headers in responses
- Implement exponential backoff on 429 errors
- Batch requests when possible
- Cache results to reduce API calls
- Use environment key for higher limits (1000/hour)

**❌ DON'T**:
- Ignore rate limit warnings
- Retry immediately after 429 error
- Make unnecessary duplicate requests
- Poll the API continuously

**Example Implementation**:
```javascript
async function submitWithRateLimit(comment) {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify(comment),
      });

      // Check rate limit headers
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
      if (remaining < 10) {
        console.warn('Rate limit low:', remaining, 'requests remaining');
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 3600;
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        retries++;
        continue;
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      retries++;
      await sleep(Math.pow(2, retries) * 1000); // Exponential backoff
    }
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Error Handling

**✅ DO**:
- Handle all HTTP status codes
- Parse error messages for debugging
- Log errors with context
- Implement retry logic for transient errors
- Validate data before sending

**❌ DON'T**:
- Silently swallow errors
- Retry on 400-level errors (client errors)
- Assume API is always available
- Ignore validation errors

**Status Code Guide**:
| Code | Meaning | Action |
|------|---------|--------|
| 201 | Created | Success, process response |
| 200 | OK | Success (GET), process data |
| 400 | Bad Request | Fix validation errors, don't retry |
| 401 | Unauthorized | Check API key, don't retry |
| 404 | Not Found | MK doesn't exist, don't retry |
| 413 | Payload Too Large | Reduce request size |
| 429 | Rate Limit | Wait and retry |
| 500 | Server Error | Retry with backoff |

### 4. Data Quality

**✅ DO**:
- Verify source URLs are accessible
- Include primary sources when available
- Set appropriate credibility scores
- Use correct source types (Primary/Secondary)
- Include descriptive source names
- Validate dates are accurate

**❌ DON'T**:
- Submit broken/invalid URLs
- Mark secondary sources as primary
- Use placeholder/fake data
- Submit duplicates manually
- Ignore recruitment law keyword requirement

### 5. Deduplication Awareness

**✅ DO**:
- Track `isDuplicate` flag in responses
- Log duplicate detection for monitoring
- Accept that duplicates will occur
- Trust the 90-day window logic

**❌ DON'T**:
- Resubmit known duplicates
- Try to bypass duplicate detection
- Expect duplicates older than 90 days to be detected
- Modify content to avoid duplicate detection

### 6. Monitoring and Logging

**✅ DO**:
- Log all API requests (success and failure)
- Track response times
- Monitor rate limit usage
- Alert on repeated failures
- Track duplicate rate (should be <20%)

**❌ DON'T**:
- Log API keys
- Ignore warning signals
- Skip error logging
- Assume everything works

**Example Logging**:
```javascript
const logger = {
  apiRequest: (method, url, status, duration) => {
    console.log({
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration_ms: duration,
      rate_limit_remaining: response.headers.get('X-RateLimit-Remaining'),
    });
  },

  duplicate: (commentId, duplicateOf, similarity) => {
    console.log({
      event: 'duplicate_detected',
      comment_id: commentId,
      duplicate_of: duplicateOf,
      similarity,
    });
  },
};
```

---

## Error Handling

### Error Response Format

All errors return JSON with this structure:

```json
{
  "error": "Error message in Hebrew",
  "details": [ /* optional validation errors */ ],
  "hint": "Helpful suggestion (optional)"
}
```

### Common Errors

#### 400 Bad Request - Validation Error

**Response**:
```json
{
  "error": "שגיאת ולידציה",
  "details": [
    {
      "field": "content",
      "message": "String must contain at least 10 character(s)"
    },
    {
      "field": "sourceUrl",
      "message": "Invalid url"
    }
  ]
}
```

**Solution**: Fix validation errors listed in `details` array.

#### 400 Bad Request - No Recruitment Law Keywords

**Response**:
```json
{
  "error": "התוכן אינו קשור לחוק הגיוס - נא להזין תוכן הכולל מילות מפתח רלוונטיות",
  "hint": "התוכן צריך לכלול לפחות אחת ממילות המפתח: חוק גיוס, גיוס חרדים, recruitment law, draft law"
}
```

**Solution**: Ensure content includes at least one primary keyword.

#### 400 Bad Request - Opposition MK

**Response**:
```json
{
  "error": "חבר הכנסת 'יאיר לפיד' אינו חלק מהקואליציה - מערכת זו מיועדת רק לחברי קואליציה",
  "mkName": "יאיר לפיד",
  "faction": "יש עתיד"
}
```

**Solution**: Only use coalition MK IDs (64 members). Get list from coalition CSV.

#### 401 Unauthorized

**Response**:
```json
{
  "error": "אישור נדרש - מפתח API לא תקין"
}
```

**Solution**:
- Check API key is correct
- Verify `Authorization: Bearer` header format
- Ensure environment variable is loaded
- For production, check Vercel environment variables

#### 404 Not Found - MK Not Found

**Response**:
```json
{
  "error": "חבר כנסת עם מזהה 999 לא נמצא"
}
```

**Solution**: Verify mkId exists in database (1-120). Query `SELECT id FROM MK` to see valid IDs.

#### 413 Payload Too Large

**Response**:
```json
{
  "error": "גודל הבקשה גדול מדי (מקסימום 100KB)"
}
```

**Solution**: Reduce request size. Split large batches into smaller chunks.

#### 429 Rate Limit Exceeded

**Response**:
```json
{
  "error": "חריגה ממגבלת קצב הבקשות",
  "retryAfter": 1705334400
}
```

**Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705334400
Retry-After: 3600
```

**Solution**:
- Wait until `retryAfter` timestamp (Unix time)
- Check `X-RateLimit-Reset` header
- Use environment key for higher limits (1000/hour)
- Implement exponential backoff

#### 500 Internal Server Error

**Response**:
```json
{
  "error": "שגיאה פנימית בשרת - נסה שוב מאוחר יותר"
}
```

**Solution**:
- Retry with exponential backoff
- Check system status
- Contact administrator if persists
- Log error details for debugging

---

## Troubleshooting

### API returns 401 despite correct key

**Check**:
1. API key format: `Authorization: Bearer <key>`
2. No extra spaces or line breaks in key
3. Environment variable loaded (restart dev server)
4. For production: Verify Vercel env variable
5. Database key is active (not disabled)

**Test**:
```bash
# Echo API key to verify
echo $API_KEY

# Test with curl
curl -H "Authorization: Bearer $API_KEY" \
  https://your-domain.com/api/historical-comments
```

### Content validation always fails

**Check**:
1. Content includes at least ONE primary keyword:
   - חוק גיוס / חוק הגיוס
   - גיוס חרדים
   - recruitment law / draft law
2. Content is in Hebrew or English (keyword matching)
3. Content is at least 10 characters
4. Content is not just keywords (needs context)

**Test**:
```bash
# Valid content example
echo "חוק הגיוס הוא חוק חשוב למדינת ישראל" | wc -c
# Should be > 10 characters
```

### Rate limit hits too quickly

**Causes**:
- Using database key (100/hour limit)
- Multiple systems sharing same key
- Retry logic too aggressive
- Polling too frequently

**Solutions**:
1. Switch to environment key (1000/hour)
2. Use separate keys per system
3. Implement proper backoff
4. Batch requests
5. Cache results

**Monitor**:
```bash
# Check rate limit headers
curl -I https://your-domain.com/api/historical-comments \
  -H "Authorization: Bearer $API_KEY"

# Look for:
X-RateLimit-Remaining: 847
```

### Duplicates not detected

**Causes**:
- Comments are >90 days apart
- Similarity <85% (below threshold)
- Different mkId (duplicates are per-MK)
- Exact hash doesn't match (minor differences)

**Debug**:
1. Check commentDate of both comments
2. Calculate time difference (must be <90 days)
3. Manually compare normalized content
4. Verify same mkId

**Note**: 90-day window is by design for performance.

### CSV seeding fails with encoding errors

**Causes**:
- File not UTF-8 encoded
- BOM (Byte Order Mark) issue
- Hebrew characters corrupted

**Solutions**:
```bash
# Convert to UTF-8
iconv -f ISO-8859-8 -t UTF-8 input.csv > output.csv

# Remove BOM if present
sed '1s/^\xEF\xBB\xBF//' < input.csv > output.csv

# Verify encoding
file -I comments.csv
# Should show: text/csv; charset=utf-8
```

### API responses are slow

**Causes**:
- Large pagination limit (>100)
- Complex filters
- Database load
- Network latency

**Solutions**:
1. Reduce limit to 50 or less
2. Use specific filters (mkId, platform)
3. Implement client-side caching
4. Use pagination efficiently
5. Consider database indexes (already optimized)

**Benchmark**:
- Single comment POST: <150ms
- GET with filters: <200ms
- Batch operations: <500ms

### MK ID validation unclear

**Get Coalition MK IDs**:
```bash
# Option 1: Query database
sqlite3 dev.db "SELECT id, nameHe, faction FROM MK WHERE faction IN ('הליכוד', 'התאחדות הספרדים שומרי תורה', 'יהדות התורה', 'הציונות הדתית', 'עוצמה יהודית', 'נעם');"

# Option 2: Use coalition CSV
cat docs/mk-coalition/coalition-members.csv | cut -d, -f1,2,3

# Option 3: GET /api/mks endpoint (if available)
curl https://your-domain.com/api/mks?coalition=true
```

---

## Additional Resources

**Documentation**:
- [Admin User Guide](./ADMIN_USER_GUIDE.md) - Managing comments in admin dashboard
- [Developer Guide](./DEVELOPER_GUIDE.md) - Implementation details and architecture
- [Quick Reference](./QUICK_REFERENCE.md) - Fast lookup of commands and endpoints
- [Testing Documentation](./TESTING.md) - Test suite and quality assurance

**API Reference**:
- [OpenAPI Specification](../api/HISTORICAL_COMMENTS_API.md) - Complete API spec
- [Error Codes Reference](../api/ERROR_CODES.md) - All error codes explained

**Support**:
- GitHub Issues: Report bugs and request features
- Email: support@el-hadegel.co.il
- Documentation Updates: Check for latest version

---

**Last Updated**: 2025-01-18
**API Version**: 1.0
**Author**: EL HADEGEL Development Team

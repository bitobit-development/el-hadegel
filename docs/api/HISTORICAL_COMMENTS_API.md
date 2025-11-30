# Historical Comments REST API Documentation

## Overview

The Historical Comments API allows external systems to submit and retrieve historical comments from coalition Knesset members about the IDF recruitment law. The system includes automatic deduplication, content validation, and coalition membership verification.

## Base URL

```
Production: https://your-domain.com/api/historical-comments
Development: http://localhost:3000/api/historical-comments
```

## Authentication

All endpoints require API key authentication via Bearer token:

```bash
Authorization: Bearer YOUR-API-KEY
```

### Getting an API Key

**Option 1: Environment Variable (Development/Simple Setup)**
Add to `.env`:
```bash
NEWS_API_KEY="your-secure-api-key-here"
```

Generate secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Option 2: Database (Production/Multiple Keys)**
Create API key using admin actions (future admin UI).

## Rate Limits

- **Environment API Keys**: 1000 requests/hour
- **Database API Keys**: 100 requests/hour

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Maximum requests per hour
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Endpoints

### POST /api/historical-comments

Create a new historical comment with automatic deduplication.

#### Request Body

```json
{
  "mkId": 1,
  "content": "חוק הגיוס הוא חוק חשוב למדינת ישראל",
  "sourceUrl": "https://www.ynet.co.il/news/article/example",
  "sourcePlatform": "News",
  "sourceType": "Primary",
  "commentDate": "2024-01-15T10:00:00Z",
  "sourceName": "ידיעות אחרונות",
  "sourceCredibility": 8,
  "keywords": ["חוק גיוס", "גיוס חרדים"],
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "publishedAt": "2024-01-15T10:00:00Z",
  "additionalContext": "Context about the comment"
}
```

#### Required Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `mkId` | number | MK database ID | Must exist and be coalition member |
| `content` | string | Comment text | 10-5000 characters, must include recruitment law keywords |
| `sourceUrl` | string | Source URL | Valid URL, max 2000 chars |
| `sourcePlatform` | enum | Platform type | News, Twitter, Facebook, YouTube, Knesset, Interview, Other |
| `sourceType` | enum | Source classification | Primary, Secondary |
| `commentDate` | string | When comment was made | ISO8601 format |

#### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `sourceName` | string | Source publication name | null |
| `sourceCredibility` | number | Credibility score (1-10) | Platform default |
| `keywords` | string[] | Classification keywords | Auto-detected from content |
| `imageUrl` | string | Image URL | null |
| `videoUrl` | string | Video URL | null |
| `publishedAt` | string | Publication date | Current timestamp |
| `additionalContext` | string | Extra context (max 1000 chars) | null |

#### Success Response (201 Created)

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
    "sourceName": "ידיעות אחרונות",
    "sourceCredibility": 8,
    "commentDate": "2024-01-15T10:00:00.000Z",
    "publishedAt": "2024-01-15T10:00:00.000Z",
    "keywords": ["חוק גיוס", "גיוס חרדים"],
    "imageUrl": "https://example.com/image.jpg",
    "videoUrl": "https://example.com/video.mp4",
    "isDuplicate": false,
    "duplicateOf": null,
    "duplicateGroup": "uuid-here"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "אישור נדרש - מפתח API לא תקין"
}
```

**400 Bad Request - Validation Error**
```json
{
  "error": "שגיאת ולידציה",
  "details": [
    {
      "field": "mkId",
      "message": "Invalid MK ID"
    }
  ]
}
```

**400 Bad Request - Non-Coalition MK**
```json
{
  "error": "חבר הכנסת X אינו חלק מהקואליציה - מערכת זו מיועדת רק לחברי קואליציה",
  "mkName": "Name",
  "faction": "Faction"
}
```

**400 Bad Request - Not Recruitment Law Related**
```json
{
  "error": "התוכן אינו קשור לחוק הגיוס - נא להזין תוכן הכולל מילות מפתח רלוונטיות",
  "hint": "התוכן צריך לכלול לפחות אחת ממילות המפתח: חוק גיוס, גיוס חרדים, recruitment law, וכו׳"
}
```

**404 Not Found**
```json
{
  "error": "חבר כנסת עם מזהה X לא נמצא"
}
```

**429 Too Many Requests**
```json
{
  "error": "חריגה ממגבלת קצב הבקשות",
  "retryAfter": 1234567890
}
```

**413 Payload Too Large**
```json
{
  "error": "גודל הבקשה גדול מדי (מקסימום 100KB)"
}
```

### GET /api/historical-comments

Retrieve historical comments with filters and pagination.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `mkId` | number | Filter by MK ID | All MKs |
| `platform` | string | Filter by platform | All platforms |
| `verified` | boolean | Filter by verification status | All |
| `limit` | number | Results per page (1-100) | 50 |
| `offset` | number | Pagination offset | 0 |
| `sortBy` | enum | Sort field (date, credibility) | date |
| `order` | enum | Sort order (asc, desc) | desc |

#### Example Request

```bash
GET /api/historical-comments?mkId=1&platform=News&limit=20&sortBy=credibility&order=desc
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 123,
        "mkId": 1,
        "content": "חוק הגיוס חשוב...",
        "sourceUrl": "https://example.com",
        "sourcePlatform": "News",
        "sourceType": "Primary",
        "sourceName": "ידיעות אחרונות",
        "sourceCredibility": 8,
        "commentDate": "2024-01-15T10:00:00.000Z",
        "publishedAt": "2024-01-15T10:00:00.000Z",
        "keywords": ["חוק גיוס"],
        "isVerified": true,
        "imageUrl": "https://example.com/image.jpg",
        "videoUrl": null,
        "duplicateOf": null,
        "duplicateGroup": "uuid",
        "mk": {
          "id": 1,
          "name": "Name",
          "faction": "Faction"
        },
        "duplicates": [
          {
            "id": 124,
            "sourceUrl": "https://another-source.com",
            "sourcePlatform": "Twitter",
            "sourceName": null,
            "publishedAt": "2024-01-16T10:00:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## Code Examples

### cURL

**Create Comment:**
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
    "sourceName": "ידיעות אחרונות"
  }'
```

**Get Comments:**
```bash
curl -X GET "https://your-domain.com/api/historical-comments?mkId=1&limit=10" \
  -H "Authorization: Bearer YOUR-API-KEY"
```

### JavaScript/Node.js

```javascript
const API_KEY = process.env.HISTORICAL_COMMENTS_API_KEY;
const BASE_URL = 'https://your-domain.com/api/historical-comments';

// Create comment
async function createComment(commentData) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Get comments
async function getComments(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${BASE_URL}?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Usage
const comment = await createComment({
  mkId: 1,
  content: 'חוק הגיוס הוא חוק חשוב למדינת ישראל',
  sourceUrl: 'https://example.com',
  sourcePlatform: 'News',
  sourceType: 'Primary',
  commentDate: '2024-01-15T10:00:00Z',
});

const comments = await getComments({ mkId: 1, limit: 20 });
```

### Python

```python
import requests
import os
from datetime import datetime

API_KEY = os.getenv('HISTORICAL_COMMENTS_API_KEY')
BASE_URL = 'https://your-domain.com/api/historical-comments'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}

# Create comment
def create_comment(comment_data):
    response = requests.post(BASE_URL, headers=headers, json=comment_data)
    response.raise_for_status()
    return response.json()

# Get comments
def get_comments(filters=None):
    response = requests.get(BASE_URL, headers=headers, params=filters or {})
    response.raise_for_status()
    return response.json()

# Usage
comment = create_comment({
    'mkId': 1,
    'content': 'חוק הגיוס הוא חוק חשוב למדינת ישראל',
    'sourceUrl': 'https://example.com',
    'sourcePlatform': 'News',
    'sourceType': 'Primary',
    'commentDate': datetime.utcnow().isoformat() + 'Z',
})

comments = get_comments({'mkId': 1, 'limit': 20})
```

## CSV Seeding

For bulk import of historical comments, use the CSV seeding script:

### CSV Format

```csv
mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,imageUrl,videoUrl
1,"חוק הגיוס חשוב למדינה","https://example.com/article","News","Primary","2024-01-15T10:00:00Z","ידיעות אחרונות","https://example.com/img.jpg",""
2,"תומך בגיוס חרדים","https://twitter.com/user/status/123","Twitter","Primary","2024-01-16T14:30:00Z","","",""
```

### Running the Seeder

```bash
npx dotenv-cli -e .env -- npx tsx scripts/seed-historical-comments.ts path/to/comments.csv
```

### Example CSV

See `docs/historical-comments/example-comments.csv` for a complete example.

## Security Features

1. **API Key Authentication** - Dual mode (environment variable + database)
2. **Rate Limiting** - Per-key tracking with automatic reset
3. **XSS Prevention** - Content sanitization
4. **Spam Detection** - Keyword patterns and excessive URLs
5. **Input Validation** - Zod schema validation
6. **Content Verification** - Recruitment law keyword requirement
7. **Coalition Verification** - Only coalition MKs accepted
8. **Request Size Limits** - 100KB maximum
9. **URL Validation** - Format and safety checks
10. **Duplicate Detection** - Automatic deduplication with 85% similarity threshold
11. **Audit Logging** - IP address, timestamp, API key tracking
12. **CORS Headers** - Proper cross-origin configuration

## Deduplication Logic

The system automatically detects and links duplicate comments:

1. **Exact Match** - SHA-256 hash comparison
2. **Fuzzy Match** - Levenshtein distance with 85% similarity threshold
3. **Time Window** - Checks last 90 days for duplicates
4. **Duplicate Linking** - Duplicates linked to primary comment via `duplicateOf` and `duplicateGroup`

When a duplicate is detected:
- Comment is still created in database
- `isDuplicate` flag set to `true`
- `duplicateOf` points to primary comment ID
- `duplicateGroup` UUID links all duplicates together

## Content Validation

Comments must include at least one primary recruitment law keyword:

**Primary Keywords:**
- חוק גיוס
- חוק הגיוס
- recruitment law
- draft law
- גיוס חרדים
- haredi draft

**Secondary Keywords:**
- שירות צבאי
- צה״ל
- IDF
- military service

## Source Credibility

Default credibility scores by platform:

| Platform | Score |
|----------|-------|
| Knesset | 10 |
| Interview | 8 |
| News | 7 |
| YouTube | 6 |
| Twitter | 5 |
| Facebook | 4 |
| Other | 5 |

You can override with custom `sourceCredibility` (1-10).

## Troubleshooting

**Issue:** 401 Unauthorized
- Verify API key in Authorization header
- Check environment variable is loaded
- Ensure API key is active in database

**Issue:** Content not recruitment law related
- Add primary keywords: "חוק גיוס", "גיוס חרדים", etc.
- Check content is in Hebrew or English
- Verify keyword matching is case-insensitive

**Issue:** MK not coalition member
- Verify MK's faction is in coalition parties list
- Check MK exists in database
- Review `lib/coalition-utils.ts` for current coalition parties

**Issue:** Rate limit exceeded
- Wait until reset time (check X-RateLimit-Reset header)
- Consider upgrading to environment key (1000/hour)
- Contact admin for higher limits

## Support

For API issues or feature requests, contact the development team.

# EL HADEGEL API Developer Guide

## Overview

The EL HADEGEL Tweet Tracking API allows automated systems to submit social media posts and statements from Israeli Knesset members regarding the IDF recruitment law.

**Base URL**:
- Production: `https://el-hadegel.vercel.app/`
- Development: `http://localhost:3000`

**API Version**: 1.0.0

## Authentication

All API requests require authentication using an API key.

### Getting an API Key

Contact **admin@el-hadegel.com** to request an API key for your integration. Include the following in your request:
- Your name/organization
- Use case description
- Expected request volume

### Using Your API Key

Include your API key in the `Authorization` header of every request using Bearer token format:

```http
Authorization: Bearer your-api-key-here
```

**Example cURL request**:
```bash
curl -X GET https://www.elhadegel.co.il/api/tweets \
  -H "Authorization: Bearer your-api-key-here"
```

### Security Best Practices

1. **Never commit API keys to version control** - Use environment variables
2. **Never share API keys publicly** - Keep them secure
3. **Rotate keys periodically** - Contact admin to request new keys
4. **Use HTTPS in production** - Always use the secure protocol

**Example .env file**:
```bash
EL_HADEGEL_API_KEY=your-api-key-here
EL_HADEGEL_API_URL=https://www.elhadegel.co.il
```

## Rate Limiting

To ensure fair usage and system stability, the API enforces rate limits:

- **Limit**: 100 requests per hour per API key
- **Window**: Rolling 1-hour window
- **Scope**: Per API key (not per IP address)

### Rate Limit Headers

All API responses include the following headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests per hour | `100` |
| `X-RateLimit-Remaining` | Remaining requests in current window | `95` |
| `X-RateLimit-Reset` | Unix timestamp (ms) when limit resets | `1640000000000` |

### Handling Rate Limits

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later.",
  "resetAt": "2024-01-15T12:00:00.000Z"
}
```

**Best practices**:
1. Track the `X-RateLimit-Remaining` header
2. Implement exponential backoff when approaching limits
3. Cache responses when possible
4. Wait until `resetAt` before retrying

**Example rate limit handling** (pseudo-code):
```python
if response.status_code == 429:
    reset_time = parse_datetime(response.json()['resetAt'])
    wait_seconds = (reset_time - now()).total_seconds()
    sleep(wait_seconds)
    retry_request()
```

## API Endpoints

### POST /api/tweets

Submit a new tweet or statement from a Knesset member.

**Request**:
```http
POST /api/tweets
Authorization: Bearer your-api-key-here
Content-Type: application/json

{
  "mkId": 1,
  "content": "אני תומך בחוק הגיוס השוויוני. כל אזרח חייב לשרת את המדינה.",
  "sourceUrl": "https://twitter.com/example/status/123456",
  "sourcePlatform": "Twitter",
  "postedAt": "2024-01-15T10:30:00Z"
}
```

**Request Fields**:

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `mkId` | number | Yes | Knesset member ID | 1-120 |
| `content` | string | Yes | Tweet/statement content | 1-5000 characters |
| `sourceUrl` | string | No | URL to original post | Valid URL |
| `sourcePlatform` | string | Yes | Platform name | See platforms below |
| `postedAt` | string | Yes | When posted | ISO 8601 datetime |

**Valid Platforms**:
- `Twitter`
- `Facebook`
- `Instagram`
- `News`
- `Knesset Website`
- `Other`

**Success Response** (201 Created):
```json
{
  "success": true,
  "tweet": {
    "id": 42,
    "mkId": 1,
    "mkName": "אבי דיכטר",
    "content": "אני תומך בחוק הגיוס השוויוני. כל אזרח חייב לשרת את המדינה.",
    "sourceUrl": "https://twitter.com/example/status/123456",
    "sourcePlatform": "Twitter",
    "postedAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid request data | Validation failed - check `details` field |
| 401 | Invalid API key | Authentication failed |
| 404 | MK not found | Invalid `mkId` |
| 429 | Rate limit exceeded | Too many requests |
| 500 | Internal server error | Server error - retry later |

**Validation Error Example** (400):
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["content"],
      "message": "String must contain at most 5000 character(s)"
    }
  ]
}
```

### GET /api/tweets

Retrieve tweets with optional filtering and pagination.

**Request**:
```http
GET /api/tweets?mkId=1&limit=20&offset=0
Authorization: Bearer your-api-key-here
```

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `mkId` | number | No | - | Filter by MK ID (1-120) |
| `limit` | number | No | 50 | Max results per request (1-100) |
| `offset` | number | No | 0 | Skip N results (for pagination) |

**Success Response** (200 OK):
```json
{
  "success": true,
  "tweets": [
    {
      "id": 42,
      "mkId": 1,
      "mkName": "אבי דיכטר",
      "content": "אני תומך בחוק הגיוס השוויוני.",
      "sourceUrl": "https://twitter.com/example/status/123456",
      "sourcePlatform": "Twitter",
      "postedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Pagination**:
- Tweets are returned in reverse chronological order (newest first)
- Use `offset` to skip results: `offset = page_number * limit`
- Check `hasMore` to determine if more results exist

**Pagination Example**:
```bash
# Page 1 (tweets 1-20)
GET /api/tweets?limit=20&offset=0

# Page 2 (tweets 21-40)
GET /api/tweets?limit=20&offset=20

# Page 3 (tweets 41-60)
GET /api/tweets?limit=20&offset=40
```

## MK IDs and Data

The system tracks 120 Israeli Knesset members with IDs from 1 to 120.

### Getting MK Information

You can retrieve the complete list of MKs and their IDs from the public homepage:

```bash
# View the public website
https://www.elhadegel.co.il

# Or query the public MKs endpoint (no auth required)
curl https://www.elhadegel.co.il/api/mks
```

### MK ID Reference

Each MK has a unique ID corresponding to their position in the Knesset member database. Always verify the MK ID before submitting tweets.

**Example MK IDs** (for reference):
- ID 1: אבי דיכטר
- ID 5: בצלאל סמוטריץ'
- ID 12: משה גפני

*For the complete list, visit the public website.*

## Data Formats

### Date/Time Format

All dates must use ISO 8601 format with UTC timezone:

**Valid formats**:
```
2024-01-15T10:30:00Z          # UTC with Z suffix
2024-01-15T10:30:00.000Z      # UTC with milliseconds
2024-01-15T13:30:00+03:00     # Israel time (UTC+3)
```

**Converting to ISO 8601**:

```python
# Python
from datetime import datetime, timezone
dt = datetime.now(timezone.utc)
iso_string = dt.isoformat()  # "2024-01-15T10:30:00+00:00"
```

```javascript
// JavaScript
const isoString = new Date().toISOString();  // "2024-01-15T10:30:00.000Z"
```

### Content Encoding

- **Encoding**: UTF-8
- **Content-Type**: `application/json`
- **Hebrew Support**: Full RTL Hebrew text supported in `content` field
- **Max Length**: 5000 characters (approximately 5000 Hebrew characters)

### URL Validation

The `sourceUrl` field must be a valid HTTP/HTTPS URL:

**Valid URLs**:
```
https://twitter.com/user/status/123456
https://www.facebook.com/post/123
https://www.ynet.co.il/article/abc123
```

**Invalid URLs**:
```
not-a-url
twitter.com/status/123  (missing protocol)
ftp://example.com       (invalid protocol)
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Request successful |
| 201 | Created | Tweet created successfully |
| 400 | Bad Request | Fix request data (check `details`) |
| 401 | Unauthorized | Check API key |
| 404 | Not Found | Invalid MK ID |
| 429 | Too Many Requests | Wait until `resetAt` |
| 500 | Server Error | Retry with exponential backoff |

### Validation Errors (400)

When validation fails, the response includes a `details` array:

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["mkId"],
      "message": "Expected number, received string"
    },
    {
      "path": ["content"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

**Common validation errors**:
- Invalid `mkId` type (must be number)
- `content` too long (max 5000 chars)
- Invalid `postedAt` format (must be ISO 8601)
- Invalid `sourcePlatform` (must be one of allowed values)
- Invalid `sourceUrl` format (must be valid URL)

### Error Handling Best Practices

1. **Check `success` field**: All responses include `success: true/false`
2. **Parse `error` message**: Human-readable error description
3. **Check `details` for validation errors**: Shows which fields failed
4. **Implement retries for 5xx errors**: Server errors may be transient
5. **Don't retry 4xx errors**: Client errors require fixing the request
6. **Handle 429 specially**: Wait until `resetAt` before retrying

**Example error handler** (Python):
```python
def handle_api_error(response):
    if response.status_code == 400:
        # Validation error - log and fix request
        details = response.json().get('details', [])
        for error in details:
            print(f"Field {error['path']}: {error['message']}")
        raise ValueError("Invalid request data")

    elif response.status_code == 401:
        # Auth error - check API key
        raise AuthenticationError("Invalid API key")

    elif response.status_code == 404:
        # Not found - invalid MK ID
        raise ValueError("MK not found")

    elif response.status_code == 429:
        # Rate limit - wait and retry
        reset_at = response.json()['resetAt']
        raise RateLimitError(f"Rate limit exceeded. Reset at {reset_at}")

    elif response.status_code >= 500:
        # Server error - retry with backoff
        raise ServerError("Server error - retry later")
```

## Best Practices

### 1. Cache MK Data

Fetch the MK list once and cache it locally to reduce API calls:

```python
# Fetch once at startup
mks = fetch_mk_list()  # From public API or website
mk_cache = {mk['id']: mk for mk in mks}

# Validate before API call
def validate_mk_id(mk_id):
    if mk_id not in mk_cache:
        raise ValueError(f"Invalid MK ID: {mk_id}")
```

### 2. Validate Before Sending

Validate data locally before making API calls:

```python
def validate_tweet(data):
    # Check required fields
    assert 'mkId' in data
    assert 'content' in data
    assert 'sourcePlatform' in data
    assert 'postedAt' in data

    # Check types
    assert isinstance(data['mkId'], int)
    assert isinstance(data['content'], str)

    # Check constraints
    assert 1 <= data['mkId'] <= 120
    assert 1 <= len(data['content']) <= 5000
    assert data['sourcePlatform'] in VALID_PLATFORMS

    # Validate ISO 8601 date
    datetime.fromisoformat(data['postedAt'].replace('Z', '+00:00'))
```

### 3. Track Rate Limits

Monitor your remaining requests and pause when approaching limits:

```python
class RateLimitTracker:
    def __init__(self):
        self.remaining = 100
        self.reset_at = None

    def update_from_response(self, response):
        self.remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
        self.reset_at = int(response.headers.get('X-RateLimit-Reset', 0))

    def should_wait(self):
        # Pause if less than 10 requests remaining
        return self.remaining < 10
```

### 4. Implement Retries

Use exponential backoff for transient errors:

```python
import time

def make_request_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except ServerError:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt  # 1s, 2s, 4s
            time.sleep(wait_time)
```

### 5. Batch Operations

Group related operations to reduce API calls:

```python
# Good: Batch multiple tweets
tweets = [
    create_tweet_payload(mk_id=1, content="..."),
    create_tweet_payload(mk_id=2, content="..."),
    create_tweet_payload(mk_id=3, content="..."),
]

for tweet in tweets:
    # Track rate limits between requests
    if rate_limiter.should_wait():
        time.sleep(60)

    submit_tweet(tweet)
```

### 6. Store Source URLs

Always include `sourceUrl` when available for transparency and verification:

```python
# Good
{
    "mkId": 1,
    "content": "...",
    "sourceUrl": "https://twitter.com/user/status/123",
    "sourcePlatform": "Twitter",
    "postedAt": "..."
}

# Less ideal (missing sourceUrl)
{
    "mkId": 1,
    "content": "...",
    "sourcePlatform": "Twitter",
    "postedAt": "..."
}
```

### 7. Use Environment Variables

Store configuration in environment variables:

```bash
# .env file
EL_HADEGEL_API_KEY=your-api-key-here
EL_HADEGEL_API_URL=https://www.elhadegel.co.il
EL_HADEGEL_RATE_LIMIT=100
```

```python
import os

API_KEY = os.getenv('EL_HADEGEL_API_KEY')
API_URL = os.getenv('EL_HADEGEL_API_URL', 'https://www.elhadegel.co.il')
```

## Integration Checklist

Before deploying your integration:

- [ ] API key obtained and stored securely
- [ ] MK list cached locally
- [ ] Input validation implemented
- [ ] Rate limit tracking implemented
- [ ] Error handling for all status codes
- [ ] Retry logic for server errors
- [ ] ISO 8601 date formatting
- [ ] UTF-8 encoding for Hebrew text
- [ ] Source URLs included when available
- [ ] Logging for debugging
- [ ] Monitoring for rate limits
- [ ] Testing in development environment

## Support

For API support, questions, or to report issues:

**Email**: admin@el-hadegel.com

**Include in your request**:
- API key name/ID
- Request timestamp
- Request/response details
- Error messages

## Additional Resources

- [OpenAPI Specification](./openapi.yaml) - Complete API specification in OpenAPI 3.0 format
- [Code Examples](./CODE_EXAMPLES.md) - Integration examples in Python, Node.js, and cURL
- [Project Website](https://www.elhadegel.co.il) - View MKs and their positions

---

*Last updated: January 2024*

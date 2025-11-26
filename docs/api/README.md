# EL HADEGEL API Documentation

Complete API documentation for the Tweet Tracking System.

## Documentation Files

This directory contains comprehensive documentation for developers and AI agents integrating with the EL HADEGEL Tweet Tracking API.

### 📄 [openapi.yaml](./openapi.yaml)

**OpenAPI 3.0 Specification** - Machine-readable API specification

- Complete endpoint definitions (POST /api/tweets, GET /api/tweets)
- Request/response schemas with validation rules
- Authentication requirements (Bearer token)
- Error response examples for all status codes
- Rate limiting specifications
- Hebrew content examples

**Use cases:**
- Generate client libraries with OpenAPI generators
- Import into API testing tools (Postman, Insomnia)
- Automated API documentation rendering
- Contract testing and validation

**View online:** Import into [Swagger Editor](https://editor.swagger.io/) to visualize

### 📘 [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

**Developer Guide** - Human-readable comprehensive guide (571 lines)

**Contents:**
- Authentication setup and best practices
- Rate limiting details and handling strategies
- Complete endpoint documentation with examples
- MK ID reference and data formats
- Error handling patterns
- Best practices for integration
- Integration checklist

**Target audience:** Developers building integrations

### 💻 [CODE_EXAMPLES.md](./CODE_EXAMPLES.md)

**Code Examples** - Complete integration examples (1,318 lines)

**Languages covered:**
- **cURL** - Command-line examples for testing
- **Python** - Complete client class with error handling and retries
- **Node.js/TypeScript** - Typed client with interceptors
- **Go** - Full client implementation

**Features:**
- Production-ready client implementations
- Rate limit tracking
- Error handling with retries
- Pagination helpers
- Batch operations
- Environment variable configuration

**Target audience:** Developers implementing API clients

## Quick Start

### For Developers

1. **Read the Developer Guide** to understand authentication and endpoints
2. **Copy the code example** for your language
3. **Set your API key** in environment variables
4. **Test the integration** in development first

### For AI Agents

1. **Parse the OpenAPI spec** for endpoint definitions
2. **Follow the validation rules** in the schema
3. **Implement rate limit tracking** (100 req/hour)
4. **Handle all error codes** (400, 401, 404, 429, 500)

### For API Testing

1. **Import openapi.yaml** into Postman/Insomnia
2. **Configure authentication** with your API key
3. **Test endpoints** using the provided examples

## API Overview

**Base URL:** `https://www.elhadegel.co.il`

**Authentication:** Bearer token in Authorization header

**Rate Limit:** 100 requests per hour per API key

**Endpoints:**
- `POST /api/tweets` - Submit a tweet/statement
- `GET /api/tweets` - Retrieve tweets with filtering

## Getting an API Key

Contact **admin@el-hadegel.com** with:
- Your name/organization
- Use case description
- Expected request volume

## File Sizes

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| openapi.yaml | 487 | 15 KB | OpenAPI 3.0 spec |
| DEVELOPER_GUIDE.md | 571 | 14 KB | Developer docs |
| CODE_EXAMPLES.md | 1,318 | 35 KB | Code examples |
| **Total** | **2,376** | **64 KB** | Complete docs |

## Features Documented

### Endpoints
- ✅ POST /api/tweets - Tweet submission
- ✅ GET /api/tweets - Tweet retrieval with pagination

### Authentication
- ✅ API key setup and security
- ✅ Bearer token format
- ✅ Error handling for invalid keys

### Rate Limiting
- ✅ 100 requests per hour limit
- ✅ Rate limit headers
- ✅ 429 error handling
- ✅ Retry strategies

### Validation
- ✅ MK ID validation (1-120)
- ✅ Content length limits (1-5000 chars)
- ✅ Platform enum validation
- ✅ ISO 8601 date format
- ✅ URL validation

### Error Handling
- ✅ All HTTP status codes documented
- ✅ Validation error details
- ✅ Retry patterns
- ✅ Error response schemas

### Data Formats
- ✅ ISO 8601 datetime format
- ✅ UTF-8 Hebrew text support
- ✅ Pagination parameters
- ✅ Optional source URLs

### Code Examples
- ✅ Python client with retries
- ✅ TypeScript client with types
- ✅ Go client implementation
- ✅ cURL commands
- ✅ Error handling patterns
- ✅ Pagination examples

## Integration Examples

### Python
```python
from elhadegel import ElHadegelClient

client = ElHadegelClient(api_key="your-key")
result = client.create_tweet(
    mk_id=1,
    content="אני תומך בחוק הגיוס השוויוני.",
    source_platform="Twitter",
    posted_at=datetime.now(timezone.utc)
)
```

### TypeScript
```typescript
import { ElHadegelClient } from './elhadegel';

const client = new ElHadegelClient('your-key');
const result = await client.createTweet({
  mkId: 1,
  content: 'אני תומך בחוק הגיוס השוויוני.',
  sourcePlatform: 'Twitter',
  postedAt: new Date(),
});
```

### cURL
```bash
curl -X POST https://www.elhadegel.co.il/api/tweets \
  -H "Authorization: Bearer your-key" \
  -H "Content-Type: application/json" \
  -d '{"mkId":1,"content":"...","sourcePlatform":"Twitter","postedAt":"2024-01-15T10:30:00Z"}'
```

## Validation Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| mkId | number | Yes | 1-120 |
| content | string | Yes | 1-5000 chars |
| sourceUrl | string | No | Valid URL |
| sourcePlatform | enum | Yes | Twitter, Facebook, Instagram, News, Knesset Website, Other |
| postedAt | string | Yes | ISO 8601 datetime |

## Support

**Email:** admin@el-hadegel.com

**Website:** https://www.elhadegel.co.il

---

*Documentation generated for Stage 5 of the Social Media Tracking System*

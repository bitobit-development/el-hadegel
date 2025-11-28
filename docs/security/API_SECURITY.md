# API Security Documentation

## Overview
The News Posts API implements comprehensive security measures to protect against common web vulnerabilities and attacks. This document outlines all security controls and best practices.

## Security Layers

### 1. Authentication & Authorization

**API Key Authentication**:
- Bearer token format: `Authorization: Bearer <api-key>`
- bcrypt-hashed keys stored in database (cost factor: 10)
- API keys can be enabled/disabled by admins
- `lastUsedAt` timestamp tracked for auditing

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/api-auth.ts`
- Function: `verifyApiKey(request)`

### 2. Rate Limiting

**Limits**:
- 100 requests per hour per API key
- In-memory tracking with automatic cleanup
- Headers provided: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- `Retry-After` header on 429 responses

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/rate-limit.ts`
- Function: `checkRateLimit(apiKeyId)`

**Response** (when limit exceeded):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 1737028800000
}
```
HTTP Status: 429 Too Many Requests

### 3. SSRF (Server-Side Request Forgery) Protection

**Blocked URLs**:
- ❌ localhost and 127.0.0.1
- ❌ IPv6 localhost (::1)
- ❌ Private IP ranges:
  - 10.0.0.0/8 (Class A)
  - 172.16.0.0/12 (Class B)
  - 192.168.0.0/16 (Class C)
  - 169.254.0.0/16 (Link-local)
- ❌ Cloud metadata services:
  - 169.254.169.254 (AWS/Azure)
  - metadata.google.internal (GCP)
- ❌ file:// protocol
- ❌ URLs with embedded credentials (user:pass@...)

**Allowed**:
- ✅ http:// and https:// protocols only
- ✅ Public internet URLs

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/og-scraper.ts`
- Function: `isValidExternalUrl(url)`

**Response** (when blocked):
```json
{
  "error": "Invalid or unsafe URL (SSRF protection)"
}
```
HTTP Status: 400 Bad Request

### 4. XSS (Cross-Site Scripting) Prevention

**Sanitization Applied**:
- ✅ HTML tags removed
- ✅ Script tags and content removed
- ✅ Event handlers removed (onclick, onload, etc.)
- ✅ javascript: protocols removed
- ✅ Whitespace trimmed

**Examples**:
```javascript
Input:  '<script>alert("XSS")</script>Hello'
Output: 'Hello'

Input:  '<img src=x onerror="alert(1)">Content'
Output: 'Content'

Input:  '<div onclick="evil()">Text</div>'
Output: 'Text'
```

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/security-utils.ts`
- Function: `sanitizeContent(content)`

**Applied To**:
- User-provided content
- Open Graph metadata (title, description, siteName)

### 5. Spam Detection

**Spam Patterns Detected**:
- ❌ Keywords: viagra, casino, "buy now", "click here", "limited offer"
- ❌ Excessive dollar signs ($$$)
- ❌ Very long URLs (>100 characters)
- ❌ More than 3 URLs in content

**Response** (when detected):
```json
{
  "error": "Content flagged as spam"
}
```
HTTP Status: 400 Bad Request

**Logging**:
- Suspicious activity logged with API key ID and IP address
- Helps identify abusive API keys

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/security-utils.ts`
- Functions: `isSpam(content)`, `hasExcessiveUrls(content)`

### 6. Duplicate Detection

**Rule**:
- Same URL cannot be submitted more than once within 24 hours

**Check**:
- Query database for existing posts with same URL
- Time window: Last 24 hours (configurable)

**Response** (when duplicate):
```json
{
  "error": "Duplicate post - this URL was already submitted recently",
  "existingPostId": 123
}
```
HTTP Status: 409 Conflict

**Implementation**:
- Database query with `createdAt` filter
- Happens before Open Graph scraping (saves resources)

### 7. Request Size Limits

**Limit**: 100KB per request

**Purpose**:
- Prevent DoS attacks via large payloads
- Protect server memory and bandwidth

**Response** (when exceeded):
```json
{
  "error": "Request body too large (max 100KB)"
}
```
HTTP Status: 413 Payload Too Large

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/security-utils.ts`
- Function: `isValidRequestSize(bodyString)`

### 8. Image URL Validation

**Validation Rules**:
- ✅ Must use http:// or https://
- ✅ Must have valid image extension (.jpg, .jpeg, .png, .gif, .webp, .svg)
- ✅ OR must be from known image CDN (Cloudinary, Imgur, Unsplash, etc.)

**Behavior**:
- Invalid image URLs are rejected silently (post still created, image omitted)
- Prevents malicious file types or non-image URLs

**Implementation**:
- File: `/Users/haim/Projects/el-hadegel/lib/security-utils.ts`
- Function: `isValidImageUrl(url)`

### 9. Input Validation

**Zod Schema Validation**:
```typescript
{
  content: string (10-2000 characters),
  sourceUrl: string (valid URL, max 500 characters),
  sourceName: string (optional),
  postedAt: datetime (optional, ISO 8601 format)
}
```

**Additional Checks**:
- Content length after sanitization (must be ≥10 characters)
- URL format validation
- JSON syntax validation

**Errors Returned**:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["content"],
      "message": "Content too short"
    }
  ]
}
```
HTTP Status: 400 Bad Request

### 10. CORS (Cross-Origin Resource Sharing)

**Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400 (24 hours)
```

**Preflight Support**:
- OPTIONS method handler returns 204 No Content
- Browsers can cache preflight for 24 hours

**Implementation**:
- OPTIONS endpoint in API route
- Headers added to error responses

### 11. Audit Logging

**Logged Events**:
- ✅ Successful post creation (post ID, API key ID, IP, timestamp)
- ⚠️ Spam detection (API key ID, IP)
- ⚠️ OG scraping failures (URL, error)

**Log Format**:
```javascript
{
  id: 123,
  apiKeyId: 1,
  ip: "203.0.113.42",
  timestamp: "2025-01-15T10:30:00.000Z"
}
```

**Purpose**:
- Security monitoring
- Abuse detection
- Debugging

### 12. Error Handling

**Safe Error Messages**:
- Generic errors for internal failures
- Specific errors for validation/input issues
- Never expose stack traces or database details

**Error Response Format**:
```json
{
  "error": "Error message",
  "details": [] // Optional, only for validation errors
}
```

**Status Codes**:
- 200 OK - Successful GET
- 201 Created - Successful POST
- 204 No Content - Successful OPTIONS
- 400 Bad Request - Validation/input error
- 401 Unauthorized - Invalid/missing API key
- 409 Conflict - Duplicate post
- 413 Payload Too Large - Request size limit
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - Server error

## Security Testing

**Test Suite**: `/Users/haim/Projects/el-hadegel/scripts/test-news-security.ts`

**Run Tests**:
```bash
npx tsx scripts/test-news-security.ts
```

**Coverage**:
- ✅ XSS prevention (script tags, event handlers)
- ✅ SSRF prevention (localhost, private IPs, cloud metadata, credentials)
- ✅ Duplicate detection
- ✅ Spam detection (keywords, excessive URLs)
- ✅ Request size limits
- ✅ Input validation (JSON, required fields, formats)
- ✅ Authentication (invalid key, missing key)
- ✅ CORS headers
- ✅ Valid requests

**Latest Test Results**:
```
Total Tests: 18
Passed: 18 (100.0%)
Failed: 0

✨ All security tests passed! API is secure.
```

## Security Best Practices

### For API Consumers

1. **Store API Keys Securely**:
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys periodically

2. **Handle Rate Limits**:
   - Check `X-RateLimit-Remaining` header
   - Implement exponential backoff for 429 responses
   - Respect `Retry-After` header

3. **Validate Input**:
   - Ensure URLs are valid before submitting
   - Keep content between 10-2000 characters
   - Use ISO 8601 format for timestamps

4. **Monitor Usage**:
   - Log successful submissions
   - Track failed requests
   - Watch for suspicious patterns

### For Administrators

1. **API Key Management**:
   - Create descriptive key names
   - Disable unused keys
   - Monitor `lastUsedAt` timestamps
   - Review audit logs regularly

2. **Security Monitoring**:
   - Check logs for spam attempts
   - Monitor rate limit usage
   - Review duplicate submissions
   - Watch for SSRF attempts

3. **Database Maintenance**:
   - Clean up old duplicate records periodically
   - Archive old posts if needed
   - Monitor database size

## Threat Model

### Covered Threats

| Threat | Mitigation | Status |
|--------|------------|--------|
| XSS Injection | Content sanitization | ✅ Protected |
| SSRF Attacks | URL validation | ✅ Protected |
| SQL Injection | Prisma ORM | ✅ Protected |
| DoS via Large Requests | Request size limit | ✅ Protected |
| Spam/Abuse | Spam detection + rate limiting | ✅ Protected |
| Duplicate Submissions | 24-hour duplicate check | ✅ Protected |
| Unauthorized Access | API key authentication | ✅ Protected |
| Brute Force | Rate limiting | ✅ Protected |
| CORS Issues | Proper headers | ✅ Protected |

### Future Enhancements

1. **IP-based Rate Limiting** (backup for API key)
2. **Machine Learning Spam Detection**
3. **Honeypot Fields** (bot detection)
4. **Content Moderation API** (automated filtering)
5. **Geo-blocking** (if needed)
6. **Request Signing** (HMAC-based)
7. **Two-Factor Authentication** for API key creation

## Incident Response

### If Abuse Detected

1. **Disable API Key**:
   ```sql
   UPDATE api_keys SET is_active = 0 WHERE id = <key_id>;
   ```

2. **Review Logs**:
   - Check all submissions from that key
   - Identify spam posts
   - Look for patterns

3. **Clean Up**:
   - Delete spam posts if needed
   - Block IP address if necessary

4. **Report**:
   - Document the incident
   - Update security measures if needed

## Compliance

### Data Protection

- No PII (Personally Identifiable Information) stored
- IP addresses logged for security only (not displayed publicly)
- API keys hashed with bcrypt (irreversible)

### GDPR Considerations

- Right to deletion: Admins can delete posts
- Data minimization: Only essential data stored
- Purpose limitation: Data used only for news posts

## Contact

For security issues or questions:
- Review documentation: `docs/security/`
- Check API docs: `docs/api/NEWS_API.md`
- Report vulnerabilities responsibly (do not exploit)

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Security Level**: Production-Ready ✅

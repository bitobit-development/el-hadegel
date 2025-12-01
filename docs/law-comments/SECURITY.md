# Security - Law Commenting System

## Overview

The Law Commenting System implements 13 layers of security to protect against common web vulnerabilities and abuse. This document details each security measure and implementation.

---

## Security Layers

### 1. Input Validation (Zod Schemas)

**Implementation**: `/lib/validation/law-comment-validation.ts`

All user input validated with Zod schemas before processing.

**Comment Submission Validation**:
```typescript
commentSubmissionSchema:
  ✓ paragraphId: Positive integer
  ✓ firstName: 2-100 chars, Hebrew/English only
  ✓ lastName: 2-100 chars, Hebrew/English only
  ✓ email: Valid RFC 5322 format
  ✓ phoneNumber: Israeli format regex
  ✓ commentContent: 10-5000 chars
  ✓ suggestedEdit: Optional, max 5000 chars
```

**Name Validation Regex**:
```typescript
const NAME_REGEX = /^[\u0590-\u05FFa-zA-Z\s'-]+$/;
// Allows: Hebrew (U+0590-U+05FF), English, spaces, hyphens, apostrophes
// Blocks: Numbers, special chars, emojis, SQL injection attempts
```

**Phone Validation Regex**:
```typescript
const ISRAELI_PHONE_REGEX = /^(\+972|0)?[1-9]\d{1,2}-?\d{7}$/;
// Accepts: 050-1234567, 0501234567, +972-50-1234567, +972501234567
// Blocks: Invalid formats, non-Israeli prefixes
```

**Bypass Attempt Example**:
```javascript
// ❌ Blocked by Zod validation
{
  firstName: "<script>alert(1)</script>", // Fails regex
  email: "not-an-email",                  // Fails email validation
  phoneNumber: "123",                     // Fails Israeli phone regex
  commentContent: "Too short"             // Fails min length
}
```

---

### 2. XSS Prevention (Content Sanitization)

**Implementation**: `/lib/security/law-comment-security.ts`

**Function**: `sanitizeCommentContent(content: string)`

Removes dangerous HTML/JavaScript from user input:

```typescript
✓ Removes all HTML tags: <div>, <script>, <iframe>
✓ Removes event handlers: onclick, onerror, onload
✓ Removes dangerous protocols: javascript:, data:text/html
✓ Removes style attributes
✓ Normalizes whitespace
✓ Preserves intentional line breaks
```

**Example**:
```typescript
// Input
const malicious = `
  <script>alert('XSS')</script>
  <img src=x onerror="alert(1)">
  <a href="javascript:void(0)">Click</a>
  תגובה תקינה
`;

// Output after sanitization
const safe = `תגובה תקינה`;
```

**Protection Against**:
- Stored XSS
- Reflected XSS
- DOM-based XSS
- HTML injection
- Script injection

---

### 3. SQL Injection Prevention (Prisma ORM)

**Implementation**: All database queries use Prisma ORM

Prisma uses parameterized queries automatically:

```typescript
// ✅ Safe - Prisma parameterizes
await prisma.lawComment.findMany({
  where: {
    email: userInput, // Automatically escaped
  },
});

// ❌ Dangerous (we don't do this) - Raw SQL
await prisma.$executeRaw`SELECT * FROM LawComment WHERE email = '${userInput}'`;
```

**Protection Against**:
- SQL injection
- Query manipulation
- Database schema exposure

---

### 4. Spam Detection

**Implementation**: `/lib/security/law-comment-security.ts`

**Function**: `detectSpamComment(data)`

**Checks**:

1. **Keyword Detection** (48 spam keywords):
   ```typescript
   English: viagra, casino, poker, free money, click here, etc.
   Hebrew: קזינו, הימורים, כסף חינם, לחץ כאן, etc.
   ```

2. **Excessive URLs** (>2 URLs = spam):
   ```typescript
   // ❌ Blocked
   "Check out https://spam1.com and https://spam2.com and https://spam3.com"
   ```

3. **Repetitive Content** (same word 10+ times):
   ```typescript
   // ❌ Blocked
   "spam spam spam spam spam spam spam spam spam spam spam"
   ```

4. **ALL CAPS** (>50% uppercase):
   ```typescript
   // ❌ Blocked
   "THIS IS YELLING AND PROBABLY SPAM!!!"
   ```

5. **Phone Number Spam** (>2 phone numbers):
   ```typescript
   // ❌ Blocked
   "Call 050-1111111 or 050-2222222 or 050-3333333"
   ```

6. **Email Spam** (>1 email besides submitter's):
   ```typescript
   // ❌ Blocked
   "Contact spam1@test.com or spam2@test.com"
   ```

**Response**:
```json
{
  "success": false,
  "error": "התגובה נחסמה. אנא ודא שהתוכן ראוי ולא מכיל ספאם."
}
```

---

### 5. Duplicate Detection

**Implementation**: `/lib/security/law-comment-security.ts`

**Function**: `isDuplicateComment(email, paragraphId, content)`

Prevents resubmission of similar comments within 24 hours.

**Algorithm**:
1. Find recent comments from same email for same paragraph (24-hour window)
2. Normalize both contents (lowercase, remove punctuation)
3. Calculate Jaccard similarity (intersection/union of words)
4. Threshold: 90% similarity = duplicate

**Example**:
```typescript
// Existing comment (submitted 10 hours ago)
"אני תומך בחוק זה מכיוון שהוא הוגן ושוויוני."

// New submission (90%+ similar)
"אני תומך בחוק זה מכיוון שהוא הוגן ומשוויון." // ❌ Blocked as duplicate

// New submission (different enough)
"אני מתנגד לחוק זה." // ✅ Allowed
```

**Response**:
```json
{
  "success": false,
  "error": "שלחת תגובה דומה לאחרונה. נסה שוב מאוחר יותר או כתוב תגובה שונה."
}
```

---

### 6. Rate Limiting

**Implementation**: `/lib/rate-limit-law-comments.ts`

**Dual Rate Limiting**:

1. **IP-based**: 5 comments per hour per IP address
2. **Email-based**: 10 comments per hour per email address

**Data Structure**:
```typescript
interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

// In-memory Maps
ipRequests: Map<string, RateLimitEntry>
emailRequests: Map<string, RateLimitEntry>
```

**Flow**:
```typescript
1. Extract IP from headers (x-forwarded-for, x-real-ip, cf-connecting-ip)
2. Check IP limit (5/hour)
3. Check email limit (10/hour)
4. If both pass → allow and record request
5. If either fails → return error with reset time
```

**Example Response**:
```json
{
  "success": false,
  "error": "חרגת ממספר התגובות המותר (5 תגובות לשעה). נסה שוב בעוד 37 דקות."
}
```

**Cleanup**: Automatic cleanup every 5 minutes to prevent memory leaks

**Bypass Protection**: Rate limiting tracked server-side, cannot be bypassed with client manipulation

---

### 7. Authentication & Authorization

**Implementation**: NextAuth.js v5 with session-based auth

**Public Actions**: No authentication required
- `getLawDocument()`
- `submitLawComment()`
- `getParagraphComments()`

**Admin Actions**: Session + database verification required

```typescript
async function verifyAdminSession() {
  // 1. Check NextAuth session
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('נדרשת הזדהות כמנהל');
  }

  // 2. Verify admin exists in database
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });

  if (!admin) {
    throw new Error('משתמש לא מורשה');
  }

  return admin;
}
```

**Admin Action Protection**:
```typescript
// Every admin action starts with
const admin = await verifyAdminSession();

// Additional check for actions requiring adminId
if (admin.id !== adminId) {
  throw new Error('אין הרשאה לביצוע פעולה זו');
}
```

**Password Security**:
- Passwords hashed with bcrypt (cost factor 10)
- Never stored or transmitted in plain text
- Session tokens use JWT (httpOnly cookies)

---

### 8. CSRF Protection

**Implementation**: Built-in Next.js Server Actions

**Protection**:
- Server Actions automatically protected by Next.js
- Origin validation on all POST requests
- No additional CSRF token needed

**How it works**:
```typescript
// Next.js validates:
1. Request origin matches server origin
2. Request includes valid Next.js headers
3. Action function is server-side only
```

---

### 9. Data Privacy

**Implementation**: Selective field exposure

**Public View** (`getParagraphComments`):
```typescript
// ✅ Exposed to public
{
  id, firstName, lastName,
  commentContent, suggestedEdit, submittedAt
}

// ❌ Hidden from public
{
  email, phoneNumber, ipAddress, userAgent,
  moderatedBy, moderationNote
}
```

**Admin View** (`getAllLawComments`):
```typescript
// ✅ All fields visible to admins
{
  ...allPublicFields,
  email, phoneNumber, ipAddress, userAgent,
  status, moderatedBy, moderatedAt, moderationNote
}
```

**IP Address Collection**:
- Collected for spam prevention and abuse tracking
- NOT exposed to public
- Only visible to admins
- Supports proxies and load balancers (x-forwarded-for)

---

### 10. Request Size Limits

**Implementation**: Next.js default limits

**Body Size Limit**: 4MB (Next.js default)

**Field Limits**:
```typescript
firstName: 100 chars
lastName: 100 chars
email: 255 chars
phoneNumber: 20 chars
commentContent: 5000 chars
suggestedEdit: 5000 chars
```

**Protection Against**: Denial of Service (DoS) via large payloads

---

### 11. Database Constraints

**Implementation**: Prisma schema constraints

**Integrity Constraints**:
```prisma
// Required fields (NOT NULL)
firstName, lastName, email, phoneNumber, commentContent

// Foreign key constraints
paragraphId → LawParagraph (cascade delete)
moderatedBy → Admin

// Indexes for performance
@@index([paragraphId])
@@index([status])
@@index([email])
@@index([submittedAt])
```

**Data Validation at DB Level**:
- Type checking (String, Int, DateTime)
- Enum validation (CommentStatus)
- Referential integrity

---

### 12. Error Handling

**Implementation**: Try-catch blocks with Hebrew error messages

**Principles**:
```typescript
✓ Catch all errors
✓ Log detailed error server-side
✓ Return user-friendly Hebrew message client-side
✓ Never expose stack traces to users
✓ Never expose database structure
```

**Example**:
```typescript
try {
  await prisma.lawComment.create({ data });
} catch (error) {
  // ✅ Server log (detailed)
  console.error('Database error creating comment:', error);

  // ✅ Client response (generic)
  return {
    success: false,
    error: 'שגיאה בשליחת התגובה. אנא נסה שוב.',
  };

  // ❌ Never do this (exposes internals)
  // return { success: false, error: error.message };
}
```

---

### 13. Content-Security-Policy (CSP)

**Implementation**: Next.js headers configuration

**Recommended CSP** (add to `next.config.ts`):
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Security Testing Checklist

### XSS Tests
- [ ] Submit comment with `<script>alert(1)</script>` → Sanitized
- [ ] Submit comment with `<img src=x onerror="alert(1)">` → Sanitized
- [ ] Submit comment with `javascript:void(0)` → Sanitized

### SQL Injection Tests
- [ ] Submit comment with `' OR '1'='1` → Treated as text
- [ ] Submit email with `admin'--` → Validation fails

### Spam Tests
- [ ] Submit comment with "viagra casino" → Blocked
- [ ] Submit comment with 3+ URLs → Blocked
- [ ] Submit comment with ALL CAPS → Blocked

### Rate Limiting Tests
- [ ] Submit 6 comments from same IP within 1 hour → 6th blocked
- [ ] Submit 11 comments from same email within 1 hour → 11th blocked

### Duplicate Detection Tests
- [ ] Submit identical comment twice within 24 hours → 2nd blocked
- [ ] Submit 90% similar comment within 24 hours → Blocked

### Authentication Tests
- [ ] Call admin action without session → Error
- [ ] Call admin action with non-admin email → Error

---

## Security Best Practices

### For Developers

1. **Always validate input**:
   ```typescript
   // ✅ Good
   const result = commentSubmissionSchema.safeParse(data);
   if (!result.success) return { error: 'Invalid' };

   // ❌ Bad
   await prisma.lawComment.create({ data }); // No validation
   ```

2. **Never trust client data**:
   ```typescript
   // ✅ Good - server validates
   const admin = await verifyAdminSession();

   // ❌ Bad - trusting client
   const adminId = headers.get('x-admin-id');
   ```

3. **Use Prisma, not raw SQL**:
   ```typescript
   // ✅ Good - parameterized
   await prisma.lawComment.findMany({ where: { email } });

   // ❌ Bad - vulnerable
   await prisma.$queryRaw`SELECT * FROM LawComment WHERE email = '${email}'`;
   ```

4. **Sanitize before storing**:
   ```typescript
   const sanitized = sanitizeCommentContent(data.commentContent);
   await prisma.lawComment.create({ data: { commentContent: sanitized } });
   ```

5. **Log security events**:
   ```typescript
   if (spamDetected) {
     console.warn('Spam detected:', { email, ip, reason });
   }
   ```

---

## Incident Response

### If XSS Detected in Production

1. **Immediate**: Sanitize existing comments in database
   ```bash
   npx tsx scripts/sanitize-all-comments.ts
   ```

2. **Verify**: Check for malicious scripts in stored data
   ```sql
   SELECT * FROM "LawComment"
   WHERE "commentContent" LIKE '%<script%'
   OR "commentContent" LIKE '%onerror%';
   ```

3. **Patch**: Deploy security fix
4. **Monitor**: Watch logs for similar attempts

### If Rate Limit Bypass Detected

1. **Block IP**: Add to firewall/WAF
2. **Review**: Check rate limiter implementation
3. **Adjust**: Lower limits if needed
4. **Alert**: Notify team of potential bot attack

---

## Production Security Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Set strong AUTH_SECRET (32+ bytes random)
- [ ] Enable HTTPS only
- [ ] Configure CSP headers
- [ ] Set up database backups
- [ ] Configure rate limiting for production load
- [ ] Set up error logging (Sentry, etc.)
- [ ] Test all security measures
- [ ] Review environment variables
- [ ] Enable API rate limiting at proxy/CDN level

---

## Additional Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP XSS Prevention**: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- **Zod Security**: https://zod.dev
- **Prisma Security**: https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection

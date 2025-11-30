# Historical Comments Quick Reference

> **⚡ Ultra-concise reference** for developers working with Historical Comments system

## File Locations

```
📁 Core Implementation
app/api/historical-comments/route.ts         # REST API (POST/GET/OPTIONS)
app/actions/historical-comment-actions.ts    # 11 server actions
lib/services/comment-deduplication-service.ts # Dedup logic
lib/content-hash.ts                           # SHA-256 + Levenshtein
lib/comment-constants.ts                      # Keywords, platforms
lib/comment-utils.ts                          # Utility functions

📁 UI Components
components/HistoricalCommentIcon.tsx                   # MK card icon
components/historical-comments/HistoricalCommentCard.tsx    # Comment card
components/historical-comments/HistoricalCommentsDialog.tsx # Comment dialog
components/admin/HistoricalCommentsManager.tsx         # Admin interface (540 lines)
components/admin/HistoricalCommentDetailDialog.tsx     # Detail view

📁 Database
prisma/schema.prisma                          # HistoricalComment model (line 121-169)

📁 Scripts
scripts/seed-historical-comments.ts           # CSV bulk import

📁 Tests
__tests__/app/actions/historical-comment-actions.test.ts  # Server actions (23 tests)
__tests__/lib/services/comment-deduplication-service.test.ts # Dedup (28 tests)
__tests__/lib/content-hash.test.ts            # Hashing (18 tests)
__tests__/app/api/historical-comments/route.test.ts # API (19 tests)
__tests__/components/historical-comments/*.test.tsx # UI (10 tests)

📁 Documentation
docs/historical-comments/ADMIN_USER_GUIDE.md        # Admin guide (813 lines)
docs/historical-comments/API_INTEGRATION_GUIDE.md   # API guide (1563 lines)
docs/historical-comments/DEVELOPER_GUIDE.md         # Dev guide
docs/historical-comments/QUICK_REFERENCE.md         # Quick ref (this file)
docs/historical-comments/TESTING.md                 # Test docs
```

## Important Server Actions

```typescript
// User Actions
getMKHistoricalComments(mkId, limit = 50)        → HistoricalCommentData[]
getMKHistoricalCommentCount(mkId)                → number
getHistoricalCommentCounts(mkIds[])              → Record<number, number>
getRecentHistoricalComments(limit = 20)          → HistoricalCommentData[]

// Admin Actions
verifyHistoricalComment(commentId)               → boolean
bulkVerifyComments(commentIds[])                 → number
deleteHistoricalComment(commentId)               → boolean
bulkDeleteComments(commentIds[])                 → number
getHistoricalCommentStats()                      → StatsData
getAllHistoricalComments(filters, pagination)    → CommentsWithPagination
getHistoricalCommentById(id)                     → HistoricalCommentData
```

## API Endpoints

### POST /api/historical-comments

**Create comment with automatic deduplication**

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
    "commentDate": "2024-01-15T10:00:00Z"
  }'
```

**Required Fields**: mkId, content, sourceUrl, sourcePlatform, sourceType, commentDate
**Optional Fields**: sourceName, sourceCredibility, imageUrl, videoUrl, keywords

### GET /api/historical-comments

**Retrieve comments with filters**

```bash
curl -X GET "https://your-domain.com/api/historical-comments?mkId=1&limit=20&verified=true" \
  -H "Authorization: Bearer YOUR-API-KEY"
```

**Query Params**: mkId, platform, verified, sourceType, limit (max 100), offset, sortBy (date/credibility), order (asc/desc)

## Common Commands

```bash
# Development
pnpm dev                                      # Start dev server

# Database
npx prisma generate                           # Regenerate client after schema changes
npx prisma migrate dev                        # Create new migration
npx prisma studio                             # GUI for database

# Testing
npm test                                      # Run all tests (98 tests)
npm test historical-comment-actions.test.ts   # Specific suite
npm test -- --watch                           # Watch mode
npm test -- --coverage                        # Coverage report (98%+)

# CSV Import
npx tsx scripts/seed-historical-comments.ts path/to/file.csv

# Production
npm run build                                 # Build for production
npx prisma migrate deploy                     # Run migrations (prod)
```

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:pass@host/db"  # Production (Neon)
# DATABASE_URL="file:./dev.db"                  # Local (SQLite)
AUTH_SECRET="your-secret-key"                   # NextAuth secret
AUTH_URL="https://your-domain.com"              # Production URL

# API Key (choose one)
NEWS_API_KEY="your-env-api-key"                 # Env mode (1000/hour, simple)
# OR use database API keys (100/hour, multiple keys, tracking)

# Optional
NEXT_PUBLIC_ENABLE_STATUS_INFO="true"           # MK status logging
```

## Database Queries

```sql
-- Get all historical comments for MK
SELECT * FROM HistoricalComment WHERE mkId = 1 AND duplicateOf IS NULL;

-- Count comments by platform
SELECT sourcePlatform, COUNT(*) FROM HistoricalComment WHERE duplicateOf IS NULL GROUP BY sourcePlatform;

-- Find duplicates
SELECT * FROM HistoricalComment WHERE duplicateGroup = 'abc-123-uuid';

-- Get verified comments
SELECT * FROM HistoricalComment WHERE isVerified = 1 AND duplicateOf IS NULL;

-- Get comments within 90 days
SELECT * FROM HistoricalComment
WHERE commentDate >= datetime('now', '-90 days')
AND duplicateOf IS NULL;

-- Get coalition MK IDs
SELECT id, nameHe, faction FROM MK
WHERE faction IN (
  'הליכוד',
  'התאחדות הספרדים שומרי תורה',
  'יהדות התורה',
  'הציונות הדתית',
  'עוצמה יהודית',
  'נעם'
);
```

## Validation Rules Cheatsheet

| Field | Validation | Example |
|-------|-----------|---------|
| mkId | Coalition member (64 total) | 1-120 (specific IDs) |
| content | 10-5000 chars, recruitment keywords | "חוק הגיוס חשוב..." |
| sourceUrl | Valid URL, max 2000 chars | https://example.com |
| sourcePlatform | Enum: News, Twitter, Facebook, YouTube, Knesset, Interview, Other | "News" |
| sourceType | Enum: Primary, Secondary | "Primary" |
| commentDate | ISO8601 (YYYY-MM-DDTHH:MM:SSZ) | "2024-01-15T10:00:00Z" |
| sourceName | Max 500 chars (optional) | "ידיעות אחרונות" |
| sourceCredibility | 1-10 range (optional, default 5) | 8 |
| imageUrl | Valid URL (optional) | https://img.example.com/pic.jpg |
| videoUrl | Valid URL (optional) | https://youtube.com/watch?v=abc |

**Primary Keywords** (at least 1 required):
- חוק גיוס / חוק הגיוס
- גיוס חרדים
- recruitment law / draft law

## Common Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `NEWS_API_KEY` in .env, verify Bearer token format |
| Content validation fails | Ensure content includes primary keyword (חוק גיוס, etc.) |
| MK not coalition | Use only 64 coalition MK IDs (see CSV: docs/mk-coalition/coalition-members.csv) |
| Rate limit exceeded | Wait for reset time (header: X-RateLimit-Reset), or use env key (1000/hour) |
| Duplicate not detected | Check 90-day window, verify same mkId, check similarity threshold (85%) |
| CSV seeding fails | Verify UTF-8 encoding, ISO8601 dates, valid platform/type enums |

## Quick Config Changes

**Increase Rate Limit** (`lib/rate-limit.ts`):
```typescript
const limit = isEnvKey ? 2000 : 200; // Change from 1000/100
```

**Adjust Deduplication Threshold** (`lib/services/comment-deduplication-service.ts`):
```typescript
const SIMILARITY_THRESHOLD = 0.90; // Change from 0.85 (stricter)
const DUPLICATE_WINDOW_DAYS = 180; // Change from 90 (larger window)
```

**Add New Platform** (`app/api/historical-comments/route.ts`):
```typescript
sourcePlatform: z.enum(['News', 'Twitter', /* ... */, 'LinkedIn']), // Add to enum
```

Then update:
- `lib/comment-constants.ts` - Add PLATFORM_ICONS, PLATFORM_COLORS
- `components/admin/HistoricalCommentsManager.tsx` - Add to filter UI

## Key Constants

```typescript
// lib/comment-constants.ts

RECRUITMENT_LAW_KEYWORDS = {
  primary: ['חוק גיוס', 'חוק הגיוס', 'גיוס חרדים', 'recruitment law', 'draft law'],
  secondary: ['צה״ל', 'IDF', 'חרדים', 'haredim', 'ישיבות', /* ... */]
}

COALITION_PARTIES = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה',
  'יהדות התורה',
  'הציונות הדתית',
  'עוצמה יהודית',
  'נעם'
]

PLATFORM_ICONS = {
  News: 'newspaper',
  Twitter: 'twitter',
  Facebook: 'facebook',
  YouTube: 'youtube',
  Knesset: 'building',
  Interview: 'microphone',
  Other: 'link'
}
```

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Deduplication (1000 comments) | <500ms | ~450ms |
| Batch count (120 MKs) | <100ms | ~80ms |
| Admin table load (1000) | <200ms | ~180ms |
| API POST response | <150ms | ~120ms |
| API GET response | <200ms | ~150ms |

## Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| Server Actions | 23 | 98% |
| Deduplication Service | 28 | 99% |
| Content Hash | 18 | 100% |
| API Routes | 19 | 97% |
| UI Components | 10 | 95% |
| **Total** | **98** | **98%** |

## Useful Links

- [Admin User Guide](./ADMIN_USER_GUIDE.md) - Managing comments in admin dashboard
- [API Integration Guide](./API_INTEGRATION_GUIDE.md) - Integrating external systems
- [Developer Guide](./DEVELOPER_GUIDE.md) - Architecture and implementation details
- [Testing Documentation](./TESTING.md) - Test suite and coverage
- [CLAUDE.md](../../CLAUDE.md) - Main project documentation (see Historical Comments section)

---

**Last Updated**: 2025-01-18
**Version**: 1.0

# Tweet Tracking System - Feature Overview

## What It Does

The Tweet Tracking System allows the EL HADEGEL platform to collect, store, and display social media posts and statements from Israeli Knesset members regarding the IDF recruitment law.

### Key Capabilities

1. **External API Integration** - AI agents and scrapers can automatically submit tweets via REST API
2. **Real-time Display** - Users see the latest statements from each MK on their profile cards
3. **Centralized Storage** - All statements stored in SQLite database with full metadata
4. **Multi-Platform Support** - Tracks content from Twitter, Facebook, Instagram, News sites, and Knesset website
5. **Secure Access** - API key authentication prevents unauthorized submissions
6. **Rate Limiting** - Prevents abuse with 100 requests/hour per API key

## User Experience

### For Public Visitors

1. Visit the homepage at `/`
2. Browse Knesset member cards
3. See a blue speech bubble icon on cards where the MK has made statements
4. Click the icon to open a dialog showing all their statements
5. View statements with:
   - Platform badges (Twitter, Facebook, etc.)
   - Timestamps in Hebrew ("לפני 3 שעות")
   - Full content
   - Links to original sources

### For Administrators

1. Log in to admin dashboard
2. View all API keys and their usage
3. Create new API keys for external integrations
4. Enable/disable API keys as needed
5. Monitor API usage via lastUsedAt timestamps
6. (Future) Moderate/delete inappropriate tweets

### For External Developers

1. Request API key from admin
2. Use REST API to submit tweets programmatically
3. Integrate with scraper bots, AI agents, or manual tools
4. Monitor rate limits via response headers
5. Handle errors and retries appropriately

## Technical Architecture

### Stack

- **Frontend**: React 19.2, Next.js 16 App Router, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: SQLite with Prisma ORM
- **Authentication**: bcrypt-hashed API keys
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS v4

### Data Model

**Tweet**:
- id (auto-increment)
- mkId (foreign key to MK)
- content (text, max 5000 chars)
- sourceUrl (optional URL)
- sourcePlatform (enum)
- postedAt (datetime)
- createdAt (datetime)

**ApiKey**:
- id (auto-increment)
- name (descriptive)
- keyHash (bcrypt)
- isActive (boolean)
- lastUsedAt (datetime)
- createdBy (admin email)
- createdAt (datetime)

### API Endpoints

#### POST /api/tweets
Submit a new tweet/statement.

**Authentication**: Required (Bearer token)

**Request**:
```json
{
  "mkId": 1,
  "content": "Statement text",
  "sourcePlatform": "Twitter",
  "sourceUrl": "https://...",
  "postedAt": "2024-01-15T10:30:00Z"
}
```

**Response** (201):
```json
{
  "success": true,
  "tweet": { ... }
}
```

#### GET /api/tweets
Retrieve tweets with filtering.

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `mkId` - Filter by MK
- `limit` - Max results (default 50)
- `offset` - Skip N results

**Response** (200):
```json
{
  "success": true,
  "tweets": [...],
  "pagination": { ... }
}
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| TweetIcon | Shows count, opens dialog | `components/TweetIcon.tsx` |
| TweetCard | Single tweet display | `components/TweetCard.tsx` |
| TweetsList | Scrollable list | `components/TweetsList.tsx` |
| TweetsDialog | Modal container | `components/TweetsDialog.tsx` |
| MKCard | Updated with tweet icon | `components/mk-card.tsx` |

### Server Actions

| Function | Purpose | File |
|----------|---------|------|
| getMKTweets | Fetch tweets for MK | `app/actions/tweet-actions.ts` |
| getMKTweetCount | Count tweets | `app/actions/tweet-actions.ts` |
| getRecentTweets | Latest across all MKs | `app/actions/tweet-actions.ts` |
| getTweetStats | Statistics | `app/actions/tweet-actions.ts` |
| deleteTweet | Remove tweet | `app/actions/tweet-actions.ts` |
| createApiKey | Generate new key | `app/actions/api-key-actions.ts` |
| getApiKeys | List keys | `app/actions/api-key-actions.ts` |
| toggleApiKey | Enable/disable | `app/actions/api-key-actions.ts` |

## Performance

### Benchmarks (Average)

- `getMKTweets(20)`: 105ms
- `getMKTweetCount()`: 4ms
- `getTweetStats()`: 7ms
- `POST /api/tweets`: 128ms
- `GET /api/tweets`: 102ms

All operations complete in under 500ms (target: <100ms for reads, <500ms for writes).

### Optimization Techniques

1. **Database Indexes** - mkId and postedAt indexed for fast queries
2. **Efficient Queries** - Use Prisma includes to avoid N+1 queries
3. **Lazy Loading** - Tweets only loaded when dialog opens
4. **Pagination** - Limit results to 50 tweets per request
5. **In-Memory Rate Limiting** - O(1) lookup for auth checks

## Security

### Threats Mitigated

1. **Unauthorized Access** - API key authentication required
2. **Brute Force** - Rate limiting (100 req/hour)
3. **SQL Injection** - Prisma ORM with parameterized queries
4. **XSS** - React automatic escaping
5. **Credential Exposure** - bcrypt hashing, keys never stored plain

### Best Practices

- API keys generated with crypto.randomBytes(32)
- bcrypt cost factor 10 (secure hashing)
- HTTPS required in production
- Input validation with Zod
- Error messages don't leak sensitive info

## Testing

### Test Coverage

| Test Suite | Tests | Pass Rate |
|------------|-------|-----------|
| API Integration | 13 | 100% |
| Performance | 7 | 100% |
| UI Manual Checklist | 90 items | - |

### Running Tests

```bash
# API tests
npx tsx scripts/test-api-integration.ts

# Performance tests
npx tsx scripts/test-performance.ts

# UI tests (manual)
# Follow checklist in docs/testing/UI_TESTING_CHECKLIST.md
```

## Documentation

### For Developers

- **API Reference**: `docs/api/openapi.yaml`
- **Developer Guide**: `docs/api/DEVELOPER_GUIDE.md`
- **Code Examples**: `docs/api/CODE_EXAMPLES.md` (Python, Node.js, Go)

### For Maintainers

- **Feature Overview**: This document
- **CLAUDE.md**: Development context (updated with tweet system)
- **Testing Guides**: `docs/testing/`

## Deployment Checklist

Before deploying to production:

- [ ] Change AUTH_SECRET in .env
- [ ] Delete test API key from database
- [ ] Set up HTTPS/SSL
- [ ] Configure production DATABASE_URL
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Test API with production URL
- [ ] Monitor rate limit for abuse
- [ ] Set up error logging/monitoring
- [ ] Create admin API key management UI
- [ ] Document production API base URL

## Future Roadmap

### Phase 2 Enhancements

- [ ] Admin dashboard for API key management
- [ ] Tweet moderation interface
- [ ] Sentiment analysis integration
- [ ] Twitter/X API auto-scraping
- [ ] Email notifications for new tweets
- [ ] Historical trend charts
- [ ] Advanced filtering (date range, sentiment)
- [ ] Duplicate detection
- [ ] Export to CSV/JSON

### Phase 3 Enhancements

- [ ] Multi-language support (English, Arabic)
- [ ] Full-text search
- [ ] Tweet categorization by topic
- [ ] WebSocket for real-time updates
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard

## Support

For questions or issues:
- Check CLAUDE.md for development context
- Review API documentation in `docs/api/`
- Run test suites to verify functionality
- Check GitHub issues (if applicable)
- Contact: admin@el-hadegel.com

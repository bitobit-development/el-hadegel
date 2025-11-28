# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EL HADEGEL** - A Hebrew-language platform for tracking Israeli Knesset members' positions on the IDF recruitment law. The application features a color-coded system (🟢 Support, 🟠 Neutral, 🔴 Against) with a public landing page and an admin dashboard for position management.

## Tech Stack

- **Framework**: Next.js 16.0.4 (App Router with React Server Components)
- **React**: 19.2.0
- **Database**: SQLite with Prisma ORM 7.0.1
- **Authentication**: NextAuth.js v5 (beta.30)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Font**: Rubik (Google Fonts) with Hebrew subset
- **TypeScript**: v5
- **Package Manager**: pnpm

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server on http://localhost:3000
pnpm build                 # Build for production (runs prisma generate automatically)
pnpm start                 # Start production server
pnpm lint                  # Run ESLint

# Database
npx prisma generate        # Generate Prisma client after schema changes
npx prisma migrate dev     # Create and apply database migrations
npx prisma db seed         # Seed database with 120 Knesset members
npx prisma studio          # Open Prisma Studio GUI

# Testing
npx playwright test                          # Run all Playwright tests (requires dev server running)
npx playwright test --ui                     # Run tests in UI mode
npx tsx scripts/test-api-integration.ts      # Run API integration tests (13 tests)
npx tsx scripts/test-news-security.ts        # Run news API security tests (18 tests)
npx tsx scripts/test-performance.ts          # Run performance benchmarks (7 tests)

# Utility Scripts
npx tsx scripts/cleanup-test-data.ts         # Clean up test data from database
npx tsx scripts/create-admin.ts              # Create new admin user
npx tsx scripts/verify-data.ts               # Verify database data integrity
npx tsx scripts/reset-news-posts.ts          # Delete all news posts
npx tsx scripts/verify-news-posts.ts         # Verify news posts in database
npx tsx scripts/check-api-keys.ts            # List API keys in database
```

## Application Architecture

### Database Layer (`prisma/`)

**Schema** (`schema.prisma`):
- `MK` - Knesset members (120 total)
- `PositionHistory` - Audit trail of position changes
- `Admin` - Admin users with bcrypt-hashed passwords
- `Tweet` - Social media posts from MKs
- `ApiKey` - API keys for external integrations
- `NewsPost` - News feed posts with Open Graph previews
- `MKStatusInfo` - Status logging for admin users
- `Position` enum - SUPPORT | NEUTRAL | AGAINST

**Seeding**: Initial data loaded from `docs/parlament-website/all-mks-list.md`

**Database Adapters**: Project supports dual database modes:
- **Local Development**: SQLite with `@prisma/adapter-better-sqlite3`
- **Production**: Neon Postgres with `@prisma/adapter-neon` and `@neondatabase/serverless`
- Adapter is configured in `lib/prisma.ts` based on DATABASE_URL format

### Data Access Layer (`app/actions/`, `lib/`)

**Server Actions** (`app/actions/mk-actions.ts`):
- `getMKs()` - Fetch with optional filters (faction, position, search)
- `getPositionStats()` - Real-time position distribution counts
- `getFactions()` - Unique faction list
- `updateMKPosition()` - Single update with transaction + history
- `bulkUpdatePositions()` - Batch updates with history tracking
- `getMKPositionHistory()` - Audit trail for specific MK

**Prisma Client** (`lib/prisma.ts`):
- Singleton pattern with better-sqlite3 adapter
- Default database: `file:./prisma/dev.db`

### Authentication (`auth.ts`, `app/login/`)

**NextAuth.js Configuration**:
- Credentials provider with bcrypt password verification
- JWT-based sessions
- Custom sign-in page: `/login`
- Default admin: `admin@el-hadegel.com` / `admin123`

**Protected Routes**:
- All main application routes require authentication
- Protected routes use Next.js route groups: `app/(protected)/`
- Server-side session check in layout prevents unauthorized access
- Unauthenticated users redirect to `/login`

**Protected Layout** (`app/(protected)/layout.tsx`):
- Checks session using `auth()` from NextAuth.js
- Redirects to `/login` if no valid session
- Wraps both landing page and admin dashboard
- Handles ONLY authentication logic (no UI rendering)
- Child routes/pages are responsible for rendering their own headers

**Login Flow**:
- Route: `/login` (public, no auth required)
- After successful login → Redirects to `/` (landing page)
- Session persists via JWT (httpOnly cookies)
- Default credentials: `admin@elhadegel.co.il` / `Tsitsi2025!!`

**Header Components**:
- **PageHeader** (`components/page-header.tsx`): Landing page header
  - Displays user info (name or email)
  - Navigation button: "לוח בקרה" → `/admin`
  - Logout button: "התנתק" → signOut
  - Gradient background matching brand

- **AdminHeader** (`components/admin/admin-header.tsx`): Admin dashboard header
  - Same visual design as PageHeader
  - Navigation button: "עמוד הבית" → `/`
  - Logout button: "התנתק" → signOut
  - Already existed, now part of bidirectional navigation

### Protected Frontend (`app/(protected)/page.tsx`, `components/`)

**Landing Page** - Server-rendered with authentication required:
- `StatsDashboard` - Position distribution with color-coded progress bar
- `MKList` (Client Component) - Grid of MK cards with client-side filtering
  - Search by name/faction
  - Filter by position and faction (checkboxes)
  - `FilterPanel` for controls
- `MKCard` - Individual member display with avatar, faction, position badge

### Admin Dashboard (`app/(protected)/admin/`, `components/admin/`)

**Layout** (`app/(protected)/admin/layout.tsx`):
- Nested within protected layout (inherits auth check)
- No redundant session verification (parent handles it)
- Displays AdminHeader with user info, home link, logout
- Simplified from previous version (auth moved to parent)

**Dashboard** (`app/admin/page.tsx`):
- Same `StatsDashboard` as public page
- `AdminMKTable` (Client Component):
  - Sortable table of all 120 members
  - Search functionality
  - Checkbox selection for bulk operations
  - Individual update/history buttons per row

**Dialogs** (Client Components):
- `PositionUpdateDialog` - Single/bulk position updates with visual selector and optional notes
- `PositionHistoryDialog` - Timeline of position changes with timestamps, admin, notes

### Type System (`types/`)

**Core Types** (`types/mk.ts`):
```typescript
PositionStatus = 'SUPPORT' | 'NEUTRAL' | 'AGAINST'
MKData - Full MK record
PositionHistoryEntry - Audit trail entry
PositionStats - { support, neutral, against, total }
FilterOptions - { factions, positions, searchQuery }
```

**Constants**:
- `POSITION_LABELS` - Hebrew translations (תומך, מתנדנד, מתנגד)
- `POSITION_COLORS` - Tailwind classes (green-500, orange-500, red-500)

**NextAuth Types** (`types/next-auth.d.ts`):
- Extends Session and User with id/email/name

### UI Components (`components/ui/`)

shadcn/ui components (Radix UI + Tailwind):
- `badge`, `button`, `card`, `checkbox`, `input`, `label`, `select`, `avatar`, `dialog`, `textarea`

Custom components:
- `PositionBadge` - Color-coded position indicator

## Hebrew & RTL Configuration

**Root Layout** (`app/layout.tsx`):
- `<html lang="he" dir="rtl">`
- Rubik font with Hebrew subset
- All metadata in Hebrew

**RTL Best Practices**:
- Use `text-right` for text alignment in components
- Tailwind's logical properties automatically flip in RTL
- Test layout with Hebrew content
- Ensure forms and dialogs have proper RTL layout

## Path Aliases

- `@/*` → Root directory (tsconfig.json)

## Environment Variables

Required in `.env`:
```bash
# Local Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (Neon Postgres)
# DATABASE_URL="postgres://[user]:[password]@[host]/[database]?sslmode=require"

# Authentication
AUTH_SECRET="your-secret-key"      # Change in production! Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"   # Update to production URL in deployment

# Feature Flags
NEXT_PUBLIC_ENABLE_STATUS_INFO="true"  # Enable MK status logging

# News Posts API
NEWS_API_KEY="your-api-key-here"   # API key for news posts endpoint
                                   # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Note**: The database adapter automatically switches based on DATABASE_URL format (file: for SQLite, postgres: for Neon)

## Important Implementation Notes

### Database Transactions
Position updates use Prisma transactions to ensure:
1. MK record updated
2. History entry created
Both succeed or both fail - no partial updates.

### Server Components vs Client Components
- **Server**: `page.tsx`, layouts, data fetching
- **Client**: Forms, dialogs, interactive filters, tables with state
- Use `'use client'` directive for interactivity
- Server Actions (`'use server'`) for mutations

### Database Adapter Pattern
The project uses database adapters for flexibility:
- SQLite adapter (`@prisma/adapter-better-sqlite3`) for local development
- Neon adapter (`@prisma/adapter-neon`) for production Postgres
- Automatic switching based on DATABASE_URL in `lib/prisma.ts`
- Migration scripts available in `scripts/migrate-to-neon.ts` and `scripts/import-to-neon.ts`

### NextAuth.js v5 Beta
Using beta version for Next.js 16 App Router compatibility. Session checking is done server-side in layouts.

### Route Groups for Authentication

This project uses Next.js 13+ route groups to organize authenticated routes:

**Directory Structure:**
```
app/
├── (protected)/         # Route group (doesn't affect URL)
│   ├── layout.tsx       # Auth check ONLY (no UI rendering)
│   ├── page.tsx         # Landing page (/) - renders PageHeader
│   └── admin/
│       ├── layout.tsx   # Renders AdminHeader
│       └── page.tsx     # Admin dashboard (/admin)
├── login/
│   └── page.tsx         # Public login page
└── layout.tsx           # Root layout
```

**Benefits:**
- Single source of auth logic (parent layout)
- Clean URLs (route group doesn't appear in path)
- Automatic protection for all child routes
- Easy to add new protected routes

**Critical Architecture Pattern:**
- Parent protected layout handles ONLY authentication, NOT UI rendering
- Each page/route is responsible for rendering its own header component
- This prevents duplicate header issues when navigating between routes
- Landing page (`app/(protected)/page.tsx`) renders `PageHeader`
- Admin layout (`app/(protected)/admin/layout.tsx`) renders `AdminHeader`

**URL Mapping:**
- `/` → `app/(protected)/page.tsx`
- `/admin` → `app/(protected)/admin/page.tsx`
- `/login` → `app/login/page.tsx` (public)

## Data Flow Examples

**Public View**:
1. `app/page.tsx` calls `getMKs()`, `getPositionStats()`, `getFactions()`
2. Server Components render with initial data
3. `MKList` (Client) handles filtering client-side

**Admin Update**:
1. User clicks "עדכן עמדה" in `AdminMKTable`
2. `PositionUpdateDialog` opens (Client Component with state)
3. User selects position, clicks "עדכן עמדה"
4. Calls `updateMKPosition()` Server Action
5. Prisma transaction updates MK + creates PositionHistory
6. `router.refresh()` triggers server re-render
7. Dashboard shows updated stats and badge color

## Common Development Tasks

### Adding a New Position Filter
1. Update `FilterOptions` type in `types/mk.ts`
2. Add filter logic in `getMKs()` Server Action
3. Update `FilterPanel` component with new UI controls
4. Update `MKList` to pass new filter to `getMKs()`

### Modifying Database Schema
```bash
1. Edit prisma/schema.prisma
2. npx prisma migrate dev --name descriptive_name
3. npx prisma generate
4. Update TypeScript types in types/mk.ts if needed
5. Update seed script if needed
```

### Adding New Admin Features
1. Create component in `components/admin/`
2. Add to `app/admin/page.tsx` or create new admin route
3. Protected automatically by `app/admin/layout.tsx`
4. Create Server Actions in `app/actions/` for mutations

## Social Media Tracking System

**Overview**: The application tracks social media posts and statements from Knesset members regarding the IDF recruitment law. An external REST API allows AI agents to automatically submit tweets.

### Architecture

#### Database Layer

**Tweet Model** (`prisma/schema.prisma`):
- Stores social media posts/statements
- Fields: content, sourceUrl, sourcePlatform, postedAt
- Relations: MK (many-to-one with cascade delete)
- Indexes: mkId, postedAt

**ApiKey Model** (`prisma/schema.prisma`):
- Stores bcrypt-hashed API keys for authentication
- Fields: name, keyHash, isActive, lastUsedAt, createdBy
- Used for REST API authentication

#### REST API Layer

**Endpoints** (`app/api/tweets/route.ts`):
- `POST /api/tweets` - Submit new tweet (authenticated)
- `GET /api/tweets` - Retrieve tweets with filtering (authenticated)

**Authentication** (`lib/api-auth.ts`):
- Bearer token format: `Authorization: Bearer <api-key>`
- bcrypt comparison against stored hashes
- Updates lastUsedAt timestamp on use

**Rate Limiting** (`lib/rate-limit.ts`):
- 100 requests per hour per API key
- In-memory tracking with automatic cleanup
- Returns X-RateLimit-* headers

**Validation**:
- Zod schemas for request validation
- Required fields: mkId, content, sourcePlatform, postedAt
- Platform enum: Twitter, Facebook, Instagram, News, Knesset Website, Other
- Content max length: 5000 characters

#### Server Actions Layer

**Tweet Actions** (`app/actions/tweet-actions.ts`):
- `getMKTweets(mkId, limit)` - Get tweets for specific MK
- `getMKTweetCount(mkId)` - Count tweets for MK
- `getRecentTweets(limit)` - Get latest tweets across all MKs
- `getTweetStats()` - Statistics by platform and MK
- `deleteTweet(tweetId)` - Admin-only deletion

**MK Actions** (`app/actions/mk-actions.ts`):
- Updated `getMKs()` with optional `includeTweetCount` parameter
- Efficiently fetches tweet counts using Prisma groupBy

**API Key Actions** (`app/actions/api-key-actions.ts`):
- `createApiKey(name)` - Generate new API key (returns plain key once)
- `getApiKeys()` - List all API keys
- `toggleApiKey(id)` - Enable/disable API key
- `deleteApiKey(id)` - Remove API key

#### Utility Layer

**Tweet Utils** (`lib/tweet-utils.ts`):
- `formatTweetDate(date)` - Hebrew date formatting (date-fns)
- `getRelativeTime(date)` - Relative time in Hebrew ("לפני X שעות")
- `truncateTweet(content, length)` - Content truncation
- `getPlatformIcon(platform)` - Platform icon mapping
- `getPlatformColor(platform)` - Platform color mapping

#### UI Components

**TweetIcon** (`components/TweetIcon.tsx`):
- Displays on MK cards when tweetCount > 0
- Shows count badge
- Opens TweetsDialog on click

**TweetCard** (`components/TweetCard.tsx`):
- Displays single tweet
- Platform badge, relative time, content
- Optional source link
- Supports showMKName prop for admin views

**TweetsList** (`components/TweetsList.tsx`):
- Scrollable list of TweetCard components
- Empty state with icon and message
- Max height 600px with scroll

**TweetsDialog** (`components/TweetsDialog.tsx`):
- Modal dialog showing MK's tweets
- Lazy loads tweets on open
- Loading state with spinner
- Displays up to 50 tweets

**Updated Components**:
- `MKCard` - Integrated TweetIcon and TweetsDialog
- `HomePage` - Fetches MKs with tweet counts

### Data Flow

**External Tweet Submission**:
1. AI agent/scraper sends POST to `/api/tweets` with API key
2. Authentication middleware validates API key
3. Rate limiter checks request count
4. Zod validator checks request body
5. Verify MK exists in database
6. Create tweet record
7. Return success with tweet data

**User Viewing Tweets**:
1. Homepage loads MKs with `getMKs(undefined, true)` including tweet counts
2. MK cards render with TweetIcon if count > 0
3. User clicks TweetIcon
4. TweetsDialog opens and calls `getMKTweets(mkId, 50)`
5. Server Action fetches tweets from database
6. TweetsList renders TweetCard for each tweet
7. User views tweets with platform badges, dates, content

### API Integration

**Getting an API Key**:
1. Admin logs in to `/admin`
2. Navigate to API Keys section (future admin page)
3. Create new API key with descriptive name
4. Copy plain API key (shown only once)
5. Store securely in external system

**Using the API**:
See comprehensive documentation in `docs/api/`:
- `openapi.yaml` - OpenAPI 3.0 specification
- `DEVELOPER_GUIDE.md` - Integration guide
- `CODE_EXAMPLES.md` - Python, Node.js, Go examples

**Test API Key** (development only):
- Key: `test-api-key-dev-2024`
- Seeded in database for testing
- DO NOT use in production

### Common Development Tasks

#### Adding a New Platform

1. Update `types/tweet.ts`:
```typescript
export const TWEET_PLATFORMS = [
  // ... existing platforms
  'NewPlatform',
] as const;
```

2. Update Zod schema in `app/api/tweets/route.ts`:
```typescript
sourcePlatform: z.enum([..., 'NewPlatform']),
```

3. Update utility functions in `lib/tweet-utils.ts`:
```typescript
export function getPlatformIcon(platform: string): string {
  const iconMap: Record<string, string> = {
    // ... existing
    'NewPlatform': 'icon-name',
  };
}

export function getPlatformColor(platform: string): string {
  const colorMap: Record<string, string> = {
    // ... existing
    'NewPlatform': 'bg-color-class',
  };
}
```

#### Modifying Rate Limits

Edit `lib/rate-limit.ts`:
```typescript
const limit = 200; // Change from 100 to 200
const windowMs = 60 * 60 * 1000; // 1 hour
```

#### Adding Tweet Filters

1. Update Server Action in `app/actions/tweet-actions.ts`:
```typescript
export async function getMKTweets(
  mkId: number,
  limit: number = 20,
  platform?: string // Add new parameter
): Promise<TweetData[]> {
  const where: any = { mkId };
  if (platform) where.sourcePlatform = platform;

  const tweets = await prisma.tweet.findMany({
    where,
    // ... rest
  });
}
```

2. Update UI component to pass filter

#### Creating Admin UI for API Keys

See `app/actions/api-key-actions.ts` for Server Actions:
- Create new page: `app/admin/api-keys/page.tsx`
- Use existing shadcn/ui Table component
- Display list with create/toggle/delete actions
- Show lastUsedAt timestamp
- Handle API key generation (copy to clipboard)

### Performance Considerations

**Database Indexes**:
- `Tweet_mkId_idx` - Fast MK filtering
- `Tweet_postedAt_idx` - Chronological sorting
- `ApiKey_keyHash_idx` - Authentication lookup

**Optimization Strategies**:
- Use `groupBy` for tweet counts (single query)
- Include MK name in tweet query (avoid N+1)
- Limit tweet loads to 50 per dialog
- Lazy load tweets only when dialog opens

**Caching**:
- MK data cached in Next.js (Server Components)
- Rate limits stored in-memory (fast access)
- Use `revalidatePath()` after mutations

### Security Considerations

**API Keys**:
- Generated using crypto.randomBytes(32)
- Hashed with bcrypt (cost factor 10)
- Plain key shown only once during creation
- Stored hash never exposed

**Input Validation**:
- All requests validated with Zod
- SQL injection prevented by Prisma
- XSS prevented by React (automatic escaping)
- CSRF protection via API key authentication

**Rate Limiting**:
- Prevents abuse (100 req/hour)
- Per-API-key tracking
- Returns clear error messages

### Testing

**Test Framework**: Playwright for E2E testing

**Configuration** (`playwright.config.ts`):
- Test directory: `./tests`
- Base URL: `http://localhost:3000`
- Single worker (sequential execution)
- Screenshots on failure only
- HTML reporter

**Test Files**:
- `tests/` - Playwright E2E tests (requires dev server running)
- `scripts/test-api-integration.ts` - 13 API tests (100% pass)
- `scripts/test-performance.ts` - 7 performance tests
- `docs/testing/UI_TESTING_CHECKLIST.md` - 90-item manual checklist

**Running Tests**:
```bash
# Playwright E2E tests (ensure dev server is running first)
pnpm dev                                     # Start dev server in separate terminal
npx playwright test                          # Run all tests
npx playwright test --ui                     # Run with UI mode
npx playwright test tests/auth.spec.ts       # Run specific test file

# Script-based tests
npx tsx scripts/test-api-integration.ts      # API integration tests
npx tsx scripts/test-performance.ts          # Performance benchmarks
```

**Test Coverage**:
- Authentication and authorization (Playwright)
- Input validation (API tests)
- CRUD operations (API tests)
- Rate limiting (API tests)
- Hebrew content support (E2E tests)
- Performance benchmarks (Script tests)

### Troubleshooting

**Issue**: API returns 401 Unauthorized
- **Solution**: Check API key is correct and active in database
- **Check**: `SELECT * FROM ApiKey WHERE isActive = 1;`

**Issue**: Rate limit exceeded
- **Solution**: Wait until reset time (check X-RateLimit-Reset header)
- **Check**: Current usage with rate limit headers

**Issue**: Tweet icon not appearing
- **Solution**: Verify `getMKs(undefined, true)` includes tweet counts
- **Check**: Console log MK data to verify tweetCount field exists

**Issue**: Hebrew text not displaying
- **Solution**: Verify database charset is UTF-8
- **Check**: Content-Type headers include charset=utf-8

**Issue**: Dialog not opening
- **Solution**: Check browser console for React errors
- **Check**: Verify useState and event handlers in MKCard

### Future Enhancements

**Potential Features**:
- Tweet sentiment analysis
- Automatic categorization by topic
- Historical trend charts
- Email notifications for new tweets
- Twitter/X API integration for automatic scraping
- Admin dashboard for tweet management
- Duplicate detection
- Tweet editing/moderation

## News Posts Feed System

**Overview**: A news feed system displayed on the landing page (above statistics) that aggregates news posts with rich Open Graph previews. External systems can submit posts via REST API.

### Architecture

#### Database Layer

**NewsPost Model** (`prisma/schema.prisma`):
- Stores news posts with Open Graph metadata
- Fields: content, sourceUrl, sourceName, postedAt
- Preview metadata: previewTitle, previewImage, previewDescription, previewSiteName
- Indexed by postedAt for chronological ordering
- Maximum 10 posts displayed at once (newest first)

#### REST API Layer

**Endpoints** (`app/api/news-posts/route.ts`):
- `POST /api/news-posts` - Submit new news post (authenticated)
- `GET /api/news-posts` - Retrieve news posts with pagination (authenticated)
- `OPTIONS /api/news-posts` - CORS preflight handler

**Authentication** (`lib/api-auth.ts`):
- Dual authentication system:
  - **Environment Variable**: Checks `NEWS_API_KEY` from `.env` (development/simple setup)
  - **Database**: Checks bcrypt-hashed API keys in ApiKey table (production/multiple keys)
- Environment-based auth uses apiKeyId = 0 (special case)
- Database auth updates lastUsedAt timestamp on use

**Rate Limiting** (`lib/rate-limit.ts`):
- Environment keys: 1000 requests per hour
- Database keys: 100 requests per hour
- In-memory tracking with automatic cleanup
- Returns X-RateLimit-* headers (Limit, Remaining, Reset)

**Security (13 Layers)**:
1. API key authentication (dual mode)
2. Rate limiting (per-key tracking)
3. XSS prevention (content sanitization)
4. SSRF protection (blocks private IPs, localhost, cloud metadata)
5. Spam detection (keyword patterns, excessive URLs)
6. Duplicate detection (24-hour window per URL)
7. Request size limits (100KB maximum)
8. Image URL validation
9. CORS headers
10. Zod schema validation
11. Audit logging
12. Input sanitization
13. Error handling

**Open Graph Scraping** (`lib/og-scraper.ts`):
- Automatic metadata extraction from sourceUrl
- Uses `open-graph-scraper` library
- Extracts: title, image, description, site name
- Graceful fallback if scraping fails
- SSRF protection against internal URLs

#### Server Actions Layer

**News Actions** (`app/actions/news-actions.ts`):
- `getLatestNewsPosts(limit)` - Fetch recent posts (default 10)
- `getNewsPostCount()` - Total count of posts
- `deleteNewsPost(id)` - Admin-only deletion

#### Utility Layer

**News Utils** (`lib/news-utils.ts`):
- `getRelativeNewsTime(date)` - Hebrew relative time ("לפני X דקות")
- `truncateNewsContent(content, length)` - Content truncation
- `getUrlDomain(url)` - Extract domain from URL
- `getPlatformIcon(url)` - Platform icon mapping (X, Facebook, etc.)

**Security Utils** (`lib/security-utils.ts`):
- `sanitizeContent(content)` - XSS prevention (removes scripts, dangerous tags)
- `sanitizeUrl(url)` - URL validation and normalization
- `isSpam(content)` - Spam detection (keywords, patterns)
- `hasExcessiveUrls(content)` - URL count validation
- `isValidImageUrl(url)` - Image URL validation
- `getClientIp(headers)` - Extract client IP for logging
- `isValidRequestSize(body)` - Request size validation

#### UI Components

**NewsPostsSection** (`components/news-posts/NewsPostsSection.tsx`):
- Main container for news feed
- Auto-refresh every 60 seconds
- Manual refresh button
- Loading states
- Empty state handling

**NewsPostsList** (`components/news-posts/NewsPostsList.tsx`):
- List wrapper with grid layout
- Responsive design (1-3 columns)
- Loading skeleton
- Empty state message

**NewsPostCard** (`components/news-posts/NewsPostCard.tsx`):
- Compact horizontal layout
- Passport-sized image (80x80px) on left
- Content on right (title, description, user content)
- Platform badge and source link
- Hebrew RTL support

### Data Flow

**External Post Submission**:
1. External system sends POST to `/api/news-posts` with API key
2. Dual authentication checks env variable first, then database
3. Rate limiter checks request count (1000/hour for env, 100/hour for DB)
4. Request size validation (100KB max)
5. Zod validates request body (content, sourceUrl required)
6. Content sanitization (XSS prevention)
7. Spam detection (keywords, excessive URLs)
8. URL sanitization and SSRF protection
9. Duplicate detection (same URL within 24 hours)
10. Open Graph metadata scraping from sourceUrl
11. Image URL validation
12. Create NewsPost record with sanitized data
13. Audit logging (IP, timestamp, API key ID)
14. Trigger revalidation of landing page
15. Return success with post data

**User Viewing Posts**:
1. Landing page auto-refreshes every 60 seconds
2. Server Action calls `getLatestNewsPosts(10)`
3. Fetch 10 most recent posts ordered by postedAt DESC
4. NewsPostsList renders grid of NewsPostCard components
5. Each card shows image, title, content, source link
6. Manual refresh button available

### API Integration

**Generating API Key**:
```bash
# Generate secure random key
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Add to .env for local development
NEWS_API_KEY="generated-key-here"

# Or add to Vercel for production
vercel env add NEWS_API_KEY production
```

**Using the API**:
```bash
# Submit news post
curl -X POST https://your-domain.com/api/news-posts \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "News content in Hebrew",
    "sourceUrl": "https://example.com/article",
    "sourceName": "Source Name (optional)",
    "postedAt": "2025-01-15T10:00:00Z (optional)"
  }'

# Get news posts
curl -X GET "https://your-domain.com/api/news-posts?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR-API-KEY"
```

**Documentation**:
- `docs/security/API_SECURITY.md` - Comprehensive security guide
- API examples with cURL, JavaScript, Python

### Testing

**Security Tests** (`scripts/test-news-security.ts`):
- 18 comprehensive security tests
- Tests XSS prevention, SSRF protection, spam detection
- Duplicate detection, rate limiting
- All tests passing (100%)

**Utility Scripts**:
```bash
npx tsx scripts/reset-news-posts.ts     # Delete all news posts
npx tsx scripts/verify-news-posts.ts    # Verify database state
npx tsx scripts/test-news-security.ts   # Run security test suite
```

### Common Development Tasks

**Adding New Security Layer**:
1. Add security function to `lib/security-utils.ts`
2. Integrate into API route at appropriate step
3. Add test case to `scripts/test-news-security.ts`
4. Update security documentation

**Modifying Rate Limits**:
Edit `lib/rate-limit.ts`:
```typescript
const isEnvKey = apiKeyId === 0;
const limit = isEnvKey ? 2000 : 200; // Increase limits
```

**Changing Display Limit**:
1. Update constant in `types/news.ts`: `MAX_POSTS_DISPLAY`
2. Update `getLatestNewsPosts()` default limit
3. Update UI component prop defaults

### Performance Considerations

**Database Optimization**:
- Indexed postedAt field for fast chronological sorting
- Limit queries to 10 posts (pagination)
- Use Server Components for initial data fetch

**Caching Strategy**:
- Server Components cache posts until revalidation
- Manual refresh triggers client-side refetch
- Auto-refresh every 60 seconds
- GET endpoint includes Cache-Control header (60s)

**Image Optimization**:
- Next.js Image component for preview images
- Lazy loading for images below fold
- External images allowed via next.config.ts
- Image URL validation before storing

### Security Considerations

**API Key Management**:
- Environment variable: Simple, single key, higher limits
- Database: Multiple keys, tracking, revocation capability
- Keys generated with crypto.randomBytes(32)
- Database keys hashed with bcrypt (cost 10)
- Plain key shown only once during creation

**Content Security**:
- HTML tag stripping (XSS prevention)
- Script tag removal
- Event handler removal
- URL validation and sanitization
- Spam keyword detection

**Network Security**:
- SSRF protection blocks private IPs (10.x, 172.16-31.x, 192.168.x)
- Blocks localhost, 127.0.0.1, cloud metadata endpoints
- Validates URL protocol (https only for external)
- Blocks URLs with embedded credentials

### Troubleshooting

**Issue**: API returns 401 Unauthorized
- Check NEWS_API_KEY in .env matches request header
- Verify environment variable is loaded (restart dev server)
- For production, verify environment variable in Vercel

**Issue**: Duplicate post error
- Same URL submitted within last 24 hours
- Wait 24 hours or use different URL
- Delete old post manually if needed

**Issue**: Open Graph preview not showing
- Twitter/X may block scraping (use VPN or proxy)
- Check sourceUrl is publicly accessible
- Verify image URL is valid and accessible
- Check logs for scraping errors

**Issue**: Rate limit exceeded
- Wait until reset time (check X-RateLimit-Reset header)
- Environment keys: 1000/hour, Database keys: 100/hour
- Consider upgrading to environment key for testing


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

# Database
npx prisma generate        # Generate Prisma client after schema changes
npx prisma migrate dev     # Create and apply database migrations
npx prisma db seed         # Seed database with 120 Knesset members
npx prisma studio          # Open Prisma Studio GUI

# Build & Deploy
pnpm build                 # Build for production
pnpm start                 # Start production server
pnpm lint                  # Run ESLint
```

## Application Architecture

### Database Layer (`prisma/`)

**Schema** (`schema.prisma`):
- `MK` - Knesset members (120 total)
- `PositionHistory` - Audit trail of position changes
- `Admin` - Admin users with bcrypt-hashed passwords
- `Position` enum - SUPPORT | NEUTRAL | AGAINST

**Seeding**: Initial data loaded from `docs/parlament-website/all-mks-list.md`

**Adapter**: Uses `@prisma/adapter-better-sqlite3` for SQLite compatibility with Next.js

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
- Admin layout (`app/admin/layout.tsx`) checks session server-side
- Redirects unauthenticated users to `/login`

### Public Frontend (`app/page.tsx`, `components/`)

**Homepage** - Server-rendered with:
- `StatsDashboard` - Position distribution with color-coded progress bar
- `MKList` (Client Component) - Grid of MK cards with client-side filtering
  - Search by name/faction
  - Filter by position and faction (checkboxes)
  - `FilterPanel` for controls
- `MKCard` - Individual member display with avatar, faction, position badge

### Admin Dashboard (`app/admin/`, `components/admin/`)

**Layout** (`app/admin/layout.tsx`):
- Session verification (redirects to `/login` if not authenticated)
- `AdminHeader` - User info, logout, home link

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
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"      # Change in production!
AUTH_URL="http://localhost:3000"
```

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

### Prisma Better-SQLite3 Adapter
This project uses `@prisma/adapter-better-sqlite3` instead of default Prisma for Next.js compatibility. The adapter is configured in `lib/prisma.ts`.

### NextAuth.js v5 Beta
Using beta version for Next.js 16 App Router compatibility. Session checking is done server-side in layouts.

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

**Test Files**:
- `scripts/test-api-integration.ts` - 13 API tests (100% pass)
- `scripts/test-performance.ts` - 7 performance tests
- `docs/testing/UI_TESTING_CHECKLIST.md` - 90-item manual checklist

**Running Tests**:
```bash
npx tsx scripts/test-api-integration.ts
npx tsx scripts/test-performance.ts
```

**Test Coverage**:
- Authentication and authorization
- Input validation
- CRUD operations
- Rate limiting
- Hebrew content support
- Performance benchmarks

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


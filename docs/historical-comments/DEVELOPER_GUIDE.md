# Historical Comments Developer Implementation Guide

> **📋 For**: Developers working on the Historical Comments system
> **⏱️ Reading time**: 25 minutes
> **🎯 Goal**: Understand architecture, extend features, and maintain code quality

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Deduplication Algorithm](#deduplication-algorithm)
4. [Server Actions](#server-actions)
5. [UI Components](#ui-components)
6. [Testing Strategy](#testing-strategy)
7. [Adding New Features](#adding-new-features)
8. [Performance Optimization](#performance-optimization)
9. [Deployment Checklist](#deployment-checklist)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     External Systems                         │
│  (AI Scrapers, News Aggregators, Manual Submissions)        │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─ REST API (POST/GET)
                │
┌───────────────▼─────────────────────────────────────────────┐
│                    API Route Layer                           │
│  /app/api/historical-comments/route.ts                      │
│  - Authentication (dual mode)                                │
│  - Rate limiting (1000/100 per hour)                        │
│  - Validation (Zod schemas)                                  │
│  - Security (13 layers)                                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─ Server Actions
                │
┌───────────────▼─────────────────────────────────────────────┐
│              Deduplication Service Layer                     │
│  /lib/services/comment-deduplication-service.ts             │
│  - Exact hash matching (SHA-256)                            │
│  - Fuzzy matching (Levenshtein, 85% threshold)              │
│  - 90-day window optimization                               │
│  - UUID group assignment                                     │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─ Prisma ORM
                │
┌───────────────▼─────────────────────────────────────────────┐
│                  Database Layer (PostgreSQL/SQLite)          │
│  - HistoricalComment model (21 fields)                      │
│  - 6 strategic indexes                                       │
│  - Self-referential relations (duplicates)                  │
│  - Cascade delete integrity                                  │
└─────────────────────────────────────────────────────────────┘
                │
                ├─ Server Actions
                │
┌───────────────▼─────────────────────────────────────────────┐
│                     UI Layer (React)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Landing Page (/app/(protected)/page.tsx)          │   │
│  │  - MK Cards with HistoricalCommentIcon             │   │
│  │  - HistoricalCommentsDialog (lazy load)            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Admin Dashboard (/app/(protected)/admin/page.tsx) │   │
│  │  - HistoricalCommentsManager (full CRUD)           │   │
│  │  - Filters, sorting, pagination                     │   │
│  │  - Bulk operations                                   │   │
│  │  - HistoricalCommentDetailDialog                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Comment Submission Flow**:
```
External API Call
    ↓
API Authentication (lib/api-auth.ts)
    ↓
Rate Limiter Check (lib/rate-limit.ts)
    ↓
Request Size Validation (<100KB)
    ↓
Zod Schema Validation (13 rules)
    ↓
Coalition MK Verification (64 members)
    ↓
Content Keyword Validation (recruitment law)
    ↓
Content Hash Generation (SHA-256)
    ↓
Exact Duplicate Check (hash match)
    ↓
Fuzzy Duplicate Check (85% similarity, 90 days)
    ↓
Keyword Extraction (auto)
    ↓
Database Insert (Prisma)
    ↓
UUID Group Assignment (if duplicate)
    ↓
Audit Logging (IP, timestamp, API key)
    ↓
Revalidate Path (/)
    ↓
Return Response (201 Created)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16.0.4 | App Router, Server Components |
| React | 19.2.0 | UI components |
| Database | PostgreSQL (Neon) | Production |
| Database (Dev) | SQLite | Local development |
| ORM | Prisma 7.0.1 | Type-safe database access |
| Validation | Zod | Request validation |
| Authentication | NextAuth.js v5 | Admin sessions |
| Styling | Tailwind CSS v4 | UI styling |
| UI Components | shadcn/ui | Component library |
| Hashing | Node crypto | SHA-256 hashing |
| CSV Parsing | csv-parse 6.1.0 | Bulk import |
| Testing | Jest | Unit tests |
| Type System | TypeScript 5 | Type safety |

---

## Database Schema

### HistoricalComment Model

**Location**: `/prisma/schema.prisma`

```prisma
model HistoricalComment {
  id                Int      @id @default(autoincrement())
  mkId              Int

  // Content fields (3)
  content           String   @db.Text
  contentHash       String   // SHA-256 for exact duplicate detection
  normalizedContent String   @db.Text // Lowercased, whitespace-normalized

  // Source tracking (6)
  sourceUrl         String
  sourcePlatform    String   // "News", "Twitter", etc.
  sourceType        String   // "Primary" or "Secondary"
  sourceName        String?
  sourceCredibility Int      @default(5) // 1-10 scale

  // Classification (3)
  topic             String   @default("IDF_RECRUITMENT")
  keywords          String[]
  isVerified        Boolean  @default(false)

  // Temporal (4)
  commentDate       DateTime // When comment was made
  publishedAt       DateTime // When discovered/published
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Deduplication (2)
  duplicateOf       Int?
  duplicateGroup    String?  // UUID for grouping

  // Media (3)
  imageUrl          String?
  videoUrl          String?
  additionalContext String?  @db.Text

  // Relations
  mk             MK                  @relation(fields: [mkId], references: [id], onDelete: Cascade)
  duplicates     HistoricalComment[] @relation("CommentDuplicates")
  primaryComment HistoricalComment?  @relation("CommentDuplicates", fields: [duplicateOf], references: [id])

  // Indexes (6)
  @@index([mkId])
  @@index([commentDate])
  @@index([contentHash])
  @@index([duplicateGroup])
  @@index([topic])
  @@index([isVerified])

  // Unique constraint
  @@unique([contentHash, sourceUrl])
}
```

### Field Descriptions

**Core Identity**:
- `id`: Auto-increment primary key
- `mkId`: Foreign key to MK table (cascade delete on MK removal)

**Content Fields**:
- `content`: Full comment text (TEXT field, no length limit)
- `contentHash`: SHA-256 hash of trimmed content (64 hex chars)
- `normalizedContent`: Preprocessed for fuzzy matching (lowercase, no punctuation)

**Source Metadata**:
- `sourceUrl`: Original source link (max 2000 chars)
- `sourcePlatform`: Enum-like string (News, Twitter, Facebook, YouTube, Knesset, Interview, Other)
- `sourceType`: Primary (direct quote) or Secondary (reporting)
- `sourceName`: Publication/outlet name (nullable, max 500 chars)
- `sourceCredibility`: 1-10 scale (default 5)

**Classification**:
- `topic`: Currently "IDF_RECRUITMENT" for all (future: multi-topic support)
- `keywords`: String array of extracted keywords (auto-populated)
- `isVerified`: Admin verification flag (default false)

**Temporal Tracking**:
- `commentDate`: When MK made the comment (user-provided)
- `publishedAt`: When comment was published/discovered (user-provided)
- `createdAt`: Database creation timestamp (auto)
- `updatedAt`: Last database update (auto)

**Deduplication**:
- `duplicateOf`: ID of primary comment (null if this is primary)
- `duplicateGroup`: UUID linking all related comments

**Media**:
- `imageUrl`: Associated image link (nullable)
- `videoUrl`: Associated video link (nullable)
- `additionalContext`: Extra notes/context (TEXT, nullable)

### Indexes Explained

**Performance Characteristics**:

1. `@@index([mkId])` - O(log n) MK filtering
   - Used in: `getMKHistoricalComments()`, admin filters
   - Cardinality: ~64 unique values (coalition MKs)

2. `@@index([commentDate])` - O(log n) chronological sorting
   - Used in: Default sort order, recent comments query
   - Selectivity: High (unique timestamps)

3. `@@index([contentHash])` - O(1) exact duplicate detection
   - Used in: Deduplication service, unique constraint
   - Hash collisions: Negligible (SHA-256)

4. `@@index([duplicateGroup])` - O(log n) group lookups
   - Used in: Fetching all duplicates of a comment
   - Cardinality: ~10-20% of total comments have duplicates

5. `@@index([topic])` - O(log n) topic filtering (future use)
   - Currently all "IDF_RECRUITMENT"
   - Prepared for multi-topic expansion

6. `@@index([isVerified])` - O(log n) verification filter
   - Used in: Admin filters, GET API endpoint
   - Cardinality: Boolean (2 values)

**Unique Constraint**:
- `@@unique([contentHash, sourceUrl])` - Prevents exact duplicates from same source
- Compound index: Fast lookups on both fields
- Database-level enforcement: No application-level check needed

### Relations

**MK Relation** (Many-to-One):
```typescript
mk: MK @relation(fields: [mkId], references: [id], onDelete: Cascade)
```
- Each comment belongs to one MK
- Cascade delete: Deleting MK removes all their comments
- Indexed on mkId for fast lookups

**Self-Referential Duplicate Relations**:
```typescript
// Primary comment has many duplicates
duplicates: HistoricalComment[] @relation("CommentDuplicates")

// Duplicate comment references primary
primaryComment: HistoricalComment? @relation("CommentDuplicates", fields: [duplicateOf], references: [id])
```
- `duplicates`: One-to-many (primary → duplicates)
- `primaryComment`: Many-to-one (duplicate → primary)
- Circular reference via named relation ("CommentDuplicates")

**Example Query**:
```typescript
const comment = await prisma.historicalComment.findUnique({
  where: { id: 123 },
  include: {
    mk: true, // Include MK details
    duplicates: { // Include all duplicates
      select: {
        id: true,
        sourceUrl: true,
        sourcePlatform: true,
        publishedAt: true,
      }
    }
  }
});
```

---

## Deduplication Algorithm

### Two-Tier Approach

**Tier 1: Exact Hash Matching (Fast Path)**

**Location**: `/lib/content-hash.ts` - `generateContentHash()`

**Algorithm**:
```typescript
function generateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content.trim())
    .digest('hex');
}
```

**Process**:
1. Trim whitespace from content
2. Generate SHA-256 hash (256-bit / 64 hex chars)
3. Check database for existing hash
4. If match → Instant duplicate detection

**Performance**: O(1) - Single index lookup
**Accuracy**: 100% for identical content
**Use Case**: Exact duplicates (same wording)

**Example**:
```typescript
const content1 = "חוק הגיוס חשוב למדינה";
const hash1 = generateContentHash(content1);
// "a1b2c3d4e5f6789..."

const content2 = "חוק הגיוס חשוב למדינה"; // Identical
const hash2 = generateContentHash(content2);
// "a1b2c3d4e5f6789..." // Same hash!

if (hash1 === hash2) {
  // Exact duplicate detected
}
```

**Tier 2: Fuzzy Matching (Similarity-Based)**

**Location**: `/lib/content-hash.ts` - `normalizeContent()`, `calculateSimilarity()`

**Normalization Algorithm**:
```typescript
function normalizeContent(content: string): string {
  return content
    .toLowerCase()                                      // Case-insensitive
    .replace(/\s+/g, ' ')                              // Collapse whitespace
    .replace(/[.,!?;:"'()[\]{}]/g, '')                 // Remove punctuation
    .replace(/\b(את|של|על|אל|עם|ל|מ|ב|כ|ה|ש|ו)\b/g, '') // Remove Hebrew particles
    .trim();
}
```

**Levenshtein Distance Algorithm**:
```typescript
function calculateSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix with edit distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // Deletion
        matrix[i][j - 1] + 1,     // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  // Convert distance to similarity ratio (0-1)
  const maxLen = Math.max(len1, len2);
  return 1 - (matrix[len1][len2] / maxLen);
}
```

**Process**:
1. Normalize both content strings
2. Calculate Levenshtein distance (edit operations)
3. Convert to similarity ratio (0 = different, 1 = identical)
4. If similarity ≥ 0.85 (85%) → Duplicate

**Performance**: O(n × m) where n, m are string lengths
**Optimization**: Limited to 90-day window (reduces comparisons)
**Accuracy**: ~95% for near-duplicates (tunable threshold)

**Example**:
```typescript
const content1 = "חוק הגיוס הוא חוק חשוב למדינת ישראל";
const content2 = "חוק הגיוס הינו חוק חשוב למדינת ישראל";

const norm1 = normalizeContent(content1);
// "חוק גיוס חוק חשוב למדינת ישראל"

const norm2 = normalizeContent(content2);
// "חוק גיוס חוק חשוב למדינת ישראל"

const similarity = calculateSimilarity(norm1, norm2);
// 0.98 (98% similar) → Duplicate!
```

### 90-Day Window Optimization

**Location**: `/lib/services/comment-deduplication-service.ts`

**Rationale**:
- Performance: Prevents O(n²) comparisons as database grows
- Relevance: Comments >90 days apart unlikely to be duplicates
- Scalability: Linear growth instead of quadratic

**Implementation**:
```typescript
const DUPLICATE_WINDOW_DAYS = 90;

const windowStart = new Date(commentDate);
windowStart.setDate(windowStart.getDate() - DUPLICATE_WINDOW_DAYS);

const recentComments = await prisma.historicalComment.findMany({
  where: {
    mkId,
    contentHash: { not: hash }, // Exclude exact hash matches
    commentDate: { gte: windowStart }, // Last 90 days
  },
  select: {
    id: true,
    content: true,
    normalizedContent: true,
  },
});

// Compare only with recentComments
for (const existing of recentComments) {
  const similarity = calculateSimilarity(normalizedContent, existing.normalizedContent);
  if (similarity >= SIMILARITY_THRESHOLD) {
    return { isDuplicate: true, duplicateOf: existing.id, similarity };
  }
}
```

**Trade-offs**:
- ✅ Fast: O(n) instead of O(n²)
- ✅ Scalable: Works with millions of comments
- ❌ Misses old duplicates (acceptable for our use case)

### UUID Group Assignment

**Location**: `/lib/services/comment-deduplication-service.ts` - `linkDuplicate()`

**Purpose**: Link all related duplicates together

**Algorithm**:
```typescript
async function linkDuplicate(
  newCommentId: number,
  existingCommentId: number,
  similarity: number
): Promise<void> {
  // Get existing comment's UUID group (or create new one)
  const existingComment = await prisma.historicalComment.findUnique({
    where: { id: existingCommentId },
    select: { duplicateGroup: true },
  });

  const uuid = existingComment.duplicateGroup || randomUUID();

  // Link new comment to existing
  await prisma.historicalComment.update({
    where: { id: newCommentId },
    data: {
      duplicateOf: existingCommentId,
      duplicateGroup: uuid,
    },
  });

  // Ensure existing comment has the UUID
  if (!existingComment.duplicateGroup) {
    await prisma.historicalComment.update({
      where: { id: existingCommentId },
      data: { duplicateGroup: uuid },
    });
  }
}
```

**Example Scenario**:
```
Comment A (Twitter):  id=1, duplicateOf=null, duplicateGroup="abc-123"
Comment B (Ynet):     id=2, duplicateOf=1,    duplicateGroup="abc-123"
Comment C (Facebook): id=3, duplicateOf=1,    duplicateGroup="abc-123"

Query: "Get all comments in group abc-123"
Result: [A, B, C]
```

### Tuning Parameters

**Similarity Threshold** (Default: 0.85):
```typescript
const SIMILARITY_THRESHOLD = 0.85; // 85%
```
- **Higher** (0.90): Fewer false positives, more duplicates missed
- **Lower** (0.80): More false positives, catches more duplicates
- **Recommended**: 0.85 (balanced)

**Window Size** (Default: 90 days):
```typescript
const DUPLICATE_WINDOW_DAYS = 90;
```
- **Larger** (180): More duplicates detected, slower
- **Smaller** (30): Faster, misses more duplicates
- **Recommended**: 90 (good balance)

**Modification Example**:
```typescript
// For stricter matching (fewer duplicates)
const SIMILARITY_THRESHOLD = 0.90;
const DUPLICATE_WINDOW_DAYS = 60;

// For looser matching (more duplicates)
const SIMILARITY_THRESHOLD = 0.80;
const DUPLICATE_WINDOW_DAYS = 120;
```

---

## Server Actions

### User-Facing Actions

**Location**: `/app/actions/historical-comment-actions.ts`

#### 1. getMKHistoricalComments(mkId, limit)

**Purpose**: Get primary comments for specific MK with duplicate info

**Implementation**:
```typescript
export async function getMKHistoricalComments(
  mkId: number,
  limit: number = 50
): Promise<HistoricalCommentData[]> {
  const comments = await commentDeduplicationService.getPrimaryComments(mkId, limit);
  return comments as HistoricalCommentData[];
}
```

**Usage**:
```typescript
// In HistoricalCommentsDialog.tsx
const comments = await getMKHistoricalComments(mkId, 50);
```

**Performance**: O(log n) with mkId index + limit
**Returns**: Array of primary comments (duplicates excluded)

#### 2. getMKHistoricalCommentCount(mkId)

**Purpose**: Count comments for MK (for badge display)

**Implementation**:
```typescript
export async function getMKHistoricalCommentCount(mkId: number): Promise<number> {
  return await prisma.historicalComment.count({
    where: {
      mkId,
      duplicateOf: null, // Exclude duplicates
    },
  });
}
```

**Performance**: O(1) with count optimization
**Optimization**: Uses database COUNT aggregate (fast)

#### 3. getHistoricalCommentCounts(mkIds[])

**Purpose**: Batch count for multiple MKs (landing page)

**Implementation**:
```typescript
export async function getHistoricalCommentCounts(
  mkIds: number[]
): Promise<Record<number, number>> {
  const counts = await prisma.historicalComment.groupBy({
    by: ['mkId'],
    where: {
      mkId: { in: mkIds },
      duplicateOf: null,
    },
    _count: true,
  });

  return counts.reduce((acc, item) => {
    acc[item.mkId] = item._count;
    return acc;
  }, {} as Record<number, number>);
}
```

**Performance**: Single query for all MKs (O(n))
**Optimization**: groupBy instead of N individual queries

#### 4. getRecentHistoricalComments(limit)

**Purpose**: Latest comments across all MKs (admin dashboard)

**Implementation**:
```typescript
export async function getRecentHistoricalComments(
  limit: number = 20
): Promise<HistoricalCommentData[]> {
  const comments = await prisma.historicalComment.findMany({
    where: { duplicateOf: null },
    include: {
      mk: { select: { id: true, nameHe: true, faction: true } },
    },
    orderBy: { commentDate: 'desc' },
    take: limit,
  });

  return comments as HistoricalCommentData[];
}
```

**Performance**: O(log n) with commentDate index

### Admin Actions

#### 5. verifyHistoricalComment(commentId)

**Implementation**:
```typescript
export async function verifyHistoricalComment(commentId: number): Promise<boolean> {
  try {
    await prisma.historicalComment.update({
      where: { id: commentId },
      data: { isVerified: true },
    });
    revalidatePath('/admin');
    return true;
  } catch (error) {
    console.error('Error verifying comment:', error);
    return false;
  }
}
```

**Transaction**: Not needed (single update)
**Revalidation**: Triggers admin page refresh

#### 6. bulkVerifyComments(commentIds[])

**Implementation**:
```typescript
export async function bulkVerifyComments(commentIds: number[]): Promise<number> {
  const result = await prisma.historicalComment.updateMany({
    where: { id: { in: commentIds } },
    data: { isVerified: true },
  });
  revalidatePath('/admin');
  return result.count;
}
```

**Performance**: Single updateMany (faster than loop)
**Max**: 50 comments recommended (client-side limit)

#### 7-11. Other Admin Actions

See `/app/actions/historical-comment-actions.ts` for:
- `deleteHistoricalComment(id)` - Remove comment
- `bulkDeleteComments(ids[])` - Batch deletion
- `getHistoricalCommentStats()` - Dashboard statistics
- `getAllHistoricalComments(filters, pagination)` - Admin table
- `getHistoricalCommentById(id)` - Detail view

---

## UI Components

### Component Hierarchy

```
HistoricalCommentIcon (MK Card)
    └─ onClick → Opens HistoricalCommentsDialog
        └─ HistoricalCommentCard (list)
            └─ Platform badge, content, source link

HistoricalCommentsManager (Admin Dashboard)
    ├─ Statistics Cards
    ├─ Platform Breakdown
    ├─ Filter Panel
    ├─ Comments Table
    │   ├─ Individual Actions (verify, delete, view)
    │   └─ Bulk Actions (verify all, delete all)
    └─ HistoricalCommentDetailDialog
        └─ Full metadata, duplicate list
```

### Key Components

**HistoricalCommentIcon.tsx** (45 lines):
- Displays on MK cards when count > 0
- Badge with comment count
- Click → Opens dialog
- Client component (useState for dialog)

**HistoricalCommentsDialog.tsx** (95 lines):
- Modal dialog
- Lazy loads comments on open
- Scrollable list (max 50)
- Loading and empty states

**HistoricalCommentsManager.tsx** (540 lines):
- Full admin interface
- 4 statistics cards
- Platform breakdown
- Comprehensive filtering
- Sortable table
- Bulk operations
- Client component (complex state)

**HistoricalCommentDetailDialog.tsx** (180 lines):
- Full comment details
- All metadata fields
- Duplicate list
- Formatted timestamps
- Platform badges

### State Management Patterns

**Local State** (useState):
```typescript
const [comments, setComments] = useState<HistoricalCommentData[]>([]);
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState({
  search: '',
  mkId: null,
  platform: [],
  verified: 'all',
});
```

**Server Actions** (async):
```typescript
useEffect(() => {
  if (open) {
    setLoading(true);
    getMKHistoricalComments(mkId, 50)
      .then(setComments)
      .finally(() => setLoading(false));
  }
}, [open, mkId]);
```

**Optimistic Updates**:
```typescript
// Delete comment
const optimisticComments = comments.filter(c => c.id !== commentId);
setComments(optimisticComments);

deleteHistoricalComment(commentId)
  .then(() => {
    // Success - already updated
  })
  .catch(() => {
    // Revert on error
    setComments(comments);
  });
```

---

## Testing Strategy

### Test Suite Structure

```
__tests__/
├── app/actions/historical-comment-actions.test.ts (23 tests)
├── lib/services/comment-deduplication-service.test.ts (28 tests)
├── lib/content-hash.test.ts (18 tests)
├── app/api/historical-comments/route.test.ts (19 tests)
└── components/historical-comments/*.test.tsx (10 tests)
```

### Writing New Tests

**Unit Test Example**:
```typescript
describe('generateContentHash', () => {
  it('should generate consistent hash for same content', () => {
    const content = 'חוק הגיוס חשוב';
    const hash1 = generateContentHash(content);
    const hash2 = generateContentHash(content);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different content', () => {
    const hash1 = generateContentHash('חוק הגיוס');
    const hash2 = generateContentHash('גיוס חרדים');
    expect(hash1).not.toBe(hash2);
  });
});
```

**Integration Test Example**:
```typescript
describe('POST /api/historical-comments', () => {
  it('should create comment and detect duplicate', async () => {
    // Create first comment
    const comment1 = await submitComment({ /* data */ });
    expect(comment1.isDuplicate).toBe(false);

    // Create duplicate
    const comment2 = await submitComment({ /* same data */ });
    expect(comment2.isDuplicate).toBe(true);
    expect(comment2.duplicateOf).toBe(comment1.id);
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Specific suite
npm test historical-comment-actions.test.ts

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Coverage threshold: 98%
```

---

## Adding New Features

### Adding New Platform

**1. Update Zod Schema** (`app/api/historical-comments/route.ts`):
```typescript
sourcePlatform: z.enum([
  'News',
  'Twitter',
  'Facebook',
  'YouTube',
  'Knesset',
  'Interview',
  'Other',
  'LinkedIn', // Add new platform
]),
```

**2. Add Icon** (`lib/comment-constants.ts`):
```typescript
export const PLATFORM_ICONS: Record<string, string> = {
  News: 'newspaper',
  Twitter: 'twitter',
  // ... existing
  LinkedIn: 'linkedin', // Add icon
};
```

**3. Add Color** (`lib/comment-constants.ts`):
```typescript
export const PLATFORM_COLORS: Record<string, string> = {
  News: 'bg-green-100 text-green-800',
  Twitter: 'bg-blue-100 text-blue-800',
  // ... existing
  LinkedIn: 'bg-cyan-100 text-cyan-800', // Add color
};
```

**4. Update Filter UI** (`components/admin/HistoricalCommentsManager.tsx`):
```typescript
const platforms = [
  'ידיעות',
  'טוויטר',
  // ... existing
  'לינקדאין', // Add Hebrew label
];
```

### Adding New Filter

**1. Add State** (`HistoricalCommentsManager.tsx`):
```typescript
const [sourceCredibility, setSourceCredibility] = useState<number | null>(null);
```

**2. Add UI Control**:
```tsx
<Select
  value={sourceCredibility?.toString() || 'all'}
  onValueChange={(value) => setSourceCredibility(value === 'all' ? null : parseInt(value))}
>
  <SelectTrigger>
    <SelectValue placeholder="כל רמות האמינות" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">הכל</SelectItem>
    <SelectItem value="8">אמינות גבוהה (8-10)</SelectItem>
    <SelectItem value="5">אמינות בינונית (5-7)</SelectItem>
    <SelectItem value="3">אמינות נמוכה (1-4)</SelectItem>
  </SelectContent>
</Select>
```

**3. Update Server Action** (`historical-comment-actions.ts`):
```typescript
export async function getAllHistoricalComments(
  filters: {
    // ... existing
    sourceCredibility?: number;
  }
) {
  const where: any = {};

  // ... existing filters

  if (filters.sourceCredibility) {
    if (filters.sourceCredibility >= 8) {
      where.sourceCredibility = { gte: 8 };
    } else if (filters.sourceCredibility >= 5) {
      where.sourceCredibility = { gte: 5, lt: 8 };
    } else {
      where.sourceCredibility = { lt: 5 };
    }
  }

  // ... rest of query
}
```

### Modifying Deduplication Logic

**Adjust Threshold** (`lib/services/comment-deduplication-service.ts`):
```typescript
// Stricter matching (fewer duplicates)
const SIMILARITY_THRESHOLD = 0.90; // Change from 0.85

// More lenient matching (more duplicates)
const SIMILARITY_THRESHOLD = 0.80; // Change from 0.85
```

**Adjust Window** (`lib/services/comment-deduplication-service.ts`):
```typescript
// Larger window (more comparisons)
const DUPLICATE_WINDOW_DAYS = 180; // Change from 90

// Smaller window (faster)
const DUPLICATE_WINDOW_DAYS = 30; // Change from 90
```

**Test Changes**:
```bash
npm test comment-deduplication-service.test.ts
```

---

## Performance Optimization

### Database Query Optimization

**✅ Use Indexes**:
```typescript
// Good: Uses mkId index
where: { mkId: 1, duplicateOf: null }

// Bad: No index on sourceName
where: { sourceName: 'Ynet' }
```

**✅ Limit Results**:
```typescript
// Good: Pagination
take: 50, skip: offset

// Bad: Fetch all
// (no take/skip)
```

**✅ Select Only Needed Fields**:
```typescript
// Good
select: { id: true, content: true, sourceUrl: true }

// Bad
// (fetches all 21 fields)
```

**✅ Use groupBy for Counts**:
```typescript
// Good: Single query
const counts = await prisma.historicalComment.groupBy({
  by: ['mkId'],
  _count: true,
});

// Bad: N queries
for (const mkId of mkIds) {
  const count = await prisma.historicalComment.count({ where: { mkId } });
}
```

### Caching Strategies

**Server Components** (automatic):
```typescript
// Cached until revalidation
export default async function Page() {
  const comments = await getMKHistoricalComments(1, 50);
  return <CommentList comments={comments} />;
}
```

**Revalidation** (after mutations):
```typescript
import { revalidatePath } from 'next/cache';

async function deleteComment(id: number) {
  await prisma.historicalComment.delete({ where: { id } });
  revalidatePath('/admin'); // Clear cache
}
```

**Client-Side** (React state):
```typescript
// Cache in state to avoid refetching
const [comments, setComments] = useState<HistoricalCommentData[]>([]);

useEffect(() => {
  if (comments.length === 0) {
    fetchComments().then(setComments);
  }
}, []); // Only fetch once
```

### Memory Management

**Pagination** (prevent large result sets):
```typescript
const limit = 50; // Max per page
const offset = page * limit;

const comments = await prisma.historicalComment.findMany({
  where,
  take: limit,
  skip: offset,
});
```

**Streaming** (for large datasets):
```typescript
// Use cursor-based pagination
const comments = await prisma.historicalComment.findMany({
  take: 50,
  skip: 1,
  cursor: { id: lastCommentId },
  orderBy: { id: 'asc' },
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run TypeScript compilation: `npm run build`
- [ ] Run all tests: `npm test` (98 tests passing)
- [ ] Check ESLint: `npm run lint`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Run database migrations: `npx prisma migrate deploy`

### Environment Variables

- [ ] Set `NEWS_API_KEY` in production (Vercel)
- [ ] Set `DATABASE_URL` (Neon PostgreSQL)
- [ ] Set `AUTH_SECRET` (generate new: `openssl rand -base64 32`)
- [ ] Set `AUTH_URL` (production domain)

### Database Setup

- [ ] Run migrations on production database
- [ ] Seed coalition MKs if needed
- [ ] Verify database connection
- [ ] Check indexes are created

### API Configuration

- [ ] Test API endpoints with production URL
- [ ] Verify rate limiting works (1000/100 per hour)
- [ ] Check CORS headers for allowed domains
- [ ] Test authentication with production API key

### Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure audit log monitoring
- [ ] Set up performance monitoring
- [ ] Create alerts for rate limit exceeded

### Post-Deployment

- [ ] Verify landing page loads
- [ ] Test admin dashboard
- [ ] Submit test comment via API
- [ ] Check duplicate detection works
- [ ] Verify filters and sorting
- [ ] Test bulk operations

---

**Last Updated**: 2025-01-18
**Version**: 1.0
**Author**: EL HADEGEL Development Team

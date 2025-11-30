# Phase 1: Database Schema Design - gal-database Agent

**Agent**: gal-database (Database Architecture Specialist)
**Phase**: 1 of 7
**Dependencies**: None (foundation phase)
**Blocks**: All other phases

---

## Objective

Design and implement the `HistoricalComment` Prisma model for tracking coalition Knesset members' public statements about the IDF recruitment law, with intelligent deduplication capabilities.

## Context

**Project**: Hebrew RTL Next.js 16 app with Prisma/PostgreSQL
**Existing Schema**: `/Users/haim/Projects/el-hadegel/prisma/schema.prisma`
**Coalition Members**: 64 MKs across 6 parties (defined in `lib/coalition-utils.ts`)
**Similar Feature**: Tweet tracking system (see `Tweet` model in schema)

## Requirements

### 1. Create HistoricalComment Model

Add the following model to `prisma/schema.prisma`:

```prisma
// Historical comments/statements from Knesset members about IDF recruitment law
model HistoricalComment {
  id                 Int       @id @default(autoincrement())
  mkId               Int
  content            String    // Original statement content (max 5000 chars)
  contentHash        String    @unique // SHA-256 hash for exact deduplication
  normalizedContent  String    // Normalized for fuzzy matching
  sourcePlatform     CommentSource
  sourceUrl          String    // Link to original source
  sourceCredibility  Int       // 1-10 scale based on platform
  commentDate        DateTime  // When statement was made
  extractedAt        DateTime  @default(now()) // When we collected it
  isVerified         Boolean   @default(false)
  verifiedBy         String?   // Admin email who verified
  verifiedAt         DateTime?
  duplicateGroupId   String?   // UUID for grouping duplicates
  isPrimarySource    Boolean   @default(true) // Main version in duplicate group
  matchedKeywords    String[]  // Array of matched recruitment law keywords
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  mk MK @relation(fields: [mkId], references: [id], onDelete: Cascade)

  @@index([mkId])
  @@index([commentDate])
  @@index([duplicateGroupId])
  @@index([isVerified])
}

// Source platform enum for historical comments
enum CommentSource {
  KNESSET       // Official Knesset statements (credibility: 10)
  INTERVIEW     // Media interviews (credibility: 8)
  NEWS          // News articles (credibility: 7)
  YOUTUBE       // YouTube videos (credibility: 6)
  TWITTER       // Twitter/X posts (credibility: 5)
  FACEBOOK      // Facebook posts (credibility: 4)
  OTHER         // Other sources (credibility: 3)
}
```

### 2. Update MK Model

Add the relation to the existing `MK` model:

```prisma
model MK {
  // ... existing fields ...

  positionHistory      PositionHistory[]
  tweets               Tweet[]
  statusInfo           MKStatusInfo[]
  historicalComments   HistoricalComment[]  // ADD THIS LINE
}
```

### 3. Key Design Decisions

**Deduplication Strategy**:
- `contentHash`: SHA-256 of original content for exact matching
- `normalizedContent`: Lowercase, whitespace-normalized for fuzzy matching
- `duplicateGroupId`: UUID to group similar comments together
- `isPrimarySource`: Indicates the authoritative version (highest credibility)

**Source Credibility Mapping**:
- Knesset: 10 (official government statements)
- Interview: 8 (verified media quotes)
- News: 7 (journalistic sources)
- YouTube: 6 (video evidence)
- Twitter: 5 (social media)
- Facebook: 4 (social media)
- Other: 3 (unverified)

**Verification Workflow**:
- `isVerified`: Admin approval flag
- `verifiedBy`: Audit trail of who verified
- `verifiedAt`: Timestamp for verification

**Content Classification**:
- `matchedKeywords`: Array of Hebrew recruitment law keywords found in content
  - Examples: "חוק גיוס", "גיוס חרדים", "recruitment law", "הסדר גיוס"

## Acceptance Criteria

- [ ] Schema compiles without TypeScript errors
- [ ] Migration runs successfully on local SQLite database
- [ ] Prisma Client generates correct types for HistoricalComment
- [ ] No conflicts with existing models (MK, Tweet, NewsPost, etc.)
- [ ] All indexes are created correctly
- [ ] MK relation includes historicalComments array
- [ ] CommentSource enum has all 7 values

## Database Migration Steps

1. **Add model to schema**: Edit `prisma/schema.prisma`
2. **Generate migration**: Run `npx prisma migrate dev --name add_historical_comments`
3. **Verify migration**: Check `prisma/migrations/` for new migration file
4. **Generate Prisma Client**: Run `npx prisma generate`
5. **Verify types**: Check that TypeScript recognizes new model

## Deliverables

Please provide:

1. **Updated schema file**: Complete `schema.prisma` with new model
2. **Migration status**: Output from migration command showing success
3. **Generated types**: Confirmation that Prisma Client regenerated
4. **Verification**: Test query showing model is accessible

Example verification query:
```typescript
import { prisma } from '@/lib/prisma';

// This should compile without errors
const count = await prisma.historicalComment.count();
console.log(`HistoricalComment model ready: ${count} records`);
```

## Notes

- Use PostgreSQL-compatible types (already configured in schema)
- Follow existing naming conventions (camelCase for fields, PascalCase for models)
- Maintain RTL/Hebrew compatibility (UTF-8 encoding)
- Ensure cascade deletes work properly (if MK deleted, comments deleted)

---

**Next Phase**: Phase 2 (Backend utilities) depends on this schema being in place.

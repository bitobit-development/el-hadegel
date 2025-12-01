# Database Schema - Law Commenting System

## Overview

The Law Commenting System uses **Neon PostgreSQL** with **Prisma ORM** for type-safe database access. This document describes the database schema, relationships, indexes, and migration strategy.

## Entity Relationship Diagram

```
┌─────────────────┐
│   LawDocument   │
│─────────────────│
│ id (PK)         │
│ title           │
│ description     │
│ version         │
│ isActive        │
│ publishedAt     │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │ 1:N
         │
┌────────▼────────────┐
│   LawParagraph      │
│─────────────────────│
│ id (PK)             │
│ documentId (FK)     │
│ orderIndex          │
│ sectionTitle        │
│ content             │
│ createdAt           │
│ updatedAt           │
└────────┬────────────┘
         │ 1:N
         │
┌────────▼──────────────┐         ┌──────────────┐
│      LawComment       │   N:1   │    Admin     │
│───────────────────────│◄────────┤──────────────│
│ id (PK)               │         │ id (PK)      │
│ paragraphId (FK)      │         │ email        │
│ firstName             │         │ password     │
│ lastName              │         │ name         │
│ email                 │         │ createdAt    │
│ phoneNumber           │         └──────────────┘
│ commentContent        │
│ suggestedEdit         │
│ status (ENUM)         │
│ moderatedBy (FK)      │
│ moderatedAt           │
│ moderationNote        │
│ ipAddress             │
│ userAgent             │
│ submittedAt           │
│ updatedAt             │
└───────────────────────┘
```

## Tables

### 1. LawDocument

Stores the active law document (IDF Recruitment Law).

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `title` | String | No | - | Document title (Hebrew) |
| `description` | Text | Yes | - | Optional description |
| `version` | String | No | "1.0" | Version number (e.g., "1.0", "2.0") |
| `isActive` | Boolean | No | true | Only one document should be active |
| `publishedAt` | DateTime | No | now() | Publication date |
| `createdAt` | DateTime | No | now() | Creation timestamp |
| `updatedAt` | DateTime | No | Auto | Last update timestamp |

**Indexes**:
- `@@index([isActive])` - Fast lookup of active document
- `@@index([publishedAt])` - Chronological ordering

**Sample Data**:
```sql
INSERT INTO "LawDocument" (title, description, version, "isActive", "publishedAt")
VALUES (
  'חוק יסוד: שירות חובה למען המדינה',
  'חוק המגדיר את חובת השירות הצבאי והאזרחי במדינת ישראל',
  '1.0',
  true,
  NOW()
);
```

---

### 2. LawParagraph

Individual paragraphs/sections of the law document.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `documentId` | Int | No | - | Foreign key to LawDocument |
| `orderIndex` | Int | No | - | Sequential order (1, 2, 3...) |
| `sectionTitle` | String | Yes | - | Section heading (e.g., "מטרה") |
| `content` | Text | No | - | Paragraph text content |
| `createdAt` | DateTime | No | now() | Creation timestamp |
| `updatedAt` | DateTime | No | Auto | Last update timestamp |

**Constraints**:
- `@@unique([documentId, orderIndex])` - One paragraph per order index per document

**Indexes**:
- `@@index([documentId])` - Fast document filtering
- `@@index([orderIndex])` - Ordered retrieval

**Relations**:
- `document`: Belongs to one `LawDocument` (cascade delete)
- `comments`: Has many `LawComment` records

**Sample Data**:
```sql
INSERT INTO "LawParagraph" ("documentId", "orderIndex", "sectionTitle", content)
VALUES
  (1, 1, 'מטרה', 'מטרתו של חוק זה להסדיר את חובת השירות...'),
  (1, 2, 'הגדרות', 'בחוק זה: "שירות חובה" - שירות צבאי או אזרחי...'),
  (1, 3, 'חובת השירות', 'כל אזרח ישראלי חייב בשירות חובה...');
```

---

### 3. LawComment

Public comments on law paragraphs with moderation workflow.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `paragraphId` | Int | No | - | Foreign key to LawParagraph |
| **Visitor Information** |
| `firstName` | String | No | - | First name (Hebrew/English) |
| `lastName` | String | No | - | Last name (Hebrew/English) |
| `email` | String | No | - | Email address (lowercase) |
| `phoneNumber` | String | No | - | Israeli phone (050-1234567) |
| **Comment Content** |
| `commentContent` | Text | No | - | Comment text (10-5000 chars) |
| `suggestedEdit` | Text | Yes | - | Optional paragraph edit suggestion |
| **Moderation** |
| `status` | Enum | No | PENDING | PENDING \| APPROVED \| REJECTED \| SPAM |
| `moderatedBy` | Int | Yes | - | Foreign key to Admin |
| `moderatedAt` | DateTime | Yes | - | Moderation timestamp |
| `moderationNote` | Text | Yes | - | Admin notes (for rejection) |
| **Metadata** |
| `ipAddress` | String | Yes | - | Requester IP (spam prevention) |
| `userAgent` | Text | Yes | - | Browser user agent |
| `submittedAt` | DateTime | No | now() | Submission timestamp |
| `updatedAt` | DateTime | No | Auto | Last update timestamp |

**Indexes**:
- `@@index([paragraphId])` - Fast paragraph filtering
- `@@index([status])` - Fast status filtering (APPROVED, PENDING)
- `@@index([submittedAt])` - Chronological sorting
- `@@index([email])` - Duplicate detection

**Relations**:
- `paragraph`: Belongs to one `LawParagraph` (cascade delete)
- `moderator`: Optionally belongs to one `Admin`

**Status Lifecycle**:
```
PENDING (default)
   ↓
   ├─→ APPROVED (visible to public)
   ├─→ REJECTED (hidden, admin can review)
   └─→ SPAM (flagged for analysis)
```

**Sample Data**:
```sql
INSERT INTO "LawComment" (
  "paragraphId", "firstName", "lastName", email, "phoneNumber",
  "commentContent", status, "ipAddress", "userAgent"
)
VALUES (
  1,
  'דוד',
  'כהן',
  'david@example.com',
  '050-1234567',
  'אני תומך בחוק זה מכיוון שהוא מקדם שוויון בנטל.',
  'PENDING',
  '192.168.1.1',
  'Mozilla/5.0...'
);
```

---

### 4. Admin

Administrator users who can moderate comments.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | Int | No | Auto-increment | Primary key |
| `email` | String | No | - | Admin email (unique) |
| `password` | String | No | - | bcrypt hash |
| `name` | String | No | - | Display name |
| `createdAt` | DateTime | No | now() | Creation timestamp |

**Constraints**:
- `@@unique([email])` - One admin per email

**Relations**:
- `lawComments`: Has many moderated `LawComment` records

**Sample Data**:
```sql
-- Password: Tsitsi2025!! (hashed with bcrypt)
INSERT INTO "Admin" (email, password, name)
VALUES (
  'admin@elhadegel.co.il',
  '$2a$10$hashedPasswordHere',
  'מנהל ראשי'
);
```

---

## Enums

### CommentStatus

```prisma
enum CommentStatus {
  PENDING      // Default - awaiting moderation
  APPROVED     // Visible to public
  REJECTED     // Not visible, kept for admin review
  SPAM         // Flagged for pattern analysis
}
```

**Usage**:
- **PENDING**: All new comments start here
- **APPROVED**: Admin approves → visible on public page
- **REJECTED**: Admin rejects with optional reason
- **SPAM**: Automatically flagged or manually marked

---

## Relationships

### One-to-Many

1. **LawDocument → LawParagraph**
   - One document has many paragraphs
   - Cascade delete: Deleting document deletes all paragraphs

2. **LawParagraph → LawComment**
   - One paragraph has many comments
   - Cascade delete: Deleting paragraph deletes all comments

3. **Admin → LawComment**
   - One admin can moderate many comments
   - No cascade: Deleting admin keeps comments (moderatedBy becomes null)

### Cascade Behavior

```typescript
// When document is deleted
LawDocument (deleted)
  └─→ LawParagraphs (cascade deleted)
       └─→ LawComments (cascade deleted)

// When admin is deleted
Admin (deleted)
  └─→ LawComments (moderatedBy set to null)
```

---

## Indexes

### Purpose of Each Index

| Table | Index | Purpose |
|-------|-------|---------|
| `LawDocument` | `[isActive]` | Fast retrieval of active document |
| `LawDocument` | `[publishedAt]` | Chronological ordering |
| `LawParagraph` | `[documentId]` | Fast paragraph lookup for document |
| `LawParagraph` | `[orderIndex]` | Sequential ordering |
| `LawComment` | `[paragraphId]` | Filter comments by paragraph |
| `LawComment` | `[status]` | Admin filtering (PENDING, APPROVED) |
| `LawComment` | `[submittedAt]` | Chronological sorting (newest first) |
| `LawComment` | `[email]` | Duplicate detection |

### Query Performance

**Fast** (uses index):
```sql
-- Get approved comments for paragraph
SELECT * FROM "LawComment"
WHERE "paragraphId" = 1 AND status = 'APPROVED'
ORDER BY "submittedAt" DESC;
```

**Slow** (no index, avoid):
```sql
-- Full table scan on firstName
SELECT * FROM "LawComment"
WHERE "firstName" LIKE '%דוד%';
```

---

## Migrations

### Migration History

Located in `/prisma/migrations/`:

```
20251130215131_add_law_commenting_system/
└── migration.sql
```

### Creating New Migration

```bash
# Make changes to prisma/schema.prisma
npx prisma migrate dev --name descriptive_migration_name

# Example: Add optional field
npx prisma migrate dev --name add_comment_rating_field
```

### Migration Best Practices

1. **Always backup** production database before applying migrations
2. **Test migrations** on local/staging first
3. **Use descriptive names**: `add_X`, `remove_Y`, `modify_Z`
4. **Avoid breaking changes** in production (use multi-step migrations)

### Rollback Migration (Use with Caution)

```bash
# Reset database to specific migration
npx prisma migrate resolve --rolled-back "20251130215131_add_law_commenting_system"

# Full reset (DANGER: deletes all data)
npx prisma migrate reset
```

---

## Seeding Strategy

Seed script location: `/prisma/seed.ts`

**What Gets Seeded**:
1. Law document (IDF Recruitment Law v1.0)
2. 7 paragraphs with Hebrew content
3. 1 admin user (default credentials)
4. (Optional) Sample comments for testing

**Running Seed**:
```bash
npx prisma db seed
```

**Seed Data Sources**:
- Law paragraphs: Manually curated Hebrew content
- Admin user: Hardcoded credentials (change in production!)

---

## Data Validation

### Database Level

**Constraints**:
- `NOT NULL` on required fields
- `UNIQUE` on email, document orderIndex
- `FOREIGN KEY` with cascade rules
- `DEFAULT` values for status, timestamps

### Application Level (Zod)

**Validation Schemas** (`/lib/validation/law-comment-validation.ts`):

```typescript
commentSubmissionSchema:
  - firstName: 2-100 chars, Hebrew/English only
  - lastName: 2-100 chars, Hebrew/English only
  - email: Valid email format, max 255 chars
  - phoneNumber: Israeli format (050-1234567, +972-50-1234567)
  - commentContent: 10-5000 chars
  - suggestedEdit: Optional, max 5000 chars
```

---

## Performance Considerations

### Query Optimization

**Use Prisma Includes** (single query):
```typescript
const comments = await prisma.lawComment.findMany({
  where: { status: 'APPROVED' },
  include: {
    paragraph: {
      include: { document: true },
    },
  },
});
```

**Avoid N+1 Queries**:
```typescript
// Bad: Fetches paragraph for each comment separately
const comments = await prisma.lawComment.findMany();
for (const comment of comments) {
  const paragraph = await prisma.lawParagraph.findUnique({
    where: { id: comment.paragraphId },
  });
}
```

### Pagination

Always use `take` and `skip` for large result sets:

```typescript
const comments = await prisma.lawComment.findMany({
  where: { status: 'APPROVED' },
  orderBy: { submittedAt: 'desc' },
  take: 50,    // Limit
  skip: 0,     // Offset
});
```

---

## Database Backups

### Neon PostgreSQL

**Automatic Backups**:
- Neon provides automatic daily backups (retention: 7 days)
- Point-in-time recovery available

**Manual Export**:
```bash
# Using pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20251201.sql
```

### Local Development (SQLite)

```bash
# Backup
cp prisma/dev.db prisma/dev.db.backup

# Restore
cp prisma/dev.db.backup prisma/dev.db
```

---

## Schema Versioning

Current schema version: **v1.0** (2025-12-01)

### Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-12-01 | Initial Law Commenting System |
| - | - | Added LawDocument, LawParagraph, LawComment tables |
| - | - | Added CommentStatus enum |
| - | - | Integrated with existing Admin table |

---

## Future Schema Enhancements

Potential additions (not yet implemented):

1. **Comment Voting**:
   ```prisma
   model CommentVote {
     id        Int      @id @default(autoincrement())
     commentId Int
     userId    String   // Anonymous user ID
     voteType  String   // "up" or "down"
     createdAt DateTime @default(now())

     comment LawComment @relation(fields: [commentId], references: [id], onDelete: Cascade)

     @@unique([commentId, userId])
   }
   ```

2. **Comment Replies**:
   ```prisma
   model LawComment {
     // ... existing fields
     parentId Int?
     parent   LawComment?  @relation("CommentReplies", fields: [parentId], references: [id])
     replies  LawComment[] @relation("CommentReplies")
   }
   ```

3. **Notification Subscriptions**:
   ```prisma
   model CommentSubscription {
     id          Int      @id @default(autoincrement())
     paragraphId Int
     email       String
     isActive    Boolean  @default(true)
     createdAt   DateTime @default(now())

     paragraph LawParagraph @relation(fields: [paragraphId], references: [id])

     @@unique([paragraphId, email])
   }
   ```

---

## Additional Resources

- **Prisma Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Prisma Client API**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- **PostgreSQL Data Types**: https://www.postgresql.org/docs/current/datatype.html
- **Neon Documentation**: https://neon.tech/docs

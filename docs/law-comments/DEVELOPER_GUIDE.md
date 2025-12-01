# Developer Guide - Law Commenting System

## Overview

The Law Commenting System allows the Israeli public to submit comments on individual paragraphs of the IDF Recruitment Law. Comments go through a moderation workflow before being published. This guide covers development setup, workflows, and common tasks.

## Prerequisites

- **Node.js**: v18+ (v20+ recommended)
- **pnpm**: v8+ (package manager)
- **Database**: Neon PostgreSQL account (or local PostgreSQL)
- **Git**: For version control
- **Code Editor**: VS Code recommended with Prisma extension

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/el-hadegel.git
cd el-hadegel
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create `.env` file in project root:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgres://[user]:[password]@[host]/[database]?sslmode=require"

# Authentication
AUTH_SECRET="your-secret-key"  # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Feature Flags
NEXT_PUBLIC_ENABLE_STATUS_INFO="true"

# API Keys (optional for testing)
NEWS_API_KEY="your-api-key-here"
```

⚠️ **Important**: Never commit `.env` to Git. It's already in `.gitignore`.

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate deploy

# Seed database with initial data
npx prisma db seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Application runs at: http://localhost:3000

## Project Structure

```
el-hadegel/
├── app/
│   ├── (protected)/
│   │   ├── law-document/          # Public law viewer page
│   │   │   └── page.tsx
│   │   └── admin/
│   │       └── law-comments/      # Admin moderation dashboard
│   │           └── page.tsx
│   └── actions/
│       └── law-comment-actions.ts # Server actions (11 functions)
├── components/
│   ├── law-document/              # Public UI components
│   │   ├── LawDocumentViewer.tsx
│   │   ├── LawParagraphCard.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── CommentCard.tsx
│   │   ├── CommentSubmissionDialog.tsx
│   │   └── CommentsViewDialog.tsx
│   └── admin/
│       └── AdminLawCommentsManager.tsx  # Admin moderation UI
├── lib/
│   ├── security/
│   │   └── law-comment-security.ts    # XSS, spam, duplicate detection
│   ├── validation/
│   │   └── law-comment-validation.ts  # Zod schemas
│   └── rate-limit-law-comments.ts     # Rate limiting (5/hr per IP)
├── types/
│   └── law-comment.ts                 # TypeScript interfaces
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── migrations/                    # Migration history
└── docs/
    └── law-comments/                  # Documentation (you are here)
```

## Key Technologies

- **Framework**: Next.js 16.0.4 (App Router, React Server Components)
- **React**: 19.2.0
- **Database**: Neon PostgreSQL with Prisma ORM 7.0.1
- **Authentication**: NextAuth.js v5 (beta.30)
- **Validation**: Zod for form and data validation
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS v4
- **Language**: Hebrew (RTL layout)

## Development Workflows

### Adding a New Law Document

1. **Create Database Record**:

```typescript
// Use Prisma Studio or script
await prisma.lawDocument.create({
  data: {
    title: "חוק יסוד: שירות חובה למען המדינה",
    description: "תיאור החוק...",
    version: "2.0",
    isActive: true,
    publishedAt: new Date(),
  },
});
```

2. **Add Paragraphs**:

```typescript
// Use seed script or manual insertion
await prisma.lawParagraph.createMany({
  data: [
    {
      documentId: 1,
      orderIndex: 1,
      sectionTitle: "מטרה",
      content: "תוכן הפסקה...",
    },
    // ... more paragraphs
  ],
});
```

3. **Deactivate Old Document** (optional):

```typescript
await prisma.lawDocument.update({
  where: { id: oldDocumentId },
  data: { isActive: false },
});
```

### Testing Comment Submission Flow

1. **Start dev server**: `pnpm dev`
2. **Navigate to**: http://localhost:3000/law-document
3. **Click "הוסף תגובה"** on any paragraph card
4. **Fill form** with valid data:
   - First Name: שם (Hebrew or English)
   - Last Name: משפחה
   - Email: test@example.com
   - Phone: 050-1234567 (Israeli format)
   - Comment: At least 10 characters
5. **Submit** - Comment goes to PENDING status
6. **Login as admin**: http://localhost:3000/login
   - Default: `admin@elhadegel.co.il` / `Tsitsi2025!!`
7. **Moderate**: http://localhost:3000/admin/law-comments
   - Approve, Reject, or Delete comments

### Creating Test Data

**Script to Create 10 Test Comments**:

```typescript
// scripts/create-test-comments.ts
import prisma from '@/lib/prisma';

async function createTestComments() {
  // Get first paragraph
  const paragraph = await prisma.lawParagraph.findFirst({
    orderBy: { orderIndex: 'asc' },
  });

  if (!paragraph) {
    throw new Error('No paragraphs found');
  }

  // Create 10 test comments
  for (let i = 1; i <= 10; i++) {
    await prisma.lawComment.create({
      data: {
        paragraphId: paragraph.id,
        firstName: `משתמש`,
        lastName: `מס׳ ${i}`,
        email: `test${i}@example.com`,
        phoneNumber: `050-123456${i}`,
        commentContent: `זוהי תגובת בדיקה מספר ${i}. תוכן התגובה כולל לפחות 10 תווים.`,
        status: i % 3 === 0 ? 'APPROVED' : 'PENDING', // Every 3rd comment approved
        ipAddress: `192.168.1.${i}`,
        userAgent: 'Test Script',
      },
    });
  }

  console.log('✅ Created 10 test comments');
}

createTestComments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run**:
```bash
npx tsx scripts/create-test-comments.ts
```

### Modifying Validation Rules

Edit `/lib/validation/law-comment-validation.ts`:

```typescript
// Example: Change comment minimum length
commentContent: z.string({ message: 'תוכן התגובה נדרש' })
  .min(20, { message: 'תגובה חייבת להכיל לפחות 20 תווים' }) // Changed from 10
  .max(5000, { message: 'תגובה ארוכה מדי (מקסימום 5000 תווים)' })
  .transform(val => val.trim()),
```

### Adjusting Rate Limits

Edit `/lib/rate-limit-law-comments.ts`:

```typescript
this.config = {
  ipLimit: config?.ipLimit ?? 10, // Changed from 5
  emailLimit: config?.emailLimit ?? 20, // Changed from 10
  windowMs: config?.windowMs ?? 60 * 60 * 1000, // 1 hour
};
```

### Adding New Comment Status

1. **Update Prisma Schema** (`prisma/schema.prisma`):

```prisma
enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
  SPAM
  FLAGGED  // New status
}
```

2. **Run Migration**:

```bash
npx prisma migrate dev --name add_flagged_status
```

3. **Update Types** (`types/law-comment.ts`):

```typescript
export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  PENDING: 'ממתין לאישור',
  APPROVED: 'אושר',
  REJECTED: 'נדחה',
  SPAM: 'ספאם',
  FLAGGED: 'מסומן לבדיקה', // New label
};

export const COMMENT_STATUS_COLORS: Record<CommentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  SPAM: 'bg-gray-100 text-gray-800 border-gray-300',
  FLAGGED: 'bg-purple-100 text-purple-800 border-purple-300', // New color
};
```

4. **Add Server Action** (`app/actions/law-comment-actions.ts`):

```typescript
export async function flagComment(
  commentId: number,
  adminId: number
): Promise<ServerActionResponse> {
  try {
    const admin = await verifyAdminSession();
    if (admin.id !== adminId) {
      throw new Error('אין הרשאה לביצוע פעולה זו');
    }

    await prisma.lawComment.update({
      where: { id: commentId },
      data: {
        status: 'FLAGGED',
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    revalidatePath('/admin/law-comments');

    return {
      success: true,
      message: 'התגובה סומנה לבדיקה',
    };
  } catch (error) {
    console.error('Error flagging comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בסימון התגובה',
    };
  }
}
```

5. **Update Admin UI** - Add button in `AdminLawCommentsManager.tsx`

## Common Development Tasks

### 1. View Database in GUI

```bash
npx prisma studio
```

Opens at: http://localhost:5555

### 2. Reset Database

⚠️ **Danger**: Deletes all data!

```bash
npx prisma migrate reset
```

### 3. View Server Logs

Development server logs appear in terminal where you ran `pnpm dev`.

### 4. Debug Rate Limiting

Check current rate limit status:

```typescript
// In any server action
import { getCommentRateLimiter } from '@/lib/rate-limit-law-comments';

const rateLimiter = getCommentRateLimiter();
console.log(rateLimiter.getStatus());
// Output: { ipTracking: 3, emailTracking: 5, config: {...} }
```

### 5. Clear Rate Limits for Testing

```typescript
// Reset specific IP or email
rateLimiter.resetLimit('ip', '192.168.1.1');
rateLimiter.resetLimit('email', 'test@example.com');
```

### 6. Export Comments to CSV

```typescript
// scripts/export-comments.ts
import prisma from '@/lib/prisma';
import { writeFileSync } from 'fs';

async function exportComments() {
  const comments = await prisma.lawComment.findMany({
    where: { status: 'APPROVED' },
    include: {
      paragraph: {
        include: { document: true },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  const csv = [
    ['ID', 'שם', 'דוא״ל', 'פסקה', 'תגובה', 'תאריך'].join(','),
    ...comments.map(c => [
      c.id,
      `${c.firstName} ${c.lastName}`,
      c.email,
      c.paragraph.orderIndex,
      `"${c.commentContent.replace(/"/g, '""')}"`, // Escape quotes
      c.submittedAt.toISOString(),
    ].join(',')),
  ].join('\n');

  writeFileSync('comments-export.csv', '\uFEFF' + csv, 'utf-8'); // UTF-8 BOM for Excel
  console.log('✅ Exported to comments-export.csv');
}

exportComments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Debugging Tips

### Issue: Comment Submission Fails Silently

**Check**:
1. Browser console for JavaScript errors
2. Network tab for failed API requests
3. Server terminal for error logs
4. Database connection (Prisma Studio)

### Issue: Comments Not Appearing After Approval

**Solution**: Check revalidation is working:
```typescript
// In server action after approval
revalidatePath('/law-document'); // Public view
revalidatePath('/admin/law-comments'); // Admin table
```

### Issue: Hebrew Text Not Displaying

**Check**:
1. Database charset is UTF-8
2. HTML has `lang="he"` and `dir="rtl"`
3. Rubik font loaded with Hebrew subset
4. Text uses `text-right` class

### Issue: Rate Limiting Not Working

**Check**:
1. IP extraction from headers (proxies/load balancers may affect this)
2. Rate limiter singleton is initialized
3. Cleanup interval is running

### Issue: Spam Detection Too Aggressive

**Solution**: Adjust thresholds in `/lib/security/law-comment-security.ts`:
```typescript
// Example: Allow more URLs
if (urls.length > 5) { // Changed from 2
  return { isSpam: true, reason: '...' };
}
```

## Performance Optimization

### Database Indexes

Current indexes on `LawComment`:
- `@@index([paragraphId])` - Fast paragraph filtering
- `@@index([status])` - Fast status filtering
- `@@index([submittedAt])` - Chronological sorting
- `@@index([email])` - Duplicate detection

### Query Optimization

**Good** (single query with join):
```typescript
const comments = await prisma.lawComment.findMany({
  where: { status: 'APPROVED' },
  include: { paragraph: true }, // Join in single query
});
```

**Bad** (N+1 queries):
```typescript
const comments = await prisma.lawComment.findMany({
  where: { status: 'APPROVED' },
});

// Then fetching paragraph for each comment in loop
for (const comment of comments) {
  const paragraph = await prisma.lawParagraph.findUnique({
    where: { id: comment.paragraphId },
  });
}
```

### Caching Strategy

- **Server Components**: Automatically cached by Next.js
- **revalidatePath()**: Clears cache after mutations
- **Rate Limiter**: In-memory Map with automatic cleanup

## Testing Checklist

- [ ] Comment submission with valid data succeeds
- [ ] Comment submission with invalid data shows errors
- [ ] Phone validation accepts Israeli formats
- [ ] Email validation rejects malformed emails
- [ ] XSS attempts are sanitized
- [ ] Spam detection blocks obvious spam
- [ ] Duplicate detection prevents resubmission
- [ ] Rate limiting blocks excessive submissions
- [ ] Admin can approve comments
- [ ] Admin can reject comments with reason
- [ ] Admin can delete comments permanently
- [ ] Bulk approve/reject works (max 100 items)
- [ ] Statistics dashboard shows correct counts
- [ ] Filters work (status, paragraph, search, date)
- [ ] Pagination works correctly
- [ ] Hebrew text displays properly (RTL)
- [ ] Approved comments appear on public page
- [ ] Comment count badges update after moderation

## Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Zod Validation**: https://zod.dev
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

## Getting Help

- Check `docs/law-comments/TROUBLESHOOTING.md` for common issues
- Review `docs/law-comments/API_REFERENCE.md` for Server Actions
- See `docs/law-comments/COMPONENTS.md` for UI components
- Contact: dev@elhadegel.co.il

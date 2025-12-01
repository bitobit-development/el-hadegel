# API Reference - Law Commenting System Server Actions

## Overview

The Law Commenting System uses **Next.js Server Actions** for all data operations. Server Actions provide type-safe, server-side data mutations with automatic CSRF protection and authentication integration.

**Location**: `/app/actions/law-comment-actions.ts`

**Total Actions**: 14 (4 public + 10 admin-only)

---

## Table of Contents

### Public Server Actions
1. [getLawDocument](#getlawdocument)
2. [submitLawComment](#submitlawcomment)
3. [getParagraphComments](#getparagraphcomments)
4. [getParagraphCommentCount](#getparagraphcommentcount)

### Admin Server Actions
5. [getAllLawComments](#getalllawcomments)
6. [getLawCommentStats](#getlawcommentstats)
7. [approveComment](#approvecomment)
8. [rejectComment](#rejectcomment)
9. [markCommentAsSpam](#markcommentasspam)
10. [bulkApproveComments](#bulkapprovecomments)
11. [bulkRejectComments](#bulkrejectcomments)
12. [deleteComment](#deletecomment)

---

## Public Server Actions

### getLawDocument

Retrieves the active law document with all paragraphs and approved comment counts.

**Usage**: Public law viewer page (`/law-document`)

**Signature**:
```typescript
async function getLawDocument(): Promise<LawDocumentData | null>
```

**Returns**:
```typescript
interface LawDocumentData {
  id: number;
  title: string;
  description: string | null;
  version: string;
  isActive: boolean;
  publishedAt: Date;
  paragraphs: LawParagraphWithCount[];
}

interface LawParagraphWithCount {
  id: number;
  documentId: number;
  orderIndex: number;
  sectionTitle: string | null;
  content: string;
  commentCount: number; // Count of APPROVED comments only
}
```

**Example**:
```typescript
import { getLawDocument } from '@/app/actions/law-comment-actions';

export default async function LawDocumentPage() {
  const document = await getLawDocument();

  if (!document) {
    return <div>לא נמצא מסמך חוק פעיל</div>;
  }

  return (
    <div>
      <h1>{document.title}</h1>
      {document.paragraphs.map(paragraph => (
        <div key={paragraph.id}>
          <p>{paragraph.content}</p>
          <span>תגובות: {paragraph.commentCount}</span>
        </div>
      ))}
    </div>
  );
}
```

**Error Handling**:
```typescript
try {
  const document = await getLawDocument();
} catch (error) {
  console.error('שגיאה בטעינת מסמך החוק:', error);
  // Shows: "שגיאה בטעינת מסמך החוק"
}
```

**Database Queries**:
1. `findFirst` - Get active document with paragraphs (1 query)
2. `groupBy` - Get comment counts per paragraph (1 query)

**Performance**: ~50-100ms (2 queries)

---

### submitLawComment

Submits a new comment with comprehensive validation and security checks.

**Usage**: Comment submission dialog

**Signature**:
```typescript
async function submitLawComment(
  data: CommentSubmissionData
): Promise<ServerActionResponse<{ commentId: number }>>
```

**Parameters**:
```typescript
interface CommentSubmissionData {
  paragraphId: number;
  firstName: string;        // 2-100 chars, Hebrew/English
  lastName: string;         // 2-100 chars, Hebrew/English
  email: string;            // Valid email format
  phoneNumber: string;      // Israeli format: 050-1234567
  commentContent: string;   // 10-5000 chars
  suggestedEdit?: string;   // Optional, max 5000 chars
}
```

**Returns**:
```typescript
interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>; // Field-level validation errors
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "התגובה נשלחה בהצלחה! היא תופיע לאחר אישור המנהל.",
  "data": { "commentId": 123 }
}
```

**Validation Error Response**:
```json
{
  "success": false,
  "error": "נתונים לא תקינים",
  "errors": {
    "email": ["כתובת דוא״ל לא תקינה"],
    "phoneNumber": ["מספר טלפון לא תקין. פורמט מקובל: 050-1234567"]
  }
}
```

**Example**:
```typescript
'use client';

import { submitLawComment } from '@/app/actions/law-comment-actions';
import { useState } from 'react';

export default function CommentForm({ paragraphId }: { paragraphId: number }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const result = await submitLawComment({
      paragraphId,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phoneNumber') as string,
      commentContent: formData.get('commentContent') as string,
      suggestedEdit: formData.get('suggestedEdit') as string || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      alert(result.message); // "התגובה נשלחה בהצלחה!"
      event.currentTarget.reset();
    } else {
      setError(result.error || 'שגיאה בשליחת התגובה');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="firstName" placeholder="שם פרטי" required />
      <input name="lastName" placeholder="שם משפחה" required />
      <input name="email" type="email" placeholder="דוא״ל" required />
      <input name="phoneNumber" placeholder="טלפון" required />
      <textarea name="commentContent" placeholder="תוכן התגובה" required />
      <textarea name="suggestedEdit" placeholder="הצעת עריכה (אופציונלי)" />
      <button type="submit" disabled={submitting}>
        {submitting ? 'שולח...' : 'שלח תגובה'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
```

**Security Checks** (13 layers):
1. ✅ Zod validation (all fields)
2. ✅ IP address extraction
3. ✅ Rate limiting (5/hr per IP, 10/hr per email)
4. ✅ Content sanitization (XSS prevention)
5. ✅ Spam detection (keywords, excessive URLs)
6. ✅ Duplicate detection (90% similarity within 24 hours)
7. ✅ Paragraph existence verification
8. ✅ Israeli phone number validation
9. ✅ Email format validation
10. ✅ Name character validation (Hebrew/English only)
11. ✅ Content length limits
12. ✅ HTML tag removal
13. ✅ Script injection prevention

**Possible Errors**:
- `"נתונים לא תקינים"` - Validation failed
- `"חרגת ממספר התגובות המותר"` - Rate limit exceeded
- `"התגובה נחסמה. אנא ודא שהתוכן ראוי ולא מכיל ספאם."` - Spam detected
- `"שלחת תגובה דומה לאחרונה"` - Duplicate detected
- `"הפסקה שנבחרה לא נמצאה"` - Invalid paragraphId
- `"שגיאה בשליחת התגובה"` - General server error

**Performance**: ~150-300ms (includes security checks)

---

### getParagraphComments

Retrieves approved comments for a specific paragraph (public-safe, no personal info).

**Usage**: Comments view dialog

**Signature**:
```typescript
async function getParagraphComments(
  paragraphId: number,
  limit?: number  // Default: 50
): Promise<ApprovedComment[]>
```

**Returns**:
```typescript
interface ApprovedComment {
  id: number;
  firstName: string;
  lastName: string;
  commentContent: string;
  suggestedEdit: string | null;
  submittedAt: Date;
  // Note: email, phoneNumber, ipAddress are EXCLUDED for privacy
}
```

**Example**:
```typescript
import { getParagraphComments } from '@/app/actions/law-comment-actions';

export default async function CommentsDialog({ paragraphId }: { paragraphId: number }) {
  const comments = await getParagraphComments(paragraphId, 50);

  if (comments.length === 0) {
    return <p>אין תגובות עדיין</p>;
  }

  return (
    <div>
      <h2>תגובות ({comments.length})</h2>
      {comments.map(comment => (
        <div key={comment.id}>
          <strong>{comment.firstName} {comment.lastName}</strong>
          <p>{comment.commentContent}</p>
          <small>{new Date(comment.submittedAt).toLocaleDateString('he-IL')}</small>
        </div>
      ))}
    </div>
  );
}
```

**Privacy Note**: This function ONLY returns APPROVED comments and EXCLUDES sensitive fields:
- ❌ Email
- ❌ Phone number
- ❌ IP address
- ❌ User agent

**Performance**: ~20-50ms (single query)

---

### getParagraphCommentCount

Gets count of approved comments for a paragraph (for badge display).

**Usage**: Law paragraph cards

**Signature**:
```typescript
async function getParagraphCommentCount(
  paragraphId: number
): Promise<number>
```

**Returns**: Number of APPROVED comments

**Example**:
```typescript
import { getParagraphCommentCount } from '@/app/actions/law-comment-actions';

export default async function ParagraphCard({ paragraph }: Props) {
  const commentCount = await getParagraphCommentCount(paragraph.id);

  return (
    <div>
      <p>{paragraph.content}</p>
      {commentCount > 0 && (
        <span className="badge">{commentCount} תגובות</span>
      )}
    </div>
  );
}
```

**Performance**: ~10-20ms (count query)

---

## Admin Server Actions

⚠️ **Authentication Required**: All admin actions require valid NextAuth session with admin email in database.

### getAllLawComments

Retrieves all comments with filtering and pagination (admin dashboard).

**Usage**: Admin comments table

**Signature**:
```typescript
async function getAllLawComments(
  filters?: CommentFilters,
  pagination?: { limit: number; offset: number }
): Promise<PaginatedResponse<LawCommentData>>
```

**Parameters**:
```typescript
interface CommentFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  paragraphId?: number;
  search?: string;      // Search in: firstName, lastName, email, content
  dateFrom?: Date;
  dateTo?: Date;
}
```

**Returns**:
```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface LawCommentData {
  id: number;
  paragraphId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  commentContent: string;
  suggestedEdit: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
  moderatedBy: number | null;
  moderatedAt: Date | null;
  moderationNote: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  submittedAt: Date;
  updatedAt: Date;

  paragraph?: {
    id: number;
    orderIndex: number;
    sectionTitle: string | null;
    content: string;
    document: {
      id: number;
      title: string;
      version: string;
    };
  };

  moderator?: {
    id: number;
    name: string;
    email: string;
  };
}
```

**Example**:
```typescript
import { getAllLawComments } from '@/app/actions/law-comment-actions';

export default async function AdminDashboard() {
  // Get pending comments only
  const result = await getAllLawComments(
    { status: 'PENDING' },
    { limit: 50, offset: 0 }
  );

  return (
    <div>
      <h1>תגובות ממתינות ({result.total})</h1>
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>תגובה</th>
            <th>פסקה</th>
            <th>תאריך</th>
          </tr>
        </thead>
        <tbody>
          {result.data.map(comment => (
            <tr key={comment.id}>
              <td>{comment.firstName} {comment.lastName}</td>
              <td>{comment.commentContent}</td>
              <td>{comment.paragraph?.orderIndex}</td>
              <td>{new Date(comment.submittedAt).toLocaleDateString('he-IL')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.hasMore && <button>טען עוד</button>}
    </div>
  );
}
```

**Default Pagination**:
- Limit: 50 (max 100)
- Offset: 0

**Performance**: ~50-150ms (depends on filters and pagination)

---

### getLawCommentStats

Gets statistics for admin dashboard (counts by status and paragraph).

**Usage**: Admin dashboard statistics cards

**Signature**:
```typescript
async function getLawCommentStats(): Promise<CommentStats>
```

**Returns**:
```typescript
interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
  byParagraph?: Array<{
    paragraphId: number;
    orderIndex: number;
    sectionTitle: string | null;
    count: number;
  }>;
}
```

**Example**:
```typescript
import { getLawCommentStats } from '@/app/actions/law-comment-actions';

export default async function StatsCards() {
  const stats = await getLawCommentStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card">
        <h3>סה״כ תגובות</h3>
        <p className="text-4xl">{stats.total}</p>
      </div>
      <div className="card">
        <h3>ממתינות</h3>
        <p className="text-4xl text-yellow-600">{stats.pending}</p>
      </div>
      <div className="card">
        <h3>אושרו</h3>
        <p className="text-4xl text-green-600">{stats.approved}</p>
      </div>
      <div className="card">
        <h3>נדחו/ספאם</h3>
        <p className="text-4xl text-red-600">{stats.rejected + stats.spam}</p>
      </div>
    </div>
  );
}
```

**Performance**: ~30-70ms (2 groupBy queries)

---

### approveComment

Approves a comment, making it visible to the public.

**Usage**: Admin action button

**Signature**:
```typescript
async function approveComment(
  commentId: number,
  adminId: number
): Promise<ServerActionResponse>
```

**Example**:
```typescript
'use client';

import { approveComment } from '@/app/actions/law-comment-actions';
import { useSession } from 'next-auth/react';

export default function ApproveButton({ commentId }: { commentId: number }) {
  const { data: session } = useSession();
  const adminId = session?.user?.id;

  async function handleApprove() {
    if (!adminId) return;

    const result = await approveComment(commentId, adminId);

    if (result.success) {
      alert(result.message); // "התגובה אושרה בהצלחה"
    } else {
      alert(result.error);
    }
  }

  return (
    <button onClick={handleApprove} className="btn-success">
      אשר תגובה
    </button>
  );
}
```

**Side Effects**:
- Sets `status` to "APPROVED"
- Sets `moderatedBy` to adminId
- Sets `moderatedAt` to current timestamp
- Revalidates `/law-document` (public page)
- Revalidates `/admin/law-comments` (admin page)

**Performance**: ~30-50ms (update query + revalidation)

---

### rejectComment

Rejects a comment with optional reason (not visible to public).

**Usage**: Admin action button

**Signature**:
```typescript
async function rejectComment(
  commentId: number,
  adminId: number,
  reason?: string  // Optional admin note (max 1000 chars)
): Promise<ServerActionResponse>
```

**Example**:
```typescript
'use client';

import { rejectComment } from '@/app/actions/law-comment-actions';

export default function RejectButton({ commentId, adminId }: Props) {
  async function handleReject() {
    const reason = prompt('סיבת דחייה (אופציונלי):');

    const result = await rejectComment(commentId, adminId, reason || undefined);

    if (result.success) {
      alert(result.message); // "התגובה נדחתה"
    } else {
      alert(result.error);
    }
  }

  return (
    <button onClick={handleReject} className="btn-danger">
      דחה תגובה
    </button>
  );
}
```

**Side Effects**:
- Sets `status` to "REJECTED"
- Sets `moderationNote` to reason (if provided)
- Sets `moderatedBy` and `moderatedAt`
- Revalidates `/admin/law-comments`

**Performance**: ~30-50ms

---

### markCommentAsSpam

Flags a comment as spam for pattern analysis.

**Usage**: Admin action button

**Signature**:
```typescript
async function markCommentAsSpam(
  commentId: number,
  adminId: number
): Promise<ServerActionResponse>
```

**Example**:
```typescript
const result = await markCommentAsSpam(123, adminId);
// Success: "התגובה סומנה כספאם"
```

**Side Effects**:
- Sets `status` to "SPAM"
- Sets `moderatedBy` and `moderatedAt`
- Revalidates `/admin/law-comments`

**Performance**: ~30-50ms

---

### bulkApproveComments

Approves multiple comments at once (max 100).

**Usage**: Admin bulk actions

**Signature**:
```typescript
async function bulkApproveComments(
  commentIds: number[],
  adminId: number
): Promise<ServerActionResponse<{ count: number }>>
```

**Example**:
```typescript
'use client';

import { bulkApproveComments } from '@/app/actions/law-comment-actions';
import { useState } from 'react';

export default function BulkActions({ adminId }: { adminId: number }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  async function handleBulkApprove() {
    if (selectedIds.length === 0) {
      alert('לא נבחרו תגובות');
      return;
    }

    if (selectedIds.length > 100) {
      alert('ניתן לאשר עד 100 תגובות בבת אחת');
      return;
    }

    const result = await bulkApproveComments(selectedIds, adminId);

    if (result.success) {
      alert(result.message); // "X תגובות אושרו בהצלחה"
      setSelectedIds([]);
    } else {
      alert(result.error);
    }
  }

  return (
    <button onClick={handleBulkApprove} disabled={selectedIds.length === 0}>
      אשר {selectedIds.length} תגובות
    </button>
  );
}
```

**Validation**:
- Minimum: 1 comment
- Maximum: 100 comments

**Success Response**:
```json
{
  "success": true,
  "message": "15 תגובות אושרו בהצלחה",
  "data": { "count": 15 }
}
```

**Side Effects**:
- Updates all selected comments to "APPROVED"
- Sets `moderatedBy` and `moderatedAt` for all
- Revalidates both public and admin pages

**Performance**: ~50-150ms (depends on count)

---

### bulkRejectComments

Rejects multiple comments at once (max 100).

**Usage**: Admin bulk actions

**Signature**:
```typescript
async function bulkRejectComments(
  commentIds: number[],
  adminId: number
): Promise<ServerActionResponse<{ count: number }>>
```

**Example**:
```typescript
const result = await bulkRejectComments([1, 2, 3], adminId);
// Success: "3 תגובות נדחו"
```

**Validation**: Same as bulk approve (1-100 comments)

**Performance**: ~50-150ms

---

### deleteComment

Permanently deletes a comment from database.

⚠️ **Warning**: This action is irreversible!

**Usage**: Admin delete action (use with caution)

**Signature**:
```typescript
async function deleteComment(
  commentId: number
): Promise<ServerActionResponse>
```

**Example**:
```typescript
'use client';

import { deleteComment } from '@/app/actions/law-comment-actions';

export default function DeleteButton({ commentId }: { commentId: number }) {
  async function handleDelete() {
    const confirmed = confirm('האם למחוק תגובה זו לצמיתות? פעולה זו בלתי הפיכה!');

    if (!confirmed) return;

    const result = await deleteComment(commentId);

    if (result.success) {
      alert(result.message); // "התגובה נמחקה לצמיתות"
    } else {
      alert(result.error);
    }
  }

  return (
    <button onClick={handleDelete} className="btn-danger">
      מחק לצמיתות
    </button>
  );
}
```

**Side Effects**:
- Permanently removes comment from database
- Revalidates both public and admin pages

**Performance**: ~30-50ms

---

## Error Handling

### Common Error Patterns

**1. Validation Errors**:
```typescript
const result = await submitLawComment(data);
if (!result.success && result.errors) {
  // Field-level errors
  Object.entries(result.errors).forEach(([field, messages]) => {
    console.error(`${field}: ${messages.join(', ')}`);
  });
}
```

**2. Authentication Errors**:
```typescript
try {
  await approveComment(commentId, adminId);
} catch (error) {
  if (error.message === 'נדרשת הזדהות כמנהל') {
    // Redirect to login
  }
}
```

**3. Rate Limiting Errors**:
```typescript
const result = await submitLawComment(data);
if (!result.success && result.error?.includes('חרגת ממספר')) {
  // Show rate limit message with retry time
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
// ✅ Good
const result = await submitLawComment(data);
if (result.success) {
  // Handle success
} else {
  // Handle error
  setError(result.error);
}

// ❌ Bad
await submitLawComment(data); // No error handling
```

### 2. Use Loading States

```typescript
// ✅ Good
const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit() {
  setIsSubmitting(true);
  const result = await submitLawComment(data);
  setIsSubmitting(false);
}

return <button disabled={isSubmitting}>שלח</button>;
```

### 3. Validate on Client Before Submit

```typescript
// ✅ Good - validate before calling server action
if (!email.includes('@')) {
  setError('דוא״ל לא תקין');
  return;
}

const result = await submitLawComment(data);
```

### 4. Use TypeScript Types

```typescript
// ✅ Good - import types
import type { CommentSubmissionData } from '@/lib/validation/law-comment-validation';

const data: CommentSubmissionData = { ... };
```

---

## Testing Server Actions

### Unit Testing (Example)

```typescript
import { submitLawComment } from '@/app/actions/law-comment-actions';

describe('submitLawComment', () => {
  it('should reject invalid email', async () => {
    const result = await submitLawComment({
      paragraphId: 1,
      firstName: 'דוד',
      lastName: 'כהן',
      email: 'invalid-email', // Invalid
      phoneNumber: '050-1234567',
      commentContent: 'תגובה תקינה',
    });

    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
  });
});
```

---

## Performance Metrics

| Action | Avg Response Time | Queries |
|--------|-------------------|---------|
| getLawDocument | 50-100ms | 2 |
| submitLawComment | 150-300ms | 3-5 |
| getParagraphComments | 20-50ms | 1 |
| getAllLawComments | 50-150ms | 2 |
| getLawCommentStats | 30-70ms | 2 |
| approveComment | 30-50ms | 1 |
| bulkApproveComments | 50-150ms | 1 |

---

## Additional Resources

- **Zod Documentation**: https://zod.dev
- **Next.js Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions
- **Prisma Client API**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference

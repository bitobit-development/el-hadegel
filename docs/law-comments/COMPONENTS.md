# UI Components - Law Commenting System

## Overview

The Law Commenting System uses React Server Components and Client Components with shadcn/ui library for consistent UI. All components support Hebrew RTL layout.

## Component Tree

```
Law Document Page (/law-document)
├── LawDocumentViewer (Server Component)
│   ├── TableOfContents (Client Component)
│   └── LawParagraphCard (Client Component) × N
│       ├── CommentSubmissionDialog (Client Component)
│       └── CommentsViewDialog (Client Component)
│           └── CommentCard (Server Component) × N

Admin Dashboard (/admin/law-comments)
└── AdminLawCommentsManager (Client Component)
    ├── Statistics Cards
    ├── Filter Panel
    ├── Comments Table
    └── CommentDetailDialog (Client Component)
```

---

## Public Components

### LawDocumentViewer

**Type**: Server Component
**Location**: `/components/law-document/LawDocumentViewer.tsx`

Main container for law document with table of contents and paragraphs.

**Props**:
```typescript
interface Props {
  document: LawDocumentData; // From getLawDocument()
}
```

**Features**:
- Sticky table of contents
- Scroll-to-paragraph navigation
- Responsive layout (sidebar collapse on mobile)
- Hebrew RTL support

**Usage**:
```typescript
import { getLawDocument } from '@/app/actions/law-comment-actions';
import LawDocumentViewer from '@/components/law-document/LawDocumentViewer';

export default async function Page() {
  const document = await getLawDocument();
  if (!document) return <div>לא נמצא חוק</div>;

  return <LawDocumentViewer document={document} />;
}
```

---

### LawParagraphCard

**Type**: Client Component
**Location**: `/components/law-document/LawParagraphCard.tsx`

Individual paragraph card with comment buttons and count badge.

**Props**:
```typescript
interface Props {
  paragraph: LawParagraphWithCount;
  documentTitle: string;
}
```

**State**:
- `showComments: boolean` - Controls CommentsViewDialog
- `showSubmitForm: boolean` - Controls CommentSubmissionDialog

**Features**:
- Paragraph number badge
- Section title (if exists)
- Comment count badge (APPROVED only)
- "הוסף תגובה" button
- "צפה בתגובות" button (if count > 0)
- Scroll anchor (id: `paragraph-${orderIndex}`)

**Example**:
```typescript
<LawParagraphCard
  paragraph={{
    id: 1,
    orderIndex: 1,
    sectionTitle: "מטרה",
    content: "מטרתו של חוק זה...",
    commentCount: 5
  }}
  documentTitle="חוק גיוס חובה"
/>
```

---

### CommentSubmissionDialog

**Type**: Client Component
**Location**: `/components/law-document/CommentSubmissionDialog.tsx`

Modal dialog for submitting new comments.

**Props**:
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  paragraphId: number;
  paragraphTitle: string;
}
```

**State**:
- `formData: CommentSubmissionData`
- `errors: Record<string, string[]>`
- `isSubmitting: boolean`

**Form Fields**:
1. שם פרטי (First Name) - Required, 2-100 chars
2. שם משפחה (Last Name) - Required, 2-100 chars
3. דוא״ל (Email) - Required, valid format
4. טלפון (Phone) - Required, Israeli format
5. תגובה (Comment) - Required, 10-5000 chars
6. הצעת עריכה (Suggested Edit) - Optional, max 5000 chars

**Validation**:
- Client-side: HTML5 + custom validation
- Server-side: Zod schema in `submitLawComment()`

**Example**:
```typescript
const [showDialog, setShowDialog] = useState(false);

<button onClick={() => setShowDialog(true)}>הוסף תגובה</button>

<CommentSubmissionDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  paragraphId={1}
  paragraphTitle="מטרה"
/>
```

---

### CommentsViewDialog

**Type**: Client Component
**Location**: `/components/law-document/CommentsViewDialog.tsx`

Modal dialog displaying approved comments for a paragraph.

**Props**:
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  paragraphId: number;
  paragraphTitle: string;
}
```

**State**:
- `comments: ApprovedComment[]`
- `loading: boolean`

**Features**:
- Lazy loading (fetches on open)
- Scrollable list (max 50 comments)
- Loading skeleton
- Empty state ("אין תגובות עדיין")

**Example**:
```typescript
<CommentsViewDialog
  isOpen={showComments}
  onClose={() => setShowComments(false)}
  paragraphId={1}
  paragraphTitle="מטרה"
/>
```

---

### CommentCard

**Type**: Server Component
**Location**: `/components/law-document/CommentCard.tsx`

Individual comment display card (public view).

**Props**:
```typescript
interface Props {
  comment: ApprovedComment;
}
```

**Features**:
- Commenter name
- Comment content
- Suggested edit (if provided)
- Submission date (Hebrew format)
- Card styling with hover effect

**Example**:
```typescript
<CommentCard
  comment={{
    id: 1,
    firstName: "דוד",
    lastName: "כהן",
    commentContent: "תגובה מעניינת...",
    suggestedEdit: null,
    submittedAt: new Date()
  }}
/>
```

---

### TableOfContents

**Type**: Client Component
**Location**: `/components/law-document/TableOfContents.tsx`

Sticky sidebar navigation for paragraphs.

**Props**:
```typescript
interface Props {
  paragraphs: LawParagraphWithCount[];
}
```

**Features**:
- Click to scroll to paragraph
- Active paragraph highlighting
- Comment count badges
- Mobile collapse
- Sticky positioning

**Example**:
```typescript
<TableOfContents
  paragraphs={[
    { id: 1, orderIndex: 1, sectionTitle: "מטרה", commentCount: 5 },
    { id: 2, orderIndex: 2, sectionTitle: "הגדרות", commentCount: 3 }
  ]}
/>
```

---

## Admin Components

### AdminLawCommentsManager

**Type**: Client Component
**Location**: `/components/admin/AdminLawCommentsManager.tsx`

Complete admin dashboard for comment moderation.

**Props**: None (fetches own data)

**Features**:

1. **Statistics Dashboard**:
   - Total comments
   - Pending (yellow)
   - Approved (green)
   - Rejected/Spam (red)

2. **Filter Panel**:
   - Search (name, email, content)
   - Status dropdown
   - Paragraph selector
   - Date range picker

3. **Comments Table**:
   - Checkbox selection
   - Sortable columns
   - Status badges
   - Action buttons per row

4. **Bulk Actions**:
   - Approve all selected (max 100)
   - Reject all selected
   - Delete all selected

5. **Individual Actions**:
   - Approve
   - Reject (with reason)
   - Mark as Spam
   - Delete permanently
   - View details

**State**:
```typescript
{
  comments: LawCommentData[];
  loading: boolean;
  filters: CommentFilters;
  selectedIds: number[];
  pagination: { limit: 50, offset: 0 };
}
```

**Example Usage**:
```typescript
// app/admin/law-comments/page.tsx
import AdminLawCommentsManager from '@/components/admin/AdminLawCommentsManager';

export default function Page() {
  return (
    <div className="container">
      <h1>ניהול תגובות</h1>
      <AdminLawCommentsManager />
    </div>
  );
}
```

---

### CommentDetailDialog

**Type**: Client Component
**Location**: `/components/admin/CommentDetailDialog.tsx` (part of AdminLawCommentsManager)

Modal showing full comment details (admin view).

**Props**:
```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  comment: LawCommentData | null;
}
```

**Displays**:
- Full name
- Email
- Phone number
- Comment content
- Suggested edit
- IP address
- User agent
- Submission date
- Moderation info (if moderated)
- Paragraph context

**Example**:
```typescript
<CommentDetailDialog
  isOpen={showDetail}
  onClose={() => setShowDetail(false)}
  comment={selectedComment}
/>
```

---

## shadcn/ui Components Used

### Dialog
**Usage**: Comment submission, comment viewing, detail view

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>כותרת</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Button
**Usage**: All action buttons (submit, approve, reject, etc.)

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">אשר</Button>
<Button variant="destructive">מחק</Button>
<Button variant="outline">ביטול</Button>
```

### Input
**Usage**: Form fields, search, filters

```typescript
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="שם פרטי"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
/>
```

### Textarea
**Usage**: Comment content, suggested edit

```typescript
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="כתוב את תגובתך כאן..."
  rows={5}
  value={comment}
  onChange={(e) => setComment(e.target.value)}
/>
```

### Table
**Usage**: Admin comments table

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>שם</TableHead>
      <TableHead>תגובה</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {comments.map(c => (
      <TableRow key={c.id}>
        <TableCell>{c.firstName}</TableCell>
        <TableCell>{c.commentContent}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Badge
**Usage**: Status indicators, comment count

```typescript
import { Badge } from '@/components/ui/badge';

<Badge variant="default">ממתין</Badge>
<Badge variant="success">אושר</Badge>
<Badge variant="destructive">נדחה</Badge>
```

### Checkbox
**Usage**: Bulk selection in admin table

```typescript
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox
  checked={isSelected}
  onCheckedChange={handleCheck}
/>
```

---

## Styling Conventions

### Hebrew RTL Layout

All components use RTL-aware classes:

```tsx
// ✅ Good - RTL-aware
<div className="text-right mr-4 pr-2">
  {content}
</div>

// ❌ Bad - LTR-specific
<div className="text-left ml-4 pl-2">
  {content}
</div>
```

### Tailwind Classes

**Common patterns**:
```css
/* Card container */
.rounded-lg border border-gray-200 bg-white p-6 shadow-sm

/* Button primary */
.bg-blue-600 hover:bg-blue-700 text-white font-medium

/* Status badge */
.inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium

/* Form input */
.w-full rounded-md border border-gray-300 px-3 py-2
```

---

## Component Communication

### Public Flow

```
User clicks "הוסף תגובה"
  ↓
LawParagraphCard sets showSubmitForm = true
  ↓
CommentSubmissionDialog opens
  ↓
User fills form and submits
  ↓
submitLawComment() Server Action
  ↓
Success: Dialog closes, show toast
  ↓
Comment enters PENDING status
```

### Admin Flow

```
Admin logs in
  ↓
AdminLawCommentsManager loads
  ↓
Fetches comments via getAllLawComments()
  ↓
Admin clicks "אשר" on comment
  ↓
approveComment() Server Action
  ↓
Success: Table refreshes
  ↓
Comment visible on public page
```

---

## Accessibility

### Keyboard Navigation
- All dialogs support `Escape` to close
- Form inputs have proper tab order
- Buttons have `aria-label` for screen readers

### ARIA Labels
```tsx
<button aria-label="הוסף תגובה לפסקה 1">
  הוסף תגובה
</button>

<Dialog aria-describedby="comment-dialog-description">
  ...
</Dialog>
```

### Focus Management
- Dialog auto-focuses first input
- Focus returns to trigger button on close
- Focus trap within modal

---

## Performance Optimizations

### Server Components
- LawDocumentViewer, CommentCard use Server Components
- No client-side JavaScript for static content
- Fast initial page load

### Client Components
- Only interactive components marked 'use client'
- Lazy loading of dialogs (data fetched on open)
- Debounced search input

### Memoization
```typescript
// Expensive filtering/sorting
const filteredComments = useMemo(() => {
  return comments.filter(/* ... */);
}, [comments, filters]);
```

---

## Testing Checklist

- [ ] Dialog opens/closes correctly
- [ ] Form validation shows errors
- [ ] Form submission succeeds
- [ ] Comment count updates after approval
- [ ] Table filtering works
- [ ] Bulk actions select/deselect
- [ ] Status badges show correct colors
- [ ] Hebrew text displays RTL
- [ ] Mobile responsive layout
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Component Files Location

```
components/
├── law-document/
│   ├── LawDocumentViewer.tsx      (Server)
│   ├── LawParagraphCard.tsx       (Client)
│   ├── TableOfContents.tsx        (Client)
│   ├── CommentCard.tsx            (Server)
│   ├── CommentSubmissionDialog.tsx (Client)
│   └── CommentsViewDialog.tsx     (Client)
├── admin/
│   └── AdminLawCommentsManager.tsx (Client)
└── ui/                            (shadcn/ui)
    ├── dialog.tsx
    ├── button.tsx
    ├── input.tsx
    ├── textarea.tsx
    ├── table.tsx
    ├── badge.tsx
    └── checkbox.tsx
```

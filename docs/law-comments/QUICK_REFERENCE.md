# Law Comment System - Quick Reference Guide

## Public API (Server Actions)

### Get Law Document
```typescript
import { getLawDocument } from '@/app/actions/law-comment-actions';

const document = await getLawDocument();
// Returns: LawDocumentData | null
// Includes paragraphs with comment counts (APPROVED only)
```

### Submit Comment
```typescript
import { submitLawComment } from '@/app/actions/law-comment-actions';

const result = await submitLawComment({
  paragraphId: 1,
  firstName: "אבי",
  lastName: "כהן",
  email: "test@example.com",
  phoneNumber: "050-1234567",
  commentContent: "תגובה לדוגמה",
  suggestedEdit: "הצעת עריכה (אופציונלי)",
});
// Returns: { success: true, message: "...", data: { commentId } }
//       or { success: false, error: "...", errors: {...} }
```

**Security Flow**:
1. Validation ✅
2. Rate limiting ✅ (5/hour IP, 10/hour email)
3. XSS sanitization ✅
4. Spam detection ✅
5. Duplicate detection ✅
6. Create comment (status: PENDING)

### Get Paragraph Comments
```typescript
import { getParagraphComments } from '@/app/actions/law-comment-actions';

const comments = await getParagraphComments(paragraphId, 50);
// Returns: ApprovedComment[]
// Privacy: NO email, phone, IP included
```

### Get Comment Count
```typescript
import { getParagraphCommentCount } from '@/app/actions/law-comment-actions';

const count = await getParagraphCommentCount(paragraphId);
// Returns: number (APPROVED only)
```

## Admin API (Server Actions)

### Get All Comments (with filters)
```typescript
import { getAllLawComments } from '@/app/actions/law-comment-actions';

const result = await getAllLawComments(
  {
    status: 'PENDING',  // PENDING | APPROVED | REJECTED | SPAM
    paragraphId: 1,     // Optional
    search: "חיפוש",    // Optional (searches name, email, content)
    dateFrom: new Date('2025-01-01'),  // Optional
    dateTo: new Date('2025-12-31'),    // Optional
  },
  { limit: 50, offset: 0 }
);
// Returns: { data: LawCommentData[], total, limit, offset, hasMore }
```

### Get Statistics
```typescript
import { getLawCommentStats } from '@/app/actions/law-comment-actions';

const stats = await getLawCommentStats();
// Returns: {
//   total: 150,
//   pending: 50,
//   approved: 80,
//   rejected: 15,
//   spam: 5,
//   byParagraph: [{ paragraphId, orderIndex, sectionTitle, count }]
// }
```

### Approve Comment
```typescript
import { approveComment } from '@/app/actions/law-comment-actions';

const result = await approveComment(commentId, adminId);
// Returns: { success: true, message: "התגובה אושרה בהצלחה" }
```

### Reject Comment
```typescript
import { rejectComment } from '@/app/actions/law-comment-actions';

const result = await rejectComment(commentId, adminId, "סיבת דחייה");
// Returns: { success: true, message: "התגובה נדחתה" }
```

### Mark as Spam
```typescript
import { markCommentAsSpam } from '@/app/actions/law-comment-actions';

const result = await markCommentAsSpam(commentId, adminId);
// Returns: { success: true, message: "התגובה סומנה כספאם" }
```

### Bulk Operations
```typescript
import { bulkApproveComments, bulkRejectComments } from '@/app/actions/law-comment-actions';

const result = await bulkApproveComments([1, 2, 3], adminId);
// Returns: { success: true, message: "3 תגובות אושרו בהצלחה", data: { count: 3 } }

const result = await bulkRejectComments([4, 5], adminId);
// Returns: { success: true, message: "2 תגובות נדחו", data: { count: 2 } }
// Max: 100 comments per batch
```

### Delete Comment
```typescript
import { deleteComment } from '@/app/actions/law-comment-actions';

const result = await deleteComment(commentId);
// Returns: { success: true, message: "התגובה נמחקה לצמיתות" }
// ⚠️ PERMANENT deletion - use with caution!
```

## Validation

### Comment Submission
```typescript
import { commentSubmissionSchema } from '@/lib/validation/law-comment-validation';

const result = commentSubmissionSchema.safeParse(data);
if (result.success) {
  const validatedData = result.data;
} else {
  const errors = result.error.flatten().fieldErrors;
}
```

**Validation Rules**:
- **firstName**: 2-100 chars, Hebrew/English only
- **lastName**: 2-100 chars, Hebrew/English only
- **email**: Valid email, max 255 chars
- **phoneNumber**: Israeli format (050-1234567, 0501234567, +972-50-1234567, +972501234567)
- **commentContent**: 10-5000 chars
- **suggestedEdit**: Max 5000 chars (optional)

### Israeli Phone Numbers
```typescript
import { isValidIsraeliPhone, normalizeIsraeliPhone } from '@/lib/validation/law-comment-validation';

isValidIsraeliPhone("050-1234567");  // true
isValidIsraeliPhone("+972501234567");  // true
isValidIsraeliPhone("123");  // false

normalizeIsraeliPhone("+972501234567");  // "050-1234567"
```

## Security

### Sanitize Content
```typescript
import { sanitizeCommentContent } from '@/lib/security/law-comment-security';

const clean = sanitizeCommentContent("<script>alert('XSS')</script>Hello");
// Returns: "Hello"
```

### Detect Spam
```typescript
import { detectSpamComment } from '@/lib/security/law-comment-security';

const result = detectSpamComment({
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  commentContent: "Buy viagra now!",
});
// Returns: { isSpam: true, reason: 'תגובה מכילה מילת ספאם חשודה: "viagra"' }
```

### Check Duplicates
```typescript
import { isDuplicateComment } from '@/lib/security/law-comment-security';

const isDupe = await isDuplicateComment(
  "test@example.com",
  1,
  "תגובה לדוגמה"
);
// Returns: true | false (checks last 24 hours, 90% similarity)
```

## Rate Limiting

### Check Rate Limit
```typescript
import { getCommentRateLimiter } from '@/lib/rate-limit-law-comments';

const rateLimiter = getCommentRateLimiter();
const result = rateLimiter.checkRateLimit("192.168.1.1", "test@example.com");

if (result.allowed) {
  // Proceed with comment submission
} else {
  // Show error message
  const error = CommentRateLimiter.formatRateLimitError(
    result.resetAt!,
    result.limit!
  );
  console.log(error);
  // "חרגת ממספר התגובות המותר (5 תגובות לשעה). נסה שוב בעוד 23 דקות."
}
```

**Limits**:
- IP: 5 comments/hour
- Email: 10 comments/hour
- Window: 60 minutes
- Cleanup: Every 5 minutes

## Utility Functions

### Date Formatting
```typescript
import { formatCommentDate, getRelativeCommentTime } from '@/lib/law-comment-utils';

formatCommentDate(new Date());
// "15 בינואר 2025, 14:30"

getRelativeCommentTime(new Date(Date.now() - 5 * 60 * 1000));
// "לפני 5 דקות"
```

### Privacy
```typescript
import { maskEmail, maskPhoneNumber, getInitials } from '@/lib/law-comment-utils';

maskEmail("test@example.com");  // "t***@example.com"
maskPhoneNumber("0501234567");  // "050-***4567"
getInitials("אבי", "כהן");  // "א.ב"
```

### Content
```typescript
import { truncateComment, calculateReadingTime, countWords } from '@/lib/law-comment-utils';

truncateComment("תגובה ארוכה מאוד...", 20);  // "תגובה ארוכה מאוד..."
calculateReadingTime("תוכן ארוך");  // "זמן קריאה: 2 דקות"
countWords("שלוש מילים כאן");  // 3
```

### Status
```typescript
import { getStatusLabel, getStatusBadgeClass } from '@/lib/law-comment-utils';

getStatusLabel('PENDING');  // "ממתין לאישור"
getStatusBadgeClass('APPROVED');  // "bg-green-100 text-green-800 border-green-300"
```

### Paragraph
```typescript
import { getParagraphLabel, getParagraphReference } from '@/lib/law-comment-utils';

getParagraphLabel(5, "מטרה");  // "מטרה"
getParagraphLabel(5, null);  // "סעיף 5"

getParagraphReference(5, "מטרה");  // "סעיף 5: מטרה"
getParagraphReference(5, null);  // "סעיף 5"
```

## TypeScript Types

### Import Types
```typescript
import type {
  LawDocumentData,
  LawParagraphWithCount,
  CommentSubmissionData,
  ApprovedComment,
  LawCommentData,
  CommentFilters,
  CommentStats,
  PaginatedResponse,
  ServerActionResponse,
} from '@/types/law-comment';
```

### Use Constants
```typescript
import { COMMENT_STATUS_LABELS, COMMENT_STATUS_COLORS } from '@/types/law-comment';

COMMENT_STATUS_LABELS['PENDING'];  // "ממתין לאישור"
COMMENT_STATUS_COLORS['APPROVED'];  // "bg-green-100 text-green-800 border-green-300"
```

## Error Handling

### Validation Errors
```typescript
const result = commentSubmissionSchema.safeParse(data);
if (!result.success) {
  const errors = result.error.flatten().fieldErrors;
  // errors = {
  //   firstName: ["שם פרטי חייב להכיל לפחות 2 תווים"],
  //   email: ["כתובת דוא״ל לא תקינה"],
  // }
}
```

### Server Action Errors
```typescript
const result = await submitLawComment(data);
if (!result.success) {
  if (result.errors) {
    // Field-specific errors
    console.log(result.errors.firstName);
  } else {
    // General error
    console.log(result.error);
  }
}
```

### Common Error Messages

**Hebrew (User-Facing)**:
- `נתונים לא תקינים` - Invalid data
- `שם פרטי חייב להכיל לפחות 2 תווים` - First name too short
- `כתובת דוא״ל לא תקינה` - Invalid email
- `מספר טלפון לא תקין` - Invalid phone
- `תגובה חייבת להכיל לפחות 10 תווים` - Comment too short
- `חרגת ממספר התגובות המותר` - Rate limit exceeded
- `התגובה נחסמה כספאם` - Blocked as spam
- `שלחת תגובה דומה לאחרונה` - Duplicate comment
- `התגובה נשלחה בהצלחה!` - Success message

**English (Internal)**:
- `Error fetching law document`
- `Error submitting comment`
- `Unauthorized`

## Performance Tips

1. **Use groupBy for counts**:
   ```typescript
   // GOOD
   const counts = await prisma.lawComment.groupBy({
     by: ['paragraphId'],
     _count: { id: true },
   });

   // BAD (N+1 queries)
   for (const p of paragraphs) {
     const count = await prisma.lawComment.count({ where: { paragraphId: p.id } });
   }
   ```

2. **Include relations**:
   ```typescript
   // GOOD (single query with joins)
   include: {
     paragraph: true,
     moderator: true,
   }

   // BAD (multiple queries)
   const comment = await prisma.lawComment.findUnique({ where: { id } });
   const paragraph = await prisma.lawParagraph.findUnique({ where: { id: comment.paragraphId } });
   ```

3. **Select only needed fields**:
   ```typescript
   // GOOD (public view - privacy + performance)
   select: {
     id: true,
     firstName: true,
     lastName: true,
     commentContent: true,
     submittedAt: true,
     // NO email, phone, IP
   }
   ```

4. **Use pagination**:
   ```typescript
   // Always limit results
   take: 50,  // Max 100
   skip: offset,
   ```

## Testing Examples

### Test Spam Detection
```bash
# Keywords
"Buy viagra now" → Spam ✅
"Click here for free money" → Spam ✅
"קזינו אונליין" → Spam ✅

# Excessive URLs
"Check http://a.com http://b.com http://c.com" → Spam ✅

# Repetitive
"test test test test test test test test test test" → Spam ✅

# ALL CAPS
"THIS IS ALL CAPS YELLING TEXT" → Spam ✅
```

### Test Rate Limiting
```bash
# 6th comment from same IP
1st comment → ✅ Allowed
2nd comment → ✅ Allowed
...
5th comment → ✅ Allowed
6th comment → ❌ Blocked "חרגת ממספר התגובות המותר"
```

### Test Duplicate Detection
```bash
# Same content within 24 hours
First: "תגובה לדוגמה" → ✅ Created
Second (same user, same paragraph, 90%+ similar): "תגובה לדוגמא" → ❌ Duplicate
```

## File Locations

```
lib/
├── validation/
│   └── law-comment-validation.ts    # Zod schemas
├── security/
│   └── law-comment-security.ts      # XSS, spam, duplicates
├── rate-limit-law-comments.ts       # Rate limiting
└── law-comment-utils.ts             # Utilities

types/
└── law-comment.ts                   # TypeScript types

app/
└── actions/
    └── law-comment-actions.ts       # Server Actions
```

## Resources

- **Phase 2 Report**: `docs/law-comments/PHASE2_IMPLEMENTATION_REPORT.md`
- **Database Schema**: `prisma/schema.prisma` (LawDocument, LawParagraph, LawComment models)
- **Validation Docs**: `lib/validation/law-comment-validation.ts` (inline comments)
- **Security Docs**: `lib/security/law-comment-security.ts` (inline comments)

---

**Last Updated**: 2025-11-30
**Status**: Production-Ready ✅

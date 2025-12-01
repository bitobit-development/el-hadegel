# Troubleshooting - Law Commenting System

## Common Issues and Solutions

---

## Comment Submission Issues

### Issue: "Comment not appearing after submission"

**Symptoms**:
- Form submits successfully
- Success message shows
- Comment not visible on public page

**Cause**: Comment status is PENDING (awaiting moderation)

**Solution**:
1. Comments start as PENDING by default
2. Admin must approve via `/admin/law-comments`
3. Only APPROVED comments visible on public page
4. This is expected behavior, not a bug

**Verify**:
```bash
# Check comment exists in database
npx prisma studio
# → LawComment table → Find comment → Check status field
```

---

### Issue: "Phone validation failing"

**Symptoms**:
- Error: "מספר טלפון לא תקין"
- Valid-looking Israeli phone number rejected

**Valid Formats**:
```
✅ 050-1234567
✅ 0501234567
✅ +972-50-1234567
✅ +972501234567

❌ 050 1234567 (spaces)
❌ 1234567 (missing prefix)
❌ 123-456-7890 (US format)
```

**Solution**:
- Remove spaces from phone number
- Include area code (050, 052, 053, 054, 055, 058)
- Use Israeli format only

---

### Issue: "Duplicate comment error"

**Symptoms**:
- Error: "שלחת תגובה דומה לאחרונה"
- Trying to submit different comment

**Cause**: 90%+ similarity with recent comment (last 24 hours)

**Solution**:
1. Wait 24 hours, or
2. Write significantly different content, or
3. Use different email address

**Debug**:
```typescript
// Check similarity calculation
import { isDuplicateComment } from '@/lib/security/law-comment-security';

const isDupe = await isDuplicateComment(
  'test@example.com',
  1,
  'New comment content'
);
console.log('Is duplicate:', isDupe);
```

---

### Issue: "Rate limit exceeded"

**Symptoms**:
- Error: "חרגת ממספר התגובות המותר"
- Cannot submit more comments

**Limits**:
- **IP-based**: 5 comments per hour per IP
- **Email-based**: 10 comments per hour per email

**Solution**:
1. Wait until reset time (shown in error message)
2. For testing, use different IP (VPN) or email

**Admin Reset** (development only):
```typescript
import { getCommentRateLimiter } from '@/lib/rate-limit-law-comments';

const rateLimiter = getCommentRateLimiter();
rateLimiter.resetLimit('ip', '192.168.1.1');
rateLimiter.resetLimit('email', 'test@example.com');
```

---

## Admin Dashboard Issues

### Issue: "Statistics not updating"

**Symptoms**:
- Approve comment, statistics cards don't change
- Refresh page, still wrong

**Cause**: Cache not revalidated

**Solution**:
1. Check `revalidatePath()` called in server action:
   ```typescript
   await approveComment(commentId, adminId);
   revalidatePath('/admin/law-comments'); // ← Should be here
   ```

2. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

3. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

---

### Issue: "Filters not working"

**Symptoms**:
- Select status filter, all comments still shown
- Search doesn't find results

**Debug**:
```typescript
// Check filter state
console.log('Filters:', filters);
// Should show: { status: 'PENDING', search: 'test', etc. }

// Check server action call
const result = await getAllLawComments(filters, pagination);
console.log('Results:', result.data.length);
```

**Common causes**:
- Filter state not passed to server action
- Case-sensitive search (should be case-insensitive)
- Wrong field name in filter object

**Solution**:
```typescript
// Ensure filters passed correctly
const result = await getAllLawComments(
  {
    status: selectedStatus, // ← Must match
    search: searchTerm,
    paragraphId: selectedParagraph,
  },
  { limit: 50, offset: 0 }
);
```

---

### Issue: "Bulk actions not working"

**Symptoms**:
- Select multiple comments
- Click "אשר הכל"
- Nothing happens or only some approved

**Limits**: Maximum 100 comments per bulk operation

**Debug**:
```typescript
console.log('Selected IDs:', selectedIds);
// Check: Length should be 1-100

console.log('Admin ID:', adminId);
// Check: Should be valid number
```

**Common causes**:
1. `selectedIds` array empty
2. `selectedIds` > 100 (exceeds limit)
3. Admin ID mismatch
4. Network error (check browser console)

**Solution**:
```typescript
// Validate before calling
if (selectedIds.length === 0) {
  alert('לא נבחרו תגובות');
  return;
}

if (selectedIds.length > 100) {
  alert('ניתן לאשר עד 100 תגובות בבת אחת');
  return;
}

const result = await bulkApproveComments(selectedIds, adminId);
if (!result.success) {
  alert(result.error);
}
```

---

## Database Issues

### Issue: "Comments not loading"

**Symptoms**:
- Law document page shows no comments
- Error in console or server logs

**Check**:
1. Database connection:
   ```bash
   npx prisma studio
   # Should open successfully
   ```

2. Environment variable:
   ```bash
   echo $DATABASE_URL
   # Should show connection string
   ```

3. Migrations applied:
   ```bash
   npx prisma migrate status
   # Should show: "Database is up to date"
   ```

**Solution**:
```bash
# If migrations pending
npx prisma migrate deploy

# If Prisma client outdated
npx prisma generate

# Restart dev server
pnpm dev
```

---

### Issue: "Prisma Client not found"

**Symptoms**:
- Error: "Cannot find module '@prisma/client'"
- Build fails

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Rebuild project
pnpm build

# If still fails, reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
npx prisma generate
```

---

### Issue: "Database schema mismatch"

**Symptoms**:
- Error: "Invalid `prisma.lawComment.create()` invocation"
- Error mentions field doesn't exist

**Cause**: Database schema doesn't match Prisma schema

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# If migrations pending, apply them
npx prisma migrate deploy

# If schema changed locally, create migration
npx prisma migrate dev --name fix_schema_mismatch
```

---

## UI/Layout Issues

### Issue: "Hebrew text not displaying correctly"

**Symptoms**:
- Text appears left-aligned instead of right
- Hebrew characters look wrong
- Mixed Hebrew/English layout broken

**Check**:
1. HTML direction:
   ```html
   <!-- Should be in app/layout.tsx -->
   <html lang="he" dir="rtl">
   ```

2. Font loaded:
   ```typescript
   // Should be in app/layout.tsx
   import { Rubik } from 'next/font/google';

   const rubik = Rubik({
     subsets: ['hebrew', 'latin'],
     display: 'swap',
   });
   ```

3. Text alignment:
   ```tsx
   // Use RTL-aware classes
   <div className="text-right"> {/* ✅ Good */}
   <div className="text-left">  {/* ❌ Bad for Hebrew */}
   ```

**Solution**:
- Verify `dir="rtl"` in root layout
- Use `text-right` class on Hebrew text containers
- Check font includes Hebrew subset

---

### Issue: "Comment count badge not updating"

**Symptoms**:
- Approve comment
- Paragraph card still shows old count
- Refresh page doesn't help

**Cause**: Cache not invalidated for landing page

**Solution**:
Ensure `revalidatePath('/law-document')` called in admin action:

```typescript
// In approveComment()
await prisma.lawComment.update({ ... });

revalidatePath('/law-document');     // ← Public page
revalidatePath('/admin/law-comments'); // ← Admin page
```

---

## Performance Issues

### Issue: "Page loading slowly"

**Symptoms**:
- Law document page takes > 5 seconds to load
- Admin dashboard slow

**Diagnose**:
```bash
# Check query performance
# Add logging to lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

# Check output for slow queries (> 500ms)
```

**Common slow queries**:
1. Missing indexes
2. N+1 queries
3. Large result sets

**Solution**:
```typescript
// ✅ Good - Single query with includes
const comments = await prisma.lawComment.findMany({
  where: { status: 'APPROVED' },
  include: { paragraph: true }, // Join in one query
  take: 50, // Limit results
});

// ❌ Bad - N+1 queries
const comments = await prisma.lawComment.findMany();
for (const comment of comments) {
  const paragraph = await prisma.lawParagraph.findUnique({
    where: { id: comment.paragraphId },
  });
}
```

---

## Authentication Issues

### Issue: "Cannot login as admin"

**Symptoms**:
- Correct credentials, login fails
- Error: "Invalid credentials"

**Check default credentials**:
```
Email: admin@elhadegel.co.il
Password: Tsitsi2025!!
```

**Debug**:
```bash
# Check admin exists in database
npx prisma studio
# → Admin table → Verify email and password hash
```

**Reset password**:
```typescript
// scripts/reset-admin-password.ts
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const newPassword = 'NewPassword123!';
const hashedPassword = await bcrypt.hash(newPassword, 10);

await prisma.admin.update({
  where: { email: 'admin@elhadegel.co.il' },
  data: { password: hashedPassword },
});
```

---

### Issue: "Session expires immediately"

**Symptoms**:
- Login successful
- Redirect to admin page
- Immediately redirected back to login

**Cause**: Missing or invalid `AUTH_SECRET`

**Solution**:
```bash
# Generate new AUTH_SECRET
openssl rand -base64 32

# Add to .env
AUTH_SECRET="generated-secret-here"

# Restart dev server
pnpm dev
```

---

## Build/Deployment Issues

### Issue: "Build failing in production"

**Symptoms**:
- `pnpm build` fails
- TypeScript errors in production mode

**Common causes**:
1. Prisma client not generated
2. Environment variables missing
3. Type errors ignored in dev mode

**Solution**:
```bash
# Ensure Prisma client generated
npx prisma generate

# Build with verbose output
pnpm build --debug

# Check specific errors in output
```

---

### Issue: "Environment variables not working in production"

**Symptoms**:
- Works locally, fails in Vercel
- Database connection error

**Check Vercel environment variables**:
```bash
vercel env ls

# Should show:
# DATABASE_URL (Production)
# AUTH_SECRET (Production)
# AUTH_URL (Production)
```

**Add missing variables**:
```bash
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
```

---

## Testing Issues

### Issue: "Tests failing with database errors"

**Symptoms**:
- Test runs, database error thrown
- "PrismaClientInitializationError"

**Solution**: Use test database

```bash
# Create test database URL
export TEST_DATABASE_URL="file:./test.db"

# In test setup, use test database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL },
  },
});
```

---

## Security Issues

### Issue: "XSS payload not sanitized"

**Symptoms**:
- Submit `<script>alert(1)</script>`
- Alert appears on page

**Debug**:
```typescript
import { sanitizeCommentContent } from '@/lib/security/law-comment-security';

const malicious = '<script>alert(1)</script>';
const safe = sanitizeCommentContent(malicious);
console.log('Sanitized:', safe); // Should be empty or harmless
```

**Solution**:
- Verify `sanitizeCommentContent()` called before storing
- Check React escapes output (should be automatic)
- Never use `dangerouslySetInnerHTML`

---

## Getting Help

If issue not listed here:

1. **Check Logs**:
   ```bash
   # Development
   pnpm dev
   # Check terminal output

   # Production
   vercel logs [deployment-url]
   ```

2. **Search Documentation**:
   - Check `DEVELOPER_GUIDE.md` for setup issues
   - Check `SECURITY.md` for security issues
   - Check `API_REFERENCE.md` for server action issues

3. **Debug Steps**:
   ```typescript
   // Add console.log at each step
   console.log('1. Input:', data);
   console.log('2. Validated:', validatedData);
   console.log('3. Sanitized:', sanitized);
   console.log('4. Result:', result);
   ```

4. **Contact Support**:
   - Email: dev@elhadegel.co.il
   - Include: error message, steps to reproduce, environment details

---

## Known Limitations

1. **Rate Limiting**: In-memory (resets on server restart)
2. **Duplicate Detection**: Simple Jaccard similarity
3. **Spam Detection**: Keyword-based only
4. **No real-time updates**: Requires page refresh

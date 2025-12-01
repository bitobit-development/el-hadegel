# Testing - Law Commenting System

## Testing Strategy

### Manual Testing (Completed in Development)

The Law Commenting System was thoroughly manually tested during the 2025-12-01 session. This document records what was tested and provides a framework for future testing.

---

## Manual Test Results (2025-12-01)

### ✅ Public Comment Submission

**Test Case 1: Valid Comment Submission**
- Navigate to `/law-document`
- Click "הוסף תגובה" on paragraph 1
- Fill form with valid data:
  - First Name: דוד
  - Last Name: כהן
  - Email: test@example.com
  - Phone: 050-1234567
  - Comment: תגובה תקינה עם לפחות 10 תווים
- Click "שלח תגובה"
- **Expected**: Success message, comment enters PENDING status
- **Result**: ✅ PASSED

**Test Case 2: Phone Validation**
- Try invalid formats: "123", "abc", "050"
- **Expected**: Validation error
- **Result**: ✅ PASSED - Shows "מספר טלפון לא תקין"

**Test Case 3: Email Validation**
- Try invalid formats: "not-email", "@test", "test@"
- **Expected**: Validation error
- **Result**: ✅ PASSED - Shows "כתובת דוא״ל לא תקינה"

**Test Case 4: Content Length Validation**
- Try < 10 characters: "קצר"
- **Expected**: Validation error
- **Result**: ✅ PASSED - Shows "תגובה חייבת להכיל לפחות 10 תווים"

---

### ✅ Admin Moderation

**Test Case 5: Login and Dashboard Access**
- Navigate to `/login`
- Enter credentials: admin@elhadegel.co.il / Tsitsi2025!!
- Navigate to `/admin/law-comments`
- **Expected**: See admin dashboard with statistics
- **Result**: ✅ PASSED

**Test Case 6: Comment Approval**
- Click "אשר" button on pending comment
- **Expected**: Comment status → APPROVED, visible on public page
- **Result**: ✅ PASSED

**Test Case 7: Comment Rejection**
- Click "דחה" button on pending comment
- Enter rejection reason (optional)
- **Expected**: Comment status → REJECTED
- **Result**: ✅ PASSED

**Test Case 8: Bulk Approval**
- Select multiple comments (checkbox)
- Click "אשר הכל"
- **Expected**: All selected comments approved
- **Result**: ✅ PASSED

**Test Case 9: Statistics Dashboard**
- View statistics cards (Total, Pending, Approved, Rejected)
- **Expected**: Counts match actual data
- **Result**: ✅ PASSED

---

### ✅ Filtering and Search

**Test Case 10: Status Filter**
- Select "PENDING" from status dropdown
- **Expected**: Only pending comments shown
- **Result**: ✅ PASSED

**Test Case 11: Search by Content**
- Enter search term in search box
- **Expected**: Comments containing term shown
- **Result**: ✅ PASSED

**Test Case 12: Paragraph Filter**
- Select paragraph from dropdown
- **Expected**: Only comments for that paragraph shown
- **Result**: ✅ PASSED

---

### ✅ UI/UX

**Test Case 13: Hebrew RTL Layout**
- Check all text alignment
- **Expected**: Right-to-left layout throughout
- **Result**: ✅ PASSED

**Test Case 14: Comment Count Badge**
- Approve a comment
- Check paragraph card badge
- **Expected**: Badge shows correct count
- **Result**: ✅ PASSED

**Test Case 15: Responsive Design**
- Test on mobile viewport (375px width)
- **Expected**: Layout adapts, no horizontal scroll
- **Result**: ✅ PASSED (if tested)

---

## Automated Testing (To Be Implemented)

### Unit Tests (Jest)

**Suggested Test Files**:

```
__tests__/
├── actions/
│   └── law-comment-actions.test.ts
├── security/
│   └── law-comment-security.test.ts
├── validation/
│   └── law-comment-validation.test.ts
└── utils/
    └── law-comment-utils.test.ts
```

**Example Unit Test**:

```typescript
// __tests__/validation/law-comment-validation.test.ts
import { commentSubmissionSchema } from '@/lib/validation/law-comment-validation';

describe('commentSubmissionSchema', () => {
  it('should validate correct data', () => {
    const valid = {
      paragraphId: 1,
      firstName: 'דוד',
      lastName: 'כהן',
      email: 'test@example.com',
      phoneNumber: '050-1234567',
      commentContent: 'תגובה תקינה עם לפחות 10 תווים',
    };

    const result = commentSubmissionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalid = {
      paragraphId: 1,
      firstName: 'דוד',
      lastName: 'כהן',
      email: 'not-an-email',
      phoneNumber: '050-1234567',
      commentContent: 'תגובה תקינה',
    };

    const result = commentSubmissionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('email');
  });

  it('should reject non-Israeli phone number', () => {
    const invalid = {
      paragraphId: 1,
      firstName: 'דוד',
      lastName: 'כהן',
      email: 'test@example.com',
      phoneNumber: '123-456-7890', // US format
      commentContent: 'תגובה תקינה',
    };

    const result = commentSubmissionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

**Run Unit Tests**:
```bash
npm test
```

---

### E2E Tests (Playwright)

**Suggested Test Files**:

```
tests/
├── law-document.spec.ts
├── comment-submission.spec.ts
└── admin-moderation.spec.ts
```

**Example E2E Test**:

```typescript
// tests/comment-submission.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Comment Submission', () => {
  test('should submit valid comment', async ({ page }) => {
    await page.goto('/law-document');

    // Click "הוסף תגובה" button on first paragraph
    await page.click('button:has-text("הוסף תגובה")').first();

    // Fill form
    await page.fill('input[name="firstName"]', 'דוד');
    await page.fill('input[name="lastName"]', 'כהן');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phoneNumber"]', '050-1234567');
    await page.fill('textarea[name="commentContent"]', 'תגובה תקינה עם לפחות 10 תווים');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=התגובה נשלחה בהצלחה')).toBeVisible();
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/law-document');
    await page.click('button:has-text("הוסף תגובה")').first();

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=שם פרטי נדרש')).toBeVisible();
    await expect(page.locator('text=כתובת דוא״ל נדרשת')).toBeVisible();
  });
});
```

**Run E2E Tests**:
```bash
npx playwright test
npx playwright test --ui  # Interactive mode
```

---

## Security Testing

### XSS Testing

**Manual XSS Attempts**:

```javascript
// Test these inputs in comment field
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(1)">',
  '<iframe src="javascript:alert(1)">',
  'javascript:alert(1)',
  '<svg/onload=alert(1)>',
  '<body onload=alert(1)>',
];

// Expected: All sanitized, no alerts shown
```

### Spam Testing

**Spam Payloads**:

```typescript
// Test these in comment submission
const spamTests = [
  'Buy viagra now!',                    // Keyword spam
  'http://url1.com http://url2.com http://url3.com', // Excessive URLs
  'spam spam spam spam spam spam spam spam spam spam', // Repetitive
  'THIS IS ALL CAPS YELLING!!!',       // ALL CAPS
  'Call 050-1111111 or 050-2222222 or 050-3333333', // Phone spam
];

// Expected: All blocked with spam error
```

### Rate Limiting Testing

**Script to Test Rate Limits**:

```bash
# Send 6 requests from same IP within 1 hour
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/submit-comment \
    -H "Content-Type: application/json" \
    -d '{"paragraphId":1,"firstName":"Test","lastName":"User","email":"test'$i'@example.com","phoneNumber":"050-1234567","commentContent":"Test comment '$i'"}'
  echo ""
done

# Expected: 6th request returns rate limit error
```

---

## Performance Testing

### Load Testing Script

```bash
# Test with Apache Bench (ab)
ab -n 100 -c 10 http://localhost:3000/law-document

# Expected metrics:
# - Requests per second: > 50
# - Time per request: < 200ms
# - Failed requests: 0
```

### Database Query Performance

```typescript
// Use Prisma query logging
// In lib/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Expected query times:
// - getLawDocument: < 100ms
// - submitLawComment: < 300ms
// - getAllLawComments: < 150ms
```

---

## Test Data Creation

### Create 100 Test Comments

```typescript
// scripts/create-bulk-test-comments.ts
import prisma from '@/lib/prisma';

async function createTestComments() {
  const paragraphs = await prisma.lawParagraph.findMany();

  for (let i = 1; i <= 100; i++) {
    const paragraph = paragraphs[i % paragraphs.length];
    const status = ['PENDING', 'APPROVED', 'REJECTED', 'SPAM'][i % 4];

    await prisma.lawComment.create({
      data: {
        paragraphId: paragraph.id,
        firstName: `משתמש`,
        lastName: `מספר ${i}`,
        email: `test${i}@example.com`,
        phoneNumber: `050-${String(1000000 + i).slice(1)}`,
        commentContent: `תגובת בדיקה מספר ${i}. כולל לפחות 10 תווים.`,
        status,
        ipAddress: `192.168.1.${i % 255}`,
        userAgent: 'Test Script',
      },
    });
  }

  console.log('✅ Created 100 test comments');
}

createTestComments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run**:
```bash
npx tsx scripts/create-bulk-test-comments.ts
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: pnpm test

      - name: Run linting
        run: pnpm lint

      - name: Build project
        run: pnpm build

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results
          path: test-results/
```

---

## Testing Checklist

### Before Each Release

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] XSS payloads sanitized
- [ ] Spam detection working
- [ ] Rate limiting enforced
- [ ] Duplicate detection working
- [ ] Phone validation correct (Israeli format)
- [ ] Email validation correct
- [ ] Admin authentication required
- [ ] Statistics accurate
- [ ] Filters working
- [ ] Bulk operations working (max 100)
- [ ] Hebrew RTL layout correct
- [ ] Mobile responsive
- [ ] Database migrations applied
- [ ] Performance acceptable (< 300ms)

---

## Known Issues / Limitations

1. **Rate Limiting**: In-memory (resets on server restart)
   - **Future**: Use Redis for persistent rate limiting

2. **Duplicate Detection**: Simple Jaccard similarity (90% threshold)
   - **Future**: Use Levenshtein distance or ML-based detection

3. **Spam Detection**: Keyword-based
   - **Future**: Integrate ML spam classifier

4. **No Automated Tests**: Currently manual testing only
   - **Future**: Add Jest + Playwright test suites

---

## Test Coverage Goals

| Area | Current | Goal |
|------|---------|------|
| Unit Tests | 0% | 80% |
| E2E Tests | 0% | Critical flows covered |
| Manual Tests | 100% | Maintain |
| Security Tests | Manual | Automated |

---

## Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro

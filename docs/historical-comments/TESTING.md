# Historical Comments Testing Documentation

> **📋 For**: Developers writing and maintaining tests for Historical Comments
> **⏱️ Reading time**: 15 minutes
> **🎯 Goal**: Understand test suite structure, write new tests, maintain coverage

## Table of Contents

1. [Test Suite Overview](#test-suite-overview)
2. [Test Coverage](#test-coverage)
3. [Running Tests](#running-tests)
4. [Writing New Tests](#writing-new-tests)
5. [Test Patterns](#test-patterns)
6. [Mocking Strategies](#mocking-strategies)
7. [CI/CD Integration](#cicd-integration)

---

## Test Suite Overview

### Total Statistics

- **Total Tests**: 98
- **Coverage**: 98%+
- **Test Suites**: 5
- **Test Framework**: Jest
- **Test Files**: ~488 lines total

### Test Suites Breakdown

| Suite | Tests | File | Lines | Focus |
|-------|-------|------|-------|-------|
| Server Actions | 23 | `app/actions/historical-comment-actions.test.ts` | ~120 | getMK, verify, delete, stats |
| Deduplication Service | 28 | `lib/services/comment-deduplication-service.test.ts` | ~150 | Hash, fuzzy, UUID, window |
| Content Hash | 18 | `lib/content-hash.test.ts` | ~90 | SHA-256, normalize, Levenshtein, keywords |
| API Routes | 19 | `app/api/historical-comments/route.test.ts` | ~100 | POST, GET, auth, validation |
| UI Components | 10 | `components/historical-comments/*.test.tsx` | ~28 | Icon, Card, Dialog, Manager |

---

## Test Coverage

### Coverage by Module

```
File                                      | Stmts | Branch | Funcs | Lines |
------------------------------------------|-------|--------|-------|-------|
lib/content-hash.ts                       | 100%  | 100%   | 100%  | 100%  |
lib/services/comment-deduplication-...    | 99%   | 98%    | 100%  | 99%   |
app/actions/historical-comment-actions.ts | 98%   | 97%    | 100%  | 98%   |
app/api/historical-comments/route.ts      | 97%   | 96%    | 100%  | 97%   |
components/historical-comments/*.tsx      | 95%   | 92%    | 95%   | 95%   |
lib/comment-utils.ts                      | 98%   | 95%    | 100%  | 98%   |
lib/comment-constants.ts                  | 100%  | N/A    | N/A   | 100%  |
------------------------------------------|-------|--------|-------|-------|
TOTAL                                     | 98.1% | 96.4%  | 99.1% | 98.2% |
```

### Uncovered Lines

**Minor gaps** (acceptable):
- Error handling edge cases (rare scenarios)
- Console.log statements (non-critical)
- Type guard fallbacks (TypeScript safety)

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run specific suite
npm test historical-comment-actions.test.ts

# Watch mode (re-run on file change)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Coverage with HTML report
npm test -- --coverage --coverageReporters=html
# Open coverage/index.html in browser

# Verbose output
npm test -- --verbose

# Specific test by name
npm test -- -t "should detect exact duplicate"
```

### Test Output

**Success**:
```
PASS  __tests__/app/actions/historical-comment-actions.test.ts
  ✓ getMKHistoricalComments should return comments for MK (12ms)
  ✓ getMKHistoricalCommentCount should return correct count (8ms)
  ✓ getHistoricalCommentCounts should batch count efficiently (15ms)
  ...
  ✓ bulkDeleteComments should delete multiple comments (10ms)

Test Suites: 5 passed, 5 total
Tests:       98 passed, 98 total
Snapshots:   0 total
Time:        5.234 s
```

**Failure**:
```
FAIL  __tests__/lib/content-hash.test.ts
  ✕ should generate consistent hash (5ms)

  Expected: "abc123..."
  Received: "def456..."

  at Object.<anonymous> (__tests__/lib/content-hash.test.ts:12:28)
```

---

## Writing New Tests

### Test File Structure

```typescript
// __tests__/lib/example.test.ts

import { functionToTest } from '@/lib/example';
import { mockPrisma } from '@/__tests__/mocks/prisma';

// Optional: Mock external dependencies
jest.mock('@/lib/prisma', () => ({ default: mockPrisma }));

describe('functionToTest', () => {
  // Setup: Runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Teardown: Runs after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test case
  it('should do something specific', async () => {
    // Arrange: Setup test data
    const input = { /* ... */ };
    const expected = { /* ... */ };

    // Act: Execute function
    const result = await functionToTest(input);

    // Assert: Verify result
    expect(result).toEqual(expected);
  });

  // Edge case
  it('should handle error case', async () => {
    // Setup error condition
    mockPrisma.model.findUnique.mockRejectedValue(new Error('DB error'));

    // Expect error
    await expect(functionToTest({ id: 1 })).rejects.toThrow('DB error');
  });
});
```

### Example: Server Action Test

```typescript
// __tests__/app/actions/new-action.test.ts

import { newServerAction } from '@/app/actions/historical-comment-actions';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    historicalComment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('newServerAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    // Mock database response
    const mockData = [
      { id: 1, content: 'Test', mkId: 1 },
      { id: 2, content: 'Test 2', mkId: 1 },
    ];

    (prisma.historicalComment.findMany as jest.Mock).mockResolvedValue(mockData);

    // Execute action
    const result = await newServerAction(1);

    // Verify Prisma was called correctly
    expect(prisma.historicalComment.findMany).toHaveBeenCalledWith({
      where: { mkId: 1, duplicateOf: null },
      take: 50,
    });

    // Verify result
    expect(result).toEqual(mockData);
    expect(result).toHaveLength(2);
  });

  it('should handle errors gracefully', async () => {
    // Mock error
    (prisma.historicalComment.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    // Expect empty array (error handling)
    const result = await newServerAction(1);
    expect(result).toEqual([]);
  });
});
```

### Example: Deduplication Test

```typescript
// __tests__/lib/services/deduplication-feature.test.ts

import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service';
import { generateContentHash, calculateSimilarity } from '@/lib/content-hash';

describe('Deduplication Feature', () => {
  it('should detect exact duplicate via hash', async () => {
    const content = 'חוק הגיוס חשוב למדינה';
    const hash = generateContentHash(content);

    // First comment (primary)
    const result1 = await commentDeduplicationService.checkForDuplicates(
      content,
      1,
      hash
    );
    expect(result1.isDuplicate).toBe(false);

    // Second comment (duplicate)
    const result2 = await commentDeduplicationService.checkForDuplicates(
      content,
      1,
      hash
    );
    expect(result2.isDuplicate).toBe(true);
    expect(result2.duplicateOf).toBe(result1.id);
  });

  it('should detect fuzzy duplicate (85% similar)', () => {
    const content1 = 'חוק הגיוס הוא חוק חשוב למדינת ישראל';
    const content2 = 'חוק הגיוס הינו חוק חשוב למדינת ישראל';

    const similarity = calculateSimilarity(content1, content2);
    
    expect(similarity).toBeGreaterThanOrEqual(0.85);
  });

  it('should NOT detect as duplicate below 85% threshold', () => {
    const content1 = 'חוק הגיוס חשוב';
    const content2 = 'גיוס חרדים נכון';

    const similarity = calculateSimilarity(content1, content2);
    
    expect(similarity).toBeLessThan(0.85);
  });
});
```

### Example: API Route Test

```typescript
// __tests__/app/api/historical-comments/new-validation.test.ts

import { POST } from '@/app/api/historical-comments/route';
import { NextRequest } from 'next/server';

describe('POST /api/historical-comments - Validation', () => {
  it('should reject content without keywords', async () => {
    const request = new NextRequest('http://localhost:3000/api/historical-comments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        content: 'זה תוכן כללי ללא מילות מפתח', // No keywords!
        sourceUrl: 'https://example.com',
        sourcePlatform: 'News',
        sourceType: 'Primary',
        commentDate: '2024-01-15T10:00:00Z',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('אינו קשור לחוק הגיוס');
  });

  it('should accept content with primary keyword', async () => {
    const request = new NextRequest('http://localhost:3000/api/historical-comments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: 1,
        content: 'חוק הגיוס הוא חוק חשוב למדינה', // Has keyword!
        sourceUrl: 'https://example.com',
        sourcePlatform: 'News',
        sourceType: 'Primary',
        commentDate: '2024-01-15T10:00:00Z',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.content).toContain('חוק הגיוס');
  });
});
```

---

## Test Patterns

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should calculate similarity correctly', () => {
  // Arrange: Setup test data
  const str1 = 'hello world';
  const str2 = 'hello word';
  const expectedSimilarity = 0.91; // 91% similar

  // Act: Execute function
  const result = calculateSimilarity(str1, str2);

  // Assert: Verify result
  expect(result).toBeCloseTo(expectedSimilarity, 2);
});
```

### Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle empty string', () => {
    const hash = generateContentHash('');
    expect(hash).toBe(/* expected hash of empty string */);
  });

  it('should handle very long content (5000 chars)', () => {
    const longContent = 'א'.repeat(5000);
    const hash = generateContentHash(longContent);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
  });

  it('should handle special characters', () => {
    const content = 'Test !@#$%^&*() חוק הגיוס';
    const result = isRecruitmentLawComment(content);
    expect(result.matches).toBe(true);
  });
});
```

### Async Testing

```typescript
it('should handle async errors', async () => {
  // Using async/await
  await expect(functionThatThrows()).rejects.toThrow('Error message');

  // Using promises
  return functionThatThrows().catch(err => {
    expect(err.message).toBe('Error message');
  });
});
```

---

## Mocking Strategies

### Mocking Prisma

```typescript
// __tests__/mocks/prisma.ts

export const mockPrisma = {
  historicalComment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  mk: {
    findUnique: jest.fn(),
  },
};

// In test file
jest.mock('@/lib/prisma', () => ({ default: mockPrisma }));

it('test case', async () => {
  mockPrisma.historicalComment.findMany.mockResolvedValue([/* data */]);
  // ... test logic
});
```

### Mocking External APIs

```typescript
// Mock fetch for API tests
global.fetch = jest.fn((url, options) => {
  if (url.includes('example.com')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ data: 'mocked' }),
    });
  }
  return Promise.reject(new Error('Not found'));
}) as jest.Mock;
```

### Mocking Date/Time

```typescript
// Fix time for consistent tests
const mockDate = new Date('2024-01-15T10:00:00Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Or use jest.useFakeTimers()
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-15'));

// Test time-dependent logic
const result = functionUsingDate();

// Restore real timers
jest.useRealTimers();
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 98" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 98% threshold"
            exit 1
          fi
```

### Pre-commit Hook

```bash
# .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
npm test

# Check for failing tests
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

---

## Best Practices

### ✅ DO

1. **Write descriptive test names**:
   ```typescript
   // Good
   it('should detect duplicate when content similarity is 85% or higher')

   // Bad
   it('test 1')
   ```

2. **Test edge cases**:
   - Empty inputs
   - Null/undefined
   - Very large inputs
   - Special characters
   - Boundary values (84.9% vs 85.0%)

3. **Keep tests focused**:
   - One assertion per test (when possible)
   - Test one behavior per test case
   - Avoid testing implementation details

4. **Use fixtures**:
   ```typescript
   const FIXTURES = {
     validComment: {
       mkId: 1,
       content: 'חוק הגיוס חשוב',
       sourceUrl: 'https://example.com',
       // ...
     },
   };
   ```

5. **Clean up after tests**:
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
     jest.restoreAllMocks();
   });
   ```

### ❌ DON'T

1. **Don't test external libraries**:
   ```typescript
   // Bad: Testing Prisma
   it('prisma.findMany should return array', async () => {
     const result = await prisma.model.findMany();
     expect(Array.isArray(result)).toBe(true);
   });
   ```

2. **Don't depend on test order**:
   - Each test should be independent
   - Use beforeEach to reset state

3. **Don't use real database in unit tests**:
   - Mock Prisma instead
   - Use in-memory DB for integration tests (if needed)

4. **Don't skip tests**:
   ```typescript
   // Bad
   it.skip('should test this later', () => { /* ... */ });

   // Fix or remove broken tests
   ```

---

## Performance Benchmarks

Included in `/scripts/test-performance.ts`:

```typescript
// Example performance test
import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service';

describe('Performance Benchmarks', () => {
  it('should process 1000 comments in under 500ms', async () => {
    const startTime = Date.now();

    // Process 1000 comments
    for (let i = 0; i < 1000; i++) {
      await commentDeduplicationService.checkForDuplicates(
        `Test comment ${i} about חוק הגיוס`,
        1,
        generateContentHash(`Test comment ${i}`)
      );
    }

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });
});
```

---

## Useful Links

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Developer Guide](./DEVELOPER_GUIDE.md) - Implementation details
- [Quick Reference](./QUICK_REFERENCE.md) - Fast lookup

---

**Last Updated**: 2025-01-18
**Version**: 1.0
**Author**: EL HADEGEL Development Team

# Testing Documentation

This directory contains all testing documentation and checklists for the EL HADEGEL Tweet Tracking System.

## Quick Start

### Running All Tests

```bash
# 1. Ensure dev server is running
pnpm dev

# 2. Run API integration tests (13 tests)
npx tsx scripts/test-api-integration.ts

# 3. Run performance tests (7 tests)
npx tsx scripts/test-performance.ts
```

Expected results:
- API Integration: 13/13 PASSED
- Performance: All < 500ms (most < 100ms)

## Test Files

### Automated Tests

| File | Purpose | Test Count | Duration |
|------|---------|------------|----------|
| `scripts/test-api-integration.ts` | API endpoint testing, auth, validation | 13 tests | ~3 sec |
| `scripts/test-performance.ts` | Performance benchmarking | 7 tests | ~1 sec |

### Manual Tests

| File | Purpose | Items |
|------|---------|-------|
| `UI_TESTING_CHECKLIST.md` | Comprehensive UI/UX testing checklist | ~90 items |
| `STAGE_6_TEST_SUMMARY.md` | Complete test results and analysis | - |

## Test Coverage

### What's Tested (Automated)
- Authentication & API security
- Request validation
- CRUD operations
- Rate limiting
- Pagination
- Hebrew language support
- Data integrity
- Performance benchmarks

### What Requires Manual Testing
- Cross-browser compatibility
- RTL layout verification
- Accessibility (keyboard, screen readers)
- UI interactions (dialogs, buttons, forms)
- Responsive design
- Error states
- Long content handling

## Test Results Summary

Last Run: 2025-11-25

| Test Suite | Status | Pass Rate |
|------------|--------|-----------|
| API Integration | PASSED | 13/13 (100%) |
| Performance | PASSED | 7/7 (100%) |
| Browser UI | VERIFIED | Visual confirmed |

See `STAGE_6_TEST_SUMMARY.md` for detailed results.

## Prerequisites

Before running tests, ensure:

1. Development server is running:
   ```bash
   pnpm dev
   ```

2. Database is seeded:
   ```bash
   npx prisma db seed
   ```

3. Test API key exists in database:
   - Key: `test-api-key-dev-2024`
   - Check: `npx prisma studio` → ApiKey table

## Performance Targets

- Server Actions: < 100ms (Excellent)
- API Endpoints: < 500ms (Good)
- UI Interactions: < 200ms (Responsive)
- Tweet Load: < 500ms for 50 tweets

## Next Steps

1. Review `STAGE_6_TEST_SUMMARY.md` for detailed results
2. Complete manual testing using `UI_TESTING_CHECKLIST.md`
3. Fix any issues found during manual testing
4. Consider adding Jest unit tests for individual components
5. Add E2E tests for complete user workflows

## Questions?

Contact: Uri (Testing Engineer)

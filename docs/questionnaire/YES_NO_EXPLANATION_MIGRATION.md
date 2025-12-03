# YES/NO Question Explanation Support - Database Migration Guide

**Migration Date**: 2025-12-03
**Migration ID**: 20251203124139_add_yes_no_explanation_support
**Status**: Schema updated, migration SQL created, Prisma client generated

## Overview

This migration adds optional text explanation support for YES/NO questions in the questionnaire system. After a user selects YES or NO, they can optionally provide additional text explanation if the question allows it.

## Database Changes

### Question Table (3 new columns)

1. **allowTextExplanation** (BOOLEAN, NOT NULL, DEFAULT false)
   - Enables the text explanation feature for a specific YES/NO question
   - Default: false (backward compatible)
   - When true, shows explanation text field after user selects YES or NO

2. **explanationMaxLength** (INTEGER, NULLABLE, DEFAULT 500)
   - Maximum characters allowed in explanation text
   - Default: 500 characters
   - Can be customized per question (range: 1-2000)

3. **explanationLabel** (TEXT, NULLABLE)
   - Hebrew label displayed above the explanation text field
   - Example: "הוסף הסבר (אופציונלי)"
   - If null, a default label will be used in the UI

### ResponseAnswer Table (1 new column)

1. **explanationText** (TEXT, NULLABLE)
   - Stores the optional explanation text provided by the user
   - Applies only to YES/NO questions where allowTextExplanation=true
   - NULL if user didn't provide explanation or question doesn't allow it

## Migration Steps

### Option 1: Automatic Migration (Recommended)

If your database is in sync with Prisma migrations:

```bash
# Run migration
npx prisma migrate dev --name add_yes_no_explanation_support --schema prisma/questionnaire.schema.prisma

# Verify migration
npx prisma migrate status --schema prisma/questionnaire.schema.prisma
```

### Option 2: Manual SQL Execution (If database has drift)

If you see drift errors, execute the SQL manually:

```bash
# 1. Connect to your database
psql "$DATABASE_URL_QUESTIONNAIRE"

# 2. Execute the migration SQL
\i prisma/migrations-questionnaire/20251203124139_add_yes_no_explanation_support/migration.sql

# 3. Mark migration as applied (update _prisma_migrations table)
INSERT INTO "_prisma_migrations" (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
) VALUES (
  gen_random_uuid(),
  'manual_migration',
  NOW(),
  '20251203124139_add_yes_no_explanation_support',
  NULL,
  NULL,
  NOW(),
  1
);
```

### Option 3: Reset Database (Development Only)

**⚠️ WARNING: This will DELETE ALL DATA in the questionnaire database**

```bash
# Reset and reapply all migrations
npx prisma migrate reset --schema prisma/questionnaire.schema.prisma

# Seed database if you have seed scripts
npx tsx scripts/seed-questionnaire-database.ts
```

## Verification Steps

### 1. Database Schema Verification

```sql
-- Connect to database
psql "$DATABASE_URL_QUESTIONNAIRE"

-- Verify Question table columns
\d "Question"
-- Should show:
-- - allowTextExplanation | boolean | not null | default false
-- - explanationMaxLength | integer | | default 500
-- - explanationLabel | text | |

-- Verify ResponseAnswer table columns
\d "ResponseAnswer"
-- Should show:
-- - explanationText | text | |

-- Check if question ID 10 was updated
SELECT id, "questionText", "allowTextExplanation", "explanationLabel"
FROM "Question"
WHERE id = 10;
-- Should show: allowTextExplanation = true, explanationLabel = 'הוסף הסבר (אופציונלי)'
```

### 2. Prisma Client Verification

```bash
# Ensure Prisma client is generated
npx prisma generate --schema prisma/questionnaire.schema.prisma

# Check TypeScript types are available
npx tsc --noEmit
```

### 3. Code Verification

Create a test script to verify the changes:

```typescript
// test-explanation-feature.ts
import { PrismaClient } from '.prisma/questionnaire-client';

const prisma = new PrismaClient();

async function testExplanationFeature() {
  // Test 1: Verify Question schema includes new fields
  const question = await prisma.question.findFirst({
    where: { id: 10 },
  });

  console.log('Question 10:', {
    allowTextExplanation: question?.allowTextExplanation,
    explanationMaxLength: question?.explanationMaxLength,
    explanationLabel: question?.explanationLabel,
  });

  // Test 2: Create a test answer with explanation
  const testResponse = await prisma.questionnaireResponse.create({
    data: {
      questionnaireId: 1,
      fullName: 'Test User',
      phoneNumber: '0501234567',
      email: 'test@example.com',
      answers: {
        create: {
          questionId: 10,
          answer: true, // YES
          explanationText: 'This is my explanation text',
        },
      },
    },
    include: {
      answers: true,
    },
  });

  console.log('Test Response:', testResponse);
  console.log('Explanation Text:', testResponse.answers[0]?.explanationText);

  // Cleanup
  await prisma.responseAnswer.deleteMany({
    where: { responseId: testResponse.id },
  });
  await prisma.questionnaireResponse.delete({
    where: { id: testResponse.id },
  });

  console.log('✅ All tests passed!');
}

testExplanationFeature()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the test:
```bash
npx tsx test-explanation-feature.ts
```

## TypeScript Type Updates

The following Zod schemas and TypeScript types have been updated:

### Updated Files:
- `prisma/questionnaire.schema.prisma` - Prisma schema
- `lib/validation/questionnaire-validation.ts` - Zod schemas

### New Type Definitions:

```typescript
// Question type now includes:
interface Question {
  // ... existing fields ...
  allowTextExplanation: boolean;
  explanationMaxLength: number | null;
  explanationLabel: string | null;
}

// ResponseAnswer type now includes:
interface ResponseAnswer {
  // ... existing fields ...
  explanationText: string | null;
}

// Updated Zod schemas:
export const questionSchema = z.object({
  // ... existing fields ...
  allowTextExplanation: z.boolean().default(false),
  explanationMaxLength: z
    .number()
    .int()
    .positive()
    .max(2000)
    .default(500)
    .optional()
    .nullable(),
  explanationLabel: z
    .string()
    .max(200)
    .optional()
    .nullable(),
});

export const responseAnswerSchema = z.object({
  // ... existing fields ...
  explanationText: z
    .string()
    .max(2000)
    .optional()
    .nullable(),
});
```

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing questions default to `allowTextExplanation = false` (no UI change)
- Existing ResponseAnswer records have `explanationText = null` (valid)
- No breaking changes to existing queries
- All existing code continues to work without modifications

## Rollback Instructions

If you need to revert this migration:

```sql
-- Remove columns from Question table
ALTER TABLE "Question" DROP COLUMN IF EXISTS "allowTextExplanation";
ALTER TABLE "Question" DROP COLUMN IF EXISTS "explanationMaxLength";
ALTER TABLE "Question" DROP COLUMN IF EXISTS "explanationLabel";

-- Remove column from ResponseAnswer table
ALTER TABLE "ResponseAnswer" DROP COLUMN IF EXISTS "explanationText";

-- Mark migration as rolled back
UPDATE "_prisma_migrations"
SET rolled_back_at = NOW()
WHERE migration_name = '20251203124139_add_yes_no_explanation_support';
```

## Next Steps (Implementation)

After the database migration is complete, the following components need to be implemented:

1. **QuestionForm Component** (Admin UI):
   - Add checkbox: "אפשר הסבר טקסטואלי"
   - Add number input: "אורך מקסימלי להסבר" (default: 500)
   - Add text input: "תווית שדה ההסבר" (default: "הוסף הסבר (אופציונלי)")
   - Conditional display: Only show explanation fields for YES_NO question type

2. **QuestionDisplay Component** (Public UI):
   - After user selects YES or NO, conditionally show textarea if `allowTextExplanation=true`
   - Display `explanationLabel` above textarea
   - Enforce `explanationMaxLength` with character counter
   - Optional validation: User can submit without explanation

3. **Server Actions**:
   - Update `submitQuestionnaireResponse()` to accept `explanationText` in answers
   - Update validation to check explanation length against `explanationMaxLength`
   - Store `explanationText` in ResponseAnswer table

4. **Admin Response Viewer**:
   - Display explanation text below YES/NO answer in response detail dialog
   - Show "(אין הסבר)" if user didn't provide explanation
   - Include explanation text in Excel export

5. **Excel Export**:
   - Add "הסבר" column after YES/NO answer column
   - Include explanation text (or empty cell if null)

## File Summary

| File | Status | Changes |
|------|--------|---------|
| `prisma/questionnaire.schema.prisma` | ✅ Updated | Added 3 fields to Question, 1 field to ResponseAnswer |
| `lib/validation/questionnaire-validation.ts` | ✅ Updated | Added Zod validation for new fields |
| `prisma/migrations-questionnaire/20251203124139_add_yes_no_explanation_support/migration.sql` | ✅ Created | Migration SQL file |
| `.prisma/questionnaire-client/` | ✅ Generated | Prisma client with updated types |

## Testing Checklist

- [ ] Migration SQL file created
- [ ] Prisma client generated successfully
- [ ] TypeScript compilation passes (`npm run build`)
- [ ] Migration applied to development database
- [ ] Question table has 3 new columns
- [ ] ResponseAnswer table has 1 new column
- [ ] Question ID 10 updated with `allowTextExplanation=true`
- [ ] Test script runs successfully
- [ ] No breaking changes to existing code
- [ ] Documentation updated

## Support

If you encounter issues with this migration:

1. Check database connection: `npx prisma studio --schema prisma/questionnaire.schema.prisma`
2. Verify migrations status: `npx prisma migrate status --schema prisma/questionnaire.schema.prisma`
3. Review error logs in terminal
4. Check Prisma migration history: `SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC;`

---

**Migration Completed**: 2025-12-03
**Author**: Gal (Database Architect)
**Schema Version**: 3 (after custom fields system)

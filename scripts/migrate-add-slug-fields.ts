/**
 * Safe Migration Script: Add slug and isPublished fields to Questionnaire table
 *
 * This script adds the new fields to the questionnaire database WITHOUT affecting
 * the main database or existing data.
 *
 * Steps:
 * 1. Check if columns already exist
 * 2. Add slug column (nullable, unique)
 * 3. Add isPublished column (default false)
 * 4. Add indexes for performance
 * 5. Backfill slug for existing questionnaires
 * 6. Backfill isPublished from isActive
 */

import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function addSlugAndPublishedFields() {
  console.log('🚀 Starting migration: Add slug and isPublished fields...\n');

  try {
    // Step 1: Check if columns already exist
    console.log('Step 1: Checking if columns exist...');
    const tableInfo = await prismaQuestionnaire.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name::text
      FROM information_schema.columns
      WHERE table_name = 'Questionnaire'
      AND table_schema = 'public'
    `;

    const existingColumns = tableInfo.map(row => row.column_name);
    console.log('✓ Existing columns:', existingColumns.join(', '));

    const hasSlug = existingColumns.includes('slug');
    const hasIsPublished = existingColumns.includes('isPublished');

    // Step 2: Add slug column if it doesn't exist
    if (!hasSlug) {
      console.log('\nStep 2: Adding slug column...');
      await prismaQuestionnaire.$executeRaw`
        ALTER TABLE "Questionnaire"
        ADD COLUMN "slug" TEXT
      `;
      console.log('✓ Added slug column (nullable)');

      // Add unique constraint (will be enforced after backfill)
      console.log('  Adding unique constraint on slug...');
      await prismaQuestionnaire.$executeRaw`
        CREATE UNIQUE INDEX "Questionnaire_slug_key"
        ON "Questionnaire"("slug")
        WHERE "slug" IS NOT NULL
      `;
      console.log('✓ Added unique index on slug');

      // Add regular index
      console.log('  Adding index on slug...');
      await prismaQuestionnaire.$executeRaw`
        CREATE INDEX "Questionnaire_slug_idx"
        ON "Questionnaire"("slug")
      `;
      console.log('✓ Added index on slug');
    } else {
      console.log('\nStep 2: slug column already exists ✓');
    }

    // Step 3: Add isPublished column if it doesn't exist
    if (!hasIsPublished) {
      console.log('\nStep 3: Adding isPublished column...');
      await prismaQuestionnaire.$executeRaw`
        ALTER TABLE "Questionnaire"
        ADD COLUMN "isPublished" BOOLEAN DEFAULT false NOT NULL
      `;
      console.log('✓ Added isPublished column (default: false)');

      // Add index
      console.log('  Adding index on isPublished...');
      await prismaQuestionnaire.$executeRaw`
        CREATE INDEX "Questionnaire_isPublished_idx"
        ON "Questionnaire"("isPublished")
      `;
      console.log('✓ Added index on isPublished');
    } else {
      console.log('\nStep 3: isPublished column already exists ✓');
    }

    // Step 4: Generate slugs for existing questionnaires
    console.log('\nStep 4: Backfilling slugs for existing questionnaires...');
    const questionnaires = await prismaQuestionnaire.questionnaire.findMany({
      select: { id: true, title: true, slug: true },
    });

    console.log(`Found ${questionnaires.length} questionnaire(s)`);

    for (const q of questionnaires) {
      if (!q.slug) {
        // Generate simple slug: questionnaire-{id}
        const slug = `questionnaire-${q.id}`;

        await prismaQuestionnaire.questionnaire.update({
          where: { id: q.id },
          data: { slug },
        });

        console.log(`  ✓ Generated slug for "${q.title}": ${slug}`);
      } else {
        console.log(`  ✓ "${q.title}" already has slug: ${q.slug}`);
      }
    }

    // Step 5: Backfill isPublished from isActive
    console.log('\nStep 5: Backfilling isPublished from isActive...');
    const result = await prismaQuestionnaire.$executeRaw`
      UPDATE "Questionnaire"
      SET "isPublished" = "isActive"
      WHERE "isPublished" = false AND "isActive" = true
    `;
    console.log(`✓ Updated ${result} questionnaire(s) (isPublished = isActive)`);

    // Step 6: Verify migration
    console.log('\nStep 6: Verifying migration...');
    const updatedQuestionnaires = await prismaQuestionnaire.questionnaire.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        isPublished: true,
      },
    });

    console.log('\n📊 Migration Results:');
    console.log('─'.repeat(80));
    updatedQuestionnaires.forEach(q => {
      console.log(`ID: ${q.id} | Title: ${q.title}`);
      console.log(`  Slug: ${q.slug || '(null)'}`);
      console.log(`  isActive: ${q.isActive} | isPublished: ${q.isPublished}`);
      console.log('─'.repeat(80));
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update Prisma schema to make slug required (NOT NULL)');
    console.log('2. Run: npx prisma generate --schema prisma/questionnaire.schema.prisma');
    console.log('3. Test the application with new fields\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prismaQuestionnaire.$disconnect();
  }
}

// Run migration
addSlugAndPublishedFields()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

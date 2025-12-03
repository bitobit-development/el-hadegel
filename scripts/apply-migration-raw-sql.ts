import { prismaQuestionnaire } from '../lib/prisma-questionnaire';

async function applyMigration() {
  try {
    console.log('Applying explanation feature migration...\n');

    // Add columns to Question table
    console.log('1. Adding columns to Question table...');
    await prismaQuestionnaire.$executeRawUnsafe(`
      ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "allowTextExplanation" BOOLEAN NOT NULL DEFAULT false
    `);
    await prismaQuestionnaire.$executeRawUnsafe(`
      ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "explanationMaxLength" INTEGER DEFAULT 500
    `);
    await prismaQuestionnaire.$executeRawUnsafe(`
      ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "explanationLabel" TEXT
    `);
    console.log('   ✅ Question table updated');

    // Add column to ResponseAnswer table
    console.log('\n2. Adding column to ResponseAnswer table...');
    await prismaQuestionnaire.$executeRawUnsafe(`
      ALTER TABLE "ResponseAnswer" ADD COLUMN IF NOT EXISTS "explanationText" TEXT
    `);
    console.log('   ✅ ResponseAnswer table updated');

    // Update Question ID 10
    console.log('\n3. Updating Question ID 10...');
    await prismaQuestionnaire.$executeRawUnsafe(`
      UPDATE "Question"
      SET "allowTextExplanation" = true,
          "explanationLabel" = 'הוסף הסבר (אופציונלי)',
          "explanationMaxLength" = 500
      WHERE "id" = 10
    `);
    console.log('   ✅ Question ID 10 updated');

    // Verify the update
    console.log('\n4. Verifying Question ID 10...');
    const result: any = await prismaQuestionnaire.$queryRawUnsafe(`
      SELECT id, "questionText", "allowTextExplanation", "explanationLabel", "explanationMaxLength"
      FROM "Question"
      WHERE "id" = 10
    `);

    if (result && result.length > 0) {
      const q = result[0];
      console.log(`   Question: "${q.questionText}"`);
      console.log(`   allowTextExplanation: ${q.allowTextExplanation}`);
      console.log(`   explanationLabel: ${q.explanationLabel}`);
      console.log(`   explanationMaxLength: ${q.explanationMaxLength}`);
    }

    console.log('\n✅ Migration completed successfully!');

    await prismaQuestionnaire.$disconnect();
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await prismaQuestionnaire.$disconnect();
    process.exit(1);
  }
}

applyMigration();

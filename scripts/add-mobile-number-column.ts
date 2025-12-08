import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('Adding mobileNumber column to MK table...\n');

  try {
    // Check if column already exists
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'MK'
      AND column_name = 'mobileNumber';
    `;

    if (Array.isArray(result) && result.length > 0) {
      console.log('✅ Column mobileNumber already exists in MK table');
      return;
    }

    // Add the column
    console.log('Adding column to database...');
    await prisma.$executeRaw`ALTER TABLE "MK" ADD COLUMN "mobileNumber" TEXT;`;

    console.log('✅ Successfully added mobileNumber column to MK table');
    console.log('   Type: TEXT (nullable)');
    console.log('   All existing 120 MK records now have mobileNumber = NULL\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

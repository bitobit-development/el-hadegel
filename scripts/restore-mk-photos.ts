import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import Database from 'better-sqlite3';

// Connect to local SQLite database to read photo URLs
const localDb = new Database('./prisma/dev.db');

async function main() {
  console.log('🔄 Starting photo URL restoration from local DB to Neon...\n');

  // Get all MK photo URLs from local SQLite database
  const localMKs = localDb.prepare(`
    SELECT id, nameHe, photoUrl
    FROM MK
    WHERE photoUrl IS NOT NULL
    ORDER BY id ASC
  `).all() as Array<{ id: number; nameHe: string; photoUrl: string }>;

  console.log(`📊 Found ${localMKs.length} MKs with photo URLs in local database\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const mk of localMKs) {
    try {
      // Update photo URL in Neon database
      await prisma.mK.update({
        where: { id: mk.id },
        data: { photoUrl: mk.photoUrl },
      });

      console.log(`✅ Updated: ${mk.nameHe} (ID: ${mk.id})`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${mk.nameHe} (ID: ${mk.id}):`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully updated: ${updatedCount} MKs`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n✨ Done!`);
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    localDb.close();
    await prisma.$disconnect();
  });

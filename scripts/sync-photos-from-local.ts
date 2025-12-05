import 'dotenv/config';
import Database from 'better-sqlite3';
import prisma from '../lib/prisma.js';

async function syncPhotosFromLocal() {
  console.log('🔄 Syncing photo URLs from local database to production...\n');

  // Local database (SQLite)
  const localDb = new Database('./prisma/dev.db', { readonly: true });

  // Production database (Neon via existing prisma client)
  const prodPrisma = prisma;

  try {
    // Fetch all MKs from local database using SQL
    const localMKs = localDb.prepare('SELECT mkId, nameHe, photoUrl FROM MK ORDER BY mkId ASC').all() as Array<{
      mkId: number;
      nameHe: string;
      photoUrl: string;
    }>;

    console.log(`📊 Found ${localMKs.length} MKs in local database\n`);

    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    for (const localMK of localMKs) {
      try {
        // Check if MK exists in production
        const prodMK = await prodPrisma.mK.findUnique({
          where: { mkId: localMK.mkId },
          select: { photoUrl: true },
        });

        if (!prodMK) {
          console.log(`⚠️  ${localMK.nameHe} (${localMK.mkId}) - Not found in production DB`);
          failed++;
          continue;
        }

        // Update if URLs are different
        if (localMK.photoUrl !== prodMK.photoUrl) {
          await prodPrisma.mK.update({
            where: { mkId: localMK.mkId },
            data: { photoUrl: localMK.photoUrl },
          });
          console.log(`✅ ${localMK.nameHe} (${localMK.mkId}) - Updated`);
          updated++;
        } else {
          unchanged++;
        }
      } catch (error: any) {
        console.log(`❌ ${localMK.nameHe} (${localMK.mkId}) - Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ℹ️  Unchanged: ${unchanged}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📋 Total: ${localMKs.length}`);
  } catch (error) {
    console.error('Error syncing photos:', error);
  } finally {
    localDb.close();
    await prodPrisma.$disconnect();
  }
}

syncPhotosFromLocal().catch(console.error);

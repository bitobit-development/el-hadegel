import 'dotenv/config';
import prisma from '../lib/prisma.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function syncPhotos() {
  console.log('🔄 Syncing photo URLs from local database to production...\n');

  try {
    // Extract photo URLs from local SQLite database
    const { stdout } = await execAsync(
      'sqlite3 prisma/dev.db "SELECT mkId, photoUrl FROM MK ORDER BY mkId ASC"'
    );

    const lines = stdout.trim().split('\n');
    console.log(`📊 Found ${lines.length} MKs in local database\n`);

    let updated = 0;
    let unchanged = 0;
    let failed = 0;

    for (const line of lines) {
      const [mkIdStr, photoUrl] = line.split('|');
      const mkId = parseInt(mkIdStr);

      if (!mkId || !photoUrl) {
        console.log(`⚠️  Skipping invalid line: ${line}`);
        failed++;
        continue;
      }

      try {
        // Get current production URL
        const prodMK = await prisma.mK.findUnique({
          where: { mkId },
          select: { nameHe: true, photoUrl: true },
        });

        if (!prodMK) {
          console.log(`⚠️  MK ${mkId} not found in production`);
          failed++;
          continue;
        }

        // Update if different
        if (prodMK.photoUrl !== photoUrl) {
          await prisma.mK.update({
            where: { mkId },
            data: { photoUrl },
          });
          console.log(`✅ ${prodMK.nameHe} (${mkId}) - Updated`);
          updated++;
        } else {
          unchanged++;
        }
      } catch (error: any) {
        console.log(`❌ MK ${mkId} - Error: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ℹ️  Unchanged: ${unchanged}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📋 Total: ${lines.length}`);
  } catch (error) {
    console.error('Error syncing photos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncPhotos().catch(console.error);

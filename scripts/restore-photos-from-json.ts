import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import * as fs from 'fs';

interface MKPhoto {
  id: number;
  nameHe: string;
  photoUrl: string;
}

async function main() {
  console.log('🔄 Restoring MK photo URLs from JSON export...\n');

  // Read the exported JSON
  const jsonData = fs.readFileSync('/tmp/mk-photos.json', 'utf-8');
  const mkPhotos: MKPhoto[] = JSON.parse(jsonData);

  console.log(`📊 Found ${mkPhotos.length} MK photo URLs to restore\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const mkPhoto of mkPhotos) {
    try {
      // Update photo URL in Neon database
      await prisma.mK.update({
        where: { id: mkPhoto.id },
        data: { photoUrl: mkPhoto.photoUrl },
      });

      console.log(`✅ Updated: ${mkPhoto.nameHe} (ID: ${mkPhoto.id})`);
      console.log(`   Photo: ${mkPhoto.photoUrl}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${mkPhoto.nameHe} (ID: ${mkPhoto.id}):`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully updated: ${updatedCount} MKs`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n✨ Done! MK photos should now display correctly with individual timestamp suffixes.`);
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function main() {
  console.log('🔄 Updating MK photo URLs using Knesset CDN pattern...\n');

  // Get all MKs
  const mks = await prisma.mK.findMany({
    select: { id: true, mkId: true, nameHe: true, photoUrl: true },
    orderBy: { id: 'asc' },
  });

  console.log(`📊 Found ${mks.length} MKs in database\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const mk of mks) {
    try {
      // Generate photo URL using the Knesset's CDN pattern (same as seed.ts)
      const photoUrl = `https://fs.knesset.gov.il/globaldocs/MK/${mk.mkId}/1_${mk.mkId}_3_1732.jpeg`;

      // Update photo URL
      await prisma.mK.update({
        where: { id: mk.id },
        data: { photoUrl },
      });

      console.log(`✅ Updated: ${mk.nameHe} (MK ID: ${mk.mkId})`);
      console.log(`   Photo: ${photoUrl}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error updating ${mk.nameHe} (ID: ${mk.id}):`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully updated: ${updatedCount} MKs`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n✨ Done! MK photos should now display on the website.`);
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

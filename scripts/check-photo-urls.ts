import 'dotenv/config';
import prisma from '../lib/prisma';

async function checkPhotoUrls() {
  console.log('🔍 Checking photo URL accessibility for all 120 MKs...\n');

  const mks = await prisma.mK.findMany({
    select: {
      mkId: true,
      nameHe: true,
      photoUrl: true,
    },
    orderBy: { nameHe: 'asc' },
  });

  let working = 0;
  let broken = 0;
  const brokenList: string[] = [];

  for (const mk of mks) {
    try {
      const response = await fetch(mk.photoUrl, { method: 'HEAD' });
      if (response.ok) {
        working++;
      } else {
        broken++;
        brokenList.push(`${mk.nameHe} (ID: ${mk.mkId}) - HTTP ${response.status}`);
      }
    } catch (e: any) {
      broken++;
      brokenList.push(`${mk.nameHe} (ID: ${mk.mkId}) - ${e.message}`);
    }
  }

  console.log(`✅ Working photos: ${working}/${mks.length}`);
  console.log(`❌ Broken photos: ${broken}/${mks.length}\n`);

  if (brokenList.length > 0) {
    console.log('📋 Broken photo URLs:');
    brokenList.forEach(mk => console.log(`  - ${mk}`));
  }

  await prisma.$disconnect();
}

checkPhotoUrls().catch(console.error);

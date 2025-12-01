import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function testPhotoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking all MK photo URLs...\n');

  const allMKs = await prisma.mK.findMany({
    select: {
      id: true,
      nameHe: true,
      photoUrl: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Total MKs to check: ${allMKs.length}\n`);

  let workingCount = 0;
  let brokenCount = 0;
  let nullCount = 0;
  const brokenMKs: Array<{ id: number; name: string; url: string }> = [];

  for (const mk of allMKs) {
    if (!mk.photoUrl) {
      nullCount++;
      console.log(`⚪ MK ${mk.id} (${mk.nameHe}): No photo URL`);
      continue;
    }

    const isWorking = await testPhotoUrl(mk.photoUrl);

    if (isWorking) {
      workingCount++;
      console.log(`✅ MK ${mk.id} (${mk.nameHe}): Photo OK`);
    } else {
      brokenCount++;
      brokenMKs.push({ id: mk.id, name: mk.nameHe, url: mk.photoUrl });
      console.log(`❌ MK ${mk.id} (${mk.nameHe}): Photo 404 - ${mk.photoUrl}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Working photos: ${workingCount}`);
  console.log(`   ❌ Broken photos: ${brokenCount}`);
  console.log(`   ⚪ No photo URL: ${nullCount}`);
  console.log(`   📝 Total: ${allMKs.length}`);

  if (brokenCount > 0) {
    console.log(`\n🔧 Fixing broken photo URLs by setting them to null...`);
    console.log(`   (This will show initials fallback instead)\n`);

    for (const mk of brokenMKs) {
      await prisma.mK.update({
        where: { id: mk.id },
        data: { photoUrl: null },
      });
      console.log(`   Fixed: ${mk.name} (ID: ${mk.id})`);
    }

    console.log(`\n✅ Fixed ${brokenCount} broken photo URLs!`);
    console.log(`   These MKs will now show initials fallback.`);
  }

  console.log(`\n✨ Done!`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

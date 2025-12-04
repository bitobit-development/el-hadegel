/**
 * Clear Invalid Photo URLs Script
 *
 * This script removes photoUrl values for MKs whose images return 404
 * from the Knesset CDN, allowing the UI to display initials fallback instead.
 *
 * Issue: Only Avi Dichter's image (MK 771) loads successfully.
 * All other 119 MK images return 404 from fs.knesset.gov.il
 *
 * Solution: Set photoUrl to NULL for MKs with non-working images.
 */

import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';

async function testImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok; // Returns true if status is 200-299
  } catch (error) {
    return false;
  }
}

async function clearInvalidPhotoUrls() {
  console.log('🔍 Fetching all MKs with photoUrl...');

  const mks = await prisma.mK.findMany({
    where: {
      photoUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      mkId: true,
      nameHe: true,
      photoUrl: true,
    },
  });

  console.log(`Found ${mks.length} MKs with photoUrl values\n`);

  let validCount = 0;
  let invalidCount = 0;

  for (const mk of mks) {
    if (!mk.photoUrl) continue;

    process.stdout.write(`Testing ${mk.nameHe} (MK ${mk.mkId})... `);

    const isValid = await testImageUrl(mk.photoUrl);

    if (isValid) {
      console.log('✅ VALID');
      validCount++;
    } else {
      console.log('❌ INVALID - Clearing photoUrl');
      await prisma.mK.update({
        where: { id: mk.id },
        data: { photoUrl: null },
      });
      invalidCount++;
    }

    // Add small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Valid images: ${validCount}`);
  console.log(`   Invalid images cleared: ${invalidCount}`);
  console.log(`   Total processed: ${mks.length}`);
}

async function main() {
  try {
    await clearInvalidPhotoUrls();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

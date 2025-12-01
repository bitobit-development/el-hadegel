import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function main() {
  console.log('🔍 Checking MK database integrity...\n');

  const totalCount = await prisma.mK.count();
  console.log(`📊 Total MKs: ${totalCount}\n`);

  const positionCounts = await prisma.mK.groupBy({
    by: ['currentPosition'],
    _count: { id: true }
  });

  console.log('📈 Position distribution:');
  positionCounts.forEach(p => {
    console.log(`   ${p.currentPosition}: ${p._count.id} MKs`);
  });

  console.log('\n👥 Sample of first 10 MKs:');
  const sample = await prisma.mK.findMany({
    take: 10,
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nameHe: true,
      faction: true,
      currentPosition: true,
      photoUrl: true
    }
  });

  sample.forEach(mk => {
    console.log(`   ID: ${mk.id} | ${mk.nameHe} | ${mk.faction} | Position: ${mk.currentPosition} | Photo: ${mk.photoUrl ? '✅' : '❌'}`);
  });

  console.log('\n🔍 Checking for MKs without photos:');
  const withoutPhotos = await prisma.mK.count({
    where: { photoUrl: null }
  });
  console.log(`   MKs without photos: ${withoutPhotos}`);

  console.log('\n✅ Database check complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error checking database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from '@/lib/prisma';

async function listCoalitionMKsWithoutMobile() {
  console.log('📋 Coalition MKs WITHOUT Mobile Numbers\n');
  console.log('==========================================\n');

  const coalitionFactions = [
    'הליכוד',
    'התאחדות הספרדים שומרי תורה',
    'יהדות התורה',
    'הציונות הדתית',
    'עוצמה יהודית',
    'נעם',
  ];

  try {
    const mksWithoutMobile = await prisma.mK.findMany({
      where: {
        faction: { in: coalitionFactions },
        mobileNumber: null,
      },
      select: {
        id: true,
        nameHe: true,
        faction: true,
      },
      orderBy: {
        faction: 'asc',
      },
    });

    console.log(`Found ${mksWithoutMobile.length} coalition MKs without mobile numbers:\n`);

    let currentFaction = '';
    mksWithoutMobile.forEach(mk => {
      if (mk.faction !== currentFaction) {
        currentFaction = mk.faction;
        console.log(`\n${currentFaction}:`);
      }
      console.log(`  - ${mk.nameHe} (ID: ${mk.id})`);
    });

    console.log('\n==========================================');
    console.log(`Total: ${mksWithoutMobile.length} MKs need mobile numbers`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

listCoalitionMKsWithoutMobile();

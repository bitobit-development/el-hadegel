import prisma from '@/lib/prisma';

async function checkMobileColumn() {
  try {
    console.log('🔍 Checking mobileNumber column in database...\n');

    // Count total MKs
    const totalCount = await prisma.mK.count();
    console.log(`Total MKs: ${totalCount}`);

    // Count MKs with mobile numbers
    const withMobileCount = await prisma.mK.count({
      where: {
        mobileNumber: {
          not: null,
        },
      },
    });
    console.log(`MKs with mobile numbers: ${withMobileCount}\n`);

    // Sample coalition MKs with mobile numbers
    const coalitionMKsWithMobile = await prisma.mK.findMany({
      where: {
        mobileNumber: {
          not: null,
        },
      },
      select: {
        id: true,
        nameHe: true,
        faction: true,
        mobileNumber: true,
      },
      take: 10,
    });

    console.log('Sample MKs with mobile numbers:');
    coalitionMKsWithMobile.forEach((mk) => {
      console.log(`  - ${mk.nameHe} (${mk.faction}): ${mk.mobileNumber}`);
    });

    // Check coalition members specifically
    const coalitionFactions = [
      'הליכוד',
      'התאחדות הספרדים שומרי תורה',
      'יהדות התורה',
      'הציונות הדתית',
      'עוצמה יהודית',
      'נעם',
    ];

    const coalitionWithMobile = await prisma.mK.count({
      where: {
        faction: { in: coalitionFactions },
        mobileNumber: { not: null },
      },
    });

    console.log(`\n📊 Coalition members with mobile: ${coalitionWithMobile}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkMobileColumn();

import prisma from '@/lib/prisma';

async function updateYuliMobile() {
  console.log('📱 Updating יולי יואל אדלשטיין mobile number\n');

  try {
    const result = await prisma.mK.update({
      where: { id: 53 },
      data: { mobileNumber: '0503334298' },
      select: {
        id: true,
        nameHe: true,
        faction: true,
        mobileNumber: true,
      },
    });

    console.log('✅ Successfully updated:');
    console.log(`   Name: ${result.nameHe}`);
    console.log(`   Faction: ${result.faction}`);
    console.log(`   Mobile: ${result.mobileNumber}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateYuliMobile();

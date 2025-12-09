import prisma from '@/lib/prisma';

async function updateDanIlouzMobile() {
  console.log('📱 Updating דן אילוז mobile number\n');

  const name = 'דן אילוז';
  const mobileNumber = '0549418414'; // Normalized format

  try {
    // Find MK by name
    const mk = await prisma.mK.findFirst({
      where: {
        nameHe: {
          contains: 'דן אילוז',
        },
      },
    });

    if (!mk) {
      console.error('❌ MK not found:', name);
      await prisma.$disconnect();
      process.exit(1);
    }

    // Update mobile number
    const result = await prisma.mK.update({
      where: { id: mk.id },
      data: { mobileNumber },
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

updateDanIlouzMobile();

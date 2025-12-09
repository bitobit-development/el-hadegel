import prisma from '@/lib/prisma';

async function findMKByName() {
  const searchName = 'יולי';

  console.log(`🔍 Searching for MKs with name containing: "${searchName}"\n`);

  try {
    const mks = await prisma.mK.findMany({
      where: {
        nameHe: {
          contains: searchName,
        },
      },
      select: {
        id: true,
        nameHe: true,
        faction: true,
        mobileNumber: true,
      },
    });

    if (mks.length === 0) {
      console.log('❌ No MKs found with that name');
    } else {
      console.log(`Found ${mks.length} MK(s):\n`);
      mks.forEach(mk => {
        console.log(`  ID: ${mk.id}`);
        console.log(`  Name: ${mk.nameHe}`);
        console.log(`  Faction: ${mk.faction}`);
        console.log(`  Mobile: ${mk.mobileNumber || 'NULL'}`);
        console.log('');
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

findMKByName();

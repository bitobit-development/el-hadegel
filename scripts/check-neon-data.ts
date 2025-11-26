import 'dotenv/config';
import prisma from '../lib/prisma';

async function check() {
  const mks = await prisma.mK.findMany({
    take: 3,
    select: {
      mkId: true,
      nameHe: true,
      photoUrl: true,
      phone: true,
      email: true,
    },
  });

  console.log('Neon Database MK Data:');
  console.log(JSON.stringify(mks, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);

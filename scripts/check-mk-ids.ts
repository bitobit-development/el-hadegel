import prisma from '../lib/prisma';

async function checkMKs() {
  const names = [
    'אבי מעוז'
  ];

  console.log('Checking MK IDs from database:\n');

  for (const name of names) {
    const mk = await prisma.mK.findFirst({
      where: {
        nameHe: {
          contains: name
        }
      },
      select: {
        id: true,
        nameHe: true,
        faction: true
      }
    });

    if (mk) {
      console.log(`✓ ID: ${mk.id.toString().padStart(4)} | ${mk.nameHe} | ${mk.faction}`);
    } else {
      console.log(`✗ NOT FOUND: ${name}`);
    }
  }

  await prisma.$disconnect();
}

checkMKs().catch(console.error);

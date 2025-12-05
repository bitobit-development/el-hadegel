// Set DATABASE_URL environment variable
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_P9rCFcepihj8@ep-quiet-truth-ah8me5gh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COALITION_FACTIONS = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה',
  'יהדות התורה',
  'הציונות הדתית',
  'עוצמה יהודית',
  'נעם'
];

async function main() {
  console.log('Fetching coalition members...\n');

  const coalitionMKs = await prisma.mK.findMany({
    where: {
      faction: {
        in: COALITION_FACTIONS
      }
    },
    select: {
      id: true,
      name: true,
      faction: true
    },
    orderBy: [
      { faction: 'asc' },
      { name: 'asc' }
    ]
  });

  console.log('Total coalition members:', coalitionMKs.length);
  console.log('\nBy faction:');

  const byFaction = coalitionMKs.reduce((acc, mk) => {
    if (!acc[mk.faction]) acc[mk.faction] = [];
    acc[mk.faction].push(mk);
    return acc;
  }, {} as Record<string, typeof coalitionMKs>);

  for (const [faction, mks] of Object.entries(byFaction)) {
    console.log(`\n${faction} (${mks.length} members):`);
    mks.forEach(mk => {
      console.log(`  ID: ${mk.id} - ${mk.name}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

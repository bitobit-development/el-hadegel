// Set DATABASE_URL before any imports
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_P9rCFcepihj8@ep-quiet-truth-ah8me5gh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

import { prisma } from '../lib/prisma';

const COALITION_FACTIONS = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה',
  'יהדות התורה',
  'הציונות הדתית',
  'עוצמה יהודית',
  'נעם'
];

async function main() {
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

  // Also output as JSON for easy parsing
  console.log('\n\n=== JSON OUTPUT ===');
  console.log(JSON.stringify(byFaction, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

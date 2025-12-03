#!/usr/bin/env tsx

import prisma from '../lib/prisma';

async function getHighProfileMKs() {
  console.log('🎯 High-Profile Coalition MKs for Research\n');
  console.log('Searching for key government figures...\n');

  // Key names to search for
  const keyNames = [
    'נתניהו',           // Netanyahu
    'לוין',             // Levin
    'בן גביר',          // Ben-Gvir
    'סמוטריץ',          // Smotrich
    'דרעי',             // Deri
    'גלנט',             // Gallant
    'כץ',               // Katz
    'רגב',              // Regev
    'אלקין',            // Elkin
    'דיכטר',            // Dichter
    'אוחנה',            // Ohana
    'מעוז',             // Maoz
    'גפני',             // Gafni
    'ליצמן',            // Litzman
  ];

  const mks = await prisma.mK.findMany({
    where: {
      faction: {
        in: [
          'הליכוד',
          'התאחדות הספרדים שומרי תורה',
          'יהדות התורה',
          'הציונות הדתית',
          'עוצמה יהודית',
          'נעם - בראשות אבי מעוז'
        ]
      }
    },
    select: {
      id: true,
      nameHe: true,
      faction: true,
      currentPosition: true,
      phone: true,
      email: true,
    },
    orderBy: { nameHe: 'asc' }
  });

  // Filter for high-profile names
  const highProfile = mks.filter(mk =>
    keyNames.some(name => mk.nameHe.includes(name))
  );

  console.log(`Found ${highProfile.length} high-profile MKs:\n`);

  highProfile.forEach((mk, index) => {
    console.log(`${index + 1}. ID: ${mk.id}`);
    console.log(`   Name: ${mk.nameHe}`);
    console.log(`   Faction: ${mk.faction}`);
    console.log(`   Position: ${mk.currentPosition || 'MK'}`);
    console.log(`   Phone: ${mk.phone || 'N/A'}`);
    console.log(`   Email: ${mk.email || 'N/A'}`);
    console.log('');
  });

  // Also show all coalition MKs for reference
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nAll ${mks.length} Coalition MKs (for reference):\n`);

  // Group by faction
  const byFaction = mks.reduce((acc, mk) => {
    if (!acc[mk.faction]) acc[mk.faction] = [];
    acc[mk.faction].push(mk);
    return acc;
  }, {} as Record<string, typeof mks>);

  Object.entries(byFaction).forEach(([faction, members]) => {
    console.log(`\n${faction} (${members.length} members):`);
    members.forEach(mk => {
      console.log(`  - ID ${mk.id}: ${mk.nameHe}`);
    });
  });

  await prisma.$disconnect();
}

getHighProfileMKs().catch(console.error);

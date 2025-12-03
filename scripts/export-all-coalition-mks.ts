#!/usr/bin/env tsx

import prisma from '../lib/prisma';
import { writeFile } from 'fs/promises';

async function exportCoalitionMKs() {
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
    orderBy: [
      { faction: 'asc' },
      { nameHe: 'asc' }
    ]
  });

  // Group by faction
  const byFaction = mks.reduce((acc, mk) => {
    if (!acc[mk.faction]) acc[mk.faction] = [];
    acc[mk.faction].push(mk);
    return acc;
  }, {} as Record<string, typeof mks>);

  // Create CSV content
  const csvLines = ['MK_ID,Name_Hebrew,Faction,Position,Phone,Email,Research_Status'];

  Object.entries(byFaction).forEach(([faction, members]) => {
    members.forEach(mk => {
      const line = [
        mk.id,
        `"${mk.nameHe}"`,
        `"${mk.faction}"`,
        `"${mk.currentPosition || 'MK'}"`,
        `"${mk.phone || ''}"`,
        `"${mk.email || ''}"`,
        'PENDING'
      ].join(',');
      csvLines.push(line);
    });
  });

  const csv = csvLines.join('\n');
  await writeFile('coalition-mks-research-tracker.csv', csv, 'utf8');

  console.log('📊 Coalition MKs Research Tracker\n');
  console.log(`Total Coalition MKs: ${mks.length}\n`);

  Object.entries(byFaction).forEach(([faction, members]) => {
    console.log(`\n${faction} (${members.length} members):`);
    members.forEach((mk, index) => {
      console.log(`  ${index + 1}. ID ${mk.id}: ${mk.nameHe}`);
    });
  });

  console.log(`\n✅ Exported to: coalition-mks-research-tracker.csv`);
  console.log(`\n📝 Start researching by updating Research_Status column to: RESEARCHING → COMPLETE`);

  await prisma.$disconnect();
}

exportCoalitionMKs().catch(console.error);

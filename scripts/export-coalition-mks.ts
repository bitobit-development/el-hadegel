import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Coalition parties in the 25th Knesset
const COALITION_PARTIES = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה תנועתו של מרן הרב עובדיה יוסף זצ"ל',
  'יהדות התורה',
  'הציונות הדתית בראשות בצלאל סמוטריץ\'',
  'עוצמה יהודית בראשות איתמר בן גביר',
  'נעם - בראשות אבי מעוז',
];

async function exportCoalitionMKs() {
  console.log('📊 Exporting Coalition MKs to CSV...\n');

  try {
    // Fetch all MKs from coalition parties
    const coalitionMKs = await prisma.mK.findMany({
      where: {
        faction: {
          in: COALITION_PARTIES,
        },
      },
      orderBy: [
        { faction: 'asc' },
        { nameHe: 'asc' },
      ],
    });

    console.log(`✅ Found ${coalitionMKs.length} coalition members\n`);

    // Group by faction for summary
    const factionCounts = coalitionMKs.reduce((acc, mk) => {
      acc[mk.faction] = (acc[mk.faction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📋 Breakdown by faction:');
    Object.entries(factionCounts).forEach(([faction, count]) => {
      console.log(`   ${faction}: ${count} MKs`);
    });
    console.log('');

    // Generate CSV content with UTF-8 BOM for Hebrew support
    const BOM = '\uFEFF';
    const headers = ['MK_ID', 'Name_Hebrew', 'Faction', 'Position', 'Phone', 'Email', 'Profile_URL'];

    const csvRows = [
      headers.join(','),
      ...coalitionMKs.map(mk => {
        return [
          mk.mkId,
          `"${mk.nameHe}"`,
          `"${mk.faction}"`,
          mk.currentPosition,
          `"${mk.phone || ''}"`,
          `"${mk.email || ''}"`,
          mk.profileUrl,
        ].join(',');
      }),
    ];

    const csvContent = BOM + csvRows.join('\n');

    // Save to file
    const outputPath = join(process.cwd(), 'docs', 'mk-coalition', 'coalition-members.csv');
    writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`✅ CSV file created successfully at: ${outputPath}`);
    console.log(`📊 Total coalition members: ${coalitionMKs.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportCoalitionMKs();

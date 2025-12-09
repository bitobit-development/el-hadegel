import prisma from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

interface MKMobile {
  name: string;
  phoneNumber: string;
  faction: string;
}

function parseMDFile(filePath: string): MKMobile[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results: MKMobile[] = [];
  let currentFaction = '';

  for (const line of lines) {
    if (line.startsWith('*') && line.endsWith('*')) {
      currentFaction = line.replace(/\*/g, '').trim();
      continue;
    }

    const match = line.match(/^\d+\.\s+(.+?)\s+-\s+(.+)$/);
    if (match) {
      const name = match[1].trim();
      const phoneNumber = match[2].trim().replace(/[\s-]/g, '');
      results.push({ name, phoneNumber, faction: currentFaction });
    }
  }

  return results;
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }

  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1 : 1 - costs[s2.length] / maxLength;
}

async function showMissingCoalitionMKs() {
  console.log('❓ Coalition MKs from MD File NOT Found in Database\n');
  console.log('=======================================================\n');

  const coalitionFactions = [
    'הליכוד',
    'התאחדות הספרדים שומרי תורה',
    'יהדות התורה',
    'הציונות הדתית',
    'עוצמה יהודית',
    'נעם',
  ];

  try {
    const mdFilePath = join(process.cwd(), 'docs/MKMobile/mk-mobilenumber.md');
    const mdData = parseMDFile(mdFilePath);

    const coalitionEntries = mdData.filter(entry =>
      coalitionFactions.includes(entry.faction)
    );

    const allMKs = await prisma.mK.findMany({
      select: {
        id: true,
        nameHe: true,
        faction: true,
      },
    });

    const notFoundList: Array<{
      name: string;
      faction: string;
      phone: string;
      reason: string;
    }> = [];

    for (const entry of coalitionEntries) {
      // Try exact match
      let mk = allMKs.find(m => m.nameHe === entry.name);

      // Try partial match (for middle names)
      if (!mk) {
        const nameWords = entry.name.split(' ');
        const partialMatches = allMKs.filter(m => {
          const dbNameWords = m.nameHe.split(' ');
          return nameWords.every(word =>
            dbNameWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
          );
        });

        if (partialMatches.length === 1) {
          mk = partialMatches[0];
        }
      }

      // Try fuzzy match
      if (!mk) {
        const matches = allMKs.map(m => ({
          mk: m,
          similarity: calculateSimilarity(m.nameHe, entry.name),
        }));

        const bestMatch = matches.reduce((best, current) =>
          current.similarity > best.similarity ? current : best
        );

        if (bestMatch.similarity > 0.85) {
          mk = bestMatch.mk;
        }
      }

      if (!mk) {
        notFoundList.push({
          name: entry.name,
          faction: entry.faction,
          phone: entry.phoneNumber,
          reason: 'Not in current database (likely former MK)',
        });
      }
    }

    if (notFoundList.length === 0) {
      console.log('✅ All coalition MKs from MD file found in database!');
    } else {
      console.log(`Found ${notFoundList.length} coalition MKs from MD file not in database:\n`);

      // Group by faction
      const groupedByFaction: Record<string, typeof notFoundList> = {};
      notFoundList.forEach(item => {
        if (!groupedByFaction[item.faction]) {
          groupedByFaction[item.faction] = [];
        }
        groupedByFaction[item.faction].push(item);
      });

      for (const [faction, items] of Object.entries(groupedByFaction)) {
        console.log(`\n${faction} (${items.length} MKs):`);
        console.log('─'.repeat(50));
        items.forEach(item => {
          console.log(`  📱 ${item.name}`);
          console.log(`     Phone: ${item.phone}`);
          console.log(`     Reason: ${item.reason}\n`);
        });
      }

      console.log('\n=======================================================');
      console.log(`Total: ${notFoundList.length} coalition MKs from MD file not found`);
      console.log('\nNote: These are likely former MKs who are no longer in the Knesset.');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

showMissingCoalitionMKs();

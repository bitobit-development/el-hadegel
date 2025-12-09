import prisma from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

interface MKMobile {
  name: string;
  phoneNumber: string;
  faction: string;
}

/**
 * Parse MD file and extract MK names and phone numbers with factions
 */
function parseMDFile(filePath: string): MKMobile[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results: MKMobile[] = [];
  let currentFaction = '';

  for (const line of lines) {
    // Check if line is a faction header (starts with *)
    if (line.startsWith('*') && line.endsWith('*')) {
      currentFaction = line.replace(/\*/g, '').trim();
      continue;
    }

    // Match pattern: "Number. Name - PhoneNumber"
    const match = line.match(/^\d+\.\s+(.+?)\s+-\s+(.+)$/);
    if (match) {
      const name = match[1].trim();
      const phoneNumber = match[2].trim().replace(/[\s-]/g, '');
      results.push({ name, phoneNumber, faction: currentFaction });
    }
  }

  return results;
}

/**
 * Normalize phone number to standard format
 */
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[\s\-()]/g, '');

  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.slice(4);
  } else if (normalized.startsWith('972')) {
    normalized = '0' + normalized.slice(3);
  }

  if (!normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }

  return normalized;
}

async function findCoalitionMKsWithMiddleNames() {
  console.log('🔍 Finding Coalition MKs with Middle Names\n');
  console.log('==========================================\n');

  // Coalition factions
  const coalitionFactions = [
    'הליכוד',
    'התאחדות הספרדים שומרי תורה',
    'יהדות התורה',
    'הציונות הדתית',
    'עוצמה יהודית',
    'נעם',
  ];

  try {
    // Parse MD file
    const mdFilePath = join(process.cwd(), 'docs/MKMobile/mk-mobilenumber.md');
    const mdData = parseMDFile(mdFilePath);

    // Filter only coalition members
    const coalitionEntries = mdData.filter(entry =>
      coalitionFactions.includes(entry.faction)
    );

    console.log(`Found ${coalitionEntries.length} coalition entries in MD file\n`);

    // Get all coalition MKs from database
    const allMKs = await prisma.mK.findMany({
      where: {
        faction: { in: coalitionFactions },
      },
      select: {
        id: true,
        nameHe: true,
        faction: true,
        mobileNumber: true,
      },
    });

    console.log(`Found ${allMKs.length} coalition MKs in database\n`);

    let foundCount = 0;
    let updatedCount = 0;
    const matches: Array<{
      mdName: string;
      dbName: string;
      phone: string;
      mkId: number;
      alreadySet: boolean;
    }> = [];

    // For each entry from MD file
    for (const entry of coalitionEntries) {
      const normalizedPhone = normalizePhoneNumber(entry.phoneNumber);

      // Try exact match first
      let mk = allMKs.find(m => m.nameHe === entry.name);

      // If no exact match, try partial matching (for middle names)
      if (!mk) {
        // Split the name from MD file into words
        const nameWords = entry.name.split(' ');

        // Search for MKs where the database name contains all words from MD file name
        const partialMatches = allMKs.filter(m => {
          const dbNameWords = m.nameHe.split(' ');
          return nameWords.every(word =>
            dbNameWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
          );
        });

        if (partialMatches.length === 1) {
          mk = partialMatches[0];
          foundCount++;
          console.log(`✨ Found with middle name: "${entry.name}" → "${mk.nameHe}"`);
        } else if (partialMatches.length > 1) {
          console.log(`⚠️  Multiple matches for "${entry.name}":`);
          partialMatches.forEach(m => console.log(`     - ${m.nameHe}`));
          console.log('');
          continue;
        }
      }

      if (mk) {
        const alreadySet = !!mk.mobileNumber;
        matches.push({
          mdName: entry.name,
          dbName: mk.nameHe,
          phone: normalizedPhone,
          mkId: mk.id,
          alreadySet,
        });
      }
    }

    console.log('\n📊 Found Matches:');
    console.log('==========================================');

    // Group by already set vs needs update
    const needsUpdate = matches.filter(m => !m.alreadySet);
    const alreadySet = matches.filter(m => m.alreadySet);

    if (needsUpdate.length > 0) {
      console.log(`\n🔄 Need to update (${needsUpdate.length} MKs):\n`);
      for (const match of needsUpdate) {
        console.log(`   ${match.dbName}`);
        console.log(`   └─ Mobile: ${match.phone}\n`);
      }

      // Ask for confirmation
      console.log('💾 Updating these mobile numbers...\n');

      // Update all
      for (const match of needsUpdate) {
        await prisma.mK.update({
          where: { id: match.mkId },
          data: { mobileNumber: match.phone },
        });
        updatedCount++;
        console.log(`✅ Updated: ${match.dbName} → ${match.phone}`);
      }
    }

    if (alreadySet.length > 0) {
      console.log(`\n✓ Already set (${alreadySet.length} MKs) - skipped\n`);
    }

    console.log('\n📊 Final Summary:');
    console.log('==========================================');
    console.log(`✨ Found with middle names: ${foundCount}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Already had numbers: ${alreadySet.length}`);

    // Calculate total coalition MKs with mobile numbers
    const totalWithMobile = await prisma.mK.count({
      where: {
        faction: { in: coalitionFactions },
        mobileNumber: { not: null },
      },
    });

    console.log(`\n📱 Total coalition MKs with mobile numbers: ${totalWithMobile}/${allMKs.length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

findCoalitionMKsWithMiddleNames();

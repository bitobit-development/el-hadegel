import prisma from '@/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

interface MKMobile {
  name: string;
  phoneNumber: string;
}

/**
 * Parse MD file and extract MK names and phone numbers
 */
function parseMDFile(filePath: string): MKMobile[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results: MKMobile[] = [];

  for (const line of lines) {
    // Match pattern: "Number. Name - PhoneNumber"
    const match = line.match(/^\d+\.\s+(.+?)\s+-\s+(.+)$/);
    if (match) {
      const name = match[1].trim();
      const phoneNumber = match[2].trim().replace(/[\s-]/g, ''); // Remove spaces and dashes
      results.push({ name, phoneNumber });
    }
  }

  return results;
}

/**
 * Normalize phone number to standard format
 */
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[\s\-()]/g, '');

  // Convert international format to local
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.slice(4);
  } else if (normalized.startsWith('972')) {
    normalized = '0' + normalized.slice(3);
  }

  // Ensure starts with 0
  if (!normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }

  return normalized;
}

/**
 * Calculate string similarity (Levenshtein distance)
 */
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

async function syncMobileNumbers() {
  console.log('📱 Syncing Mobile Numbers to Neon Database\n');
  console.log('==========================================\n');

  try {
    // Parse MD file
    const mdFilePath = join(process.cwd(), 'docs/MKMobile/mk-mobilenumber.md');
    const mdData = parseMDFile(mdFilePath);
    console.log(`Found ${mdData.length} entries in MD file\n`);

    // Get all MKs from database
    const allMKs = await prisma.mK.findMany({
      select: {
        id: true,
        nameHe: true,
        faction: true,
        mobileNumber: true,
      },
    });
    console.log(`Found ${allMKs.length} MKs in database\n`);

    let updatedCount = 0;
    let alreadySetCount = 0;
    let notFoundCount = 0;
    let fuzzyMatchCount = 0;
    const notFoundNames: string[] = [];

    // Process each entry from MD file
    for (const entry of mdData) {
      const normalizedPhone = normalizePhoneNumber(entry.phoneNumber);

      // Try exact name match first
      let mk = allMKs.find(m => m.nameHe === entry.name);

      // If no exact match, try fuzzy matching
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
          fuzzyMatchCount++;
          console.log(
            `🔍 Fuzzy match: "${entry.name}" → "${mk.nameHe}" (${(bestMatch.similarity * 100).toFixed(0)}%)`
          );
        }
      }

      if (!mk) {
        notFoundCount++;
        notFoundNames.push(entry.name);
        continue;
      }

      // Check if mobile number is already set
      if (mk.mobileNumber) {
        alreadySetCount++;
        continue;
      }

      // Update mobile number
      await prisma.mK.update({
        where: { id: mk.id },
        data: { mobileNumber: normalizedPhone },
      });

      updatedCount++;
      console.log(`✅ Updated: ${mk.nameHe} → ${normalizedPhone}`);
    }

    console.log('\n📊 Summary:');
    console.log('==========================================');
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⏭️  Already had numbers: ${alreadySetCount}`);
    console.log(`🔍 Fuzzy matches used: ${fuzzyMatchCount}`);
    console.log(`❌ Not found in database: ${notFoundCount}`);

    if (notFoundNames.length > 0) {
      console.log('\n❓ MKs not found in database:');
      notFoundNames.forEach(name => console.log(`   - ${name}`));
      console.log('\nNote: These may be former MKs or name mismatches.');
    }

    console.log('\n✨ Sync complete!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncMobileNumbers();

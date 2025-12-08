import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

interface ParsedMK {
  name: string;
  mobileNumber: string;
  originalLine: string;
}

interface MatchResult {
  success: boolean;
  mkId?: number;
  dbName?: string;
  matchType?: 'exact' | 'fuzzy';
  similarity?: number;
}

interface UpdateResult {
  totalInFile: number;
  successfulUpdates: number;
  failedMatches: number;
  fuzzyMatches: number;
  skipped: number;
  updated: Array<{ name: string; mobile: string }>;
  notFound: Array<{ name: string; mobile: string }>;
  fuzzyMatchDetails: Array<{ mdName: string; dbName: string; similarity: number }>;
  skippedDetails: Array<{ name: string; reason: string }>;
}

/**
 * Parse the MD file and extract MK names and mobile numbers
 */
function parseMKMobileFile(filePath: string): ParsedMK[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const parsed: ParsedMK[] = [];

  for (const line of lines) {
    // Skip empty lines and party headers (lines starting with *)
    if (!line.trim() || line.trim().startsWith('*')) {
      continue;
    }

    // Match pattern: "Number. Name - PhoneNumber"
    // Use lastIndexOf to split on the LAST " - " to handle names with hyphens
    const match = line.match(/^\d+\.\s*(.+)$/);
    if (match) {
      const content = match[1];
      const lastDashIndex = content.lastIndexOf(' -');

      if (lastDashIndex !== -1) {
        const name = content.substring(0, lastDashIndex).trim();
        const mobile = content.substring(lastDashIndex + 2).trim();
        parsed.push({ name, mobileNumber: mobile, originalLine: line });
      }
    }
  }

  return parsed;
}

/**
 * Normalize phone number: remove spaces, dashes, and country code
 * Result: 10 digits starting with 05
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all spaces, dashes, and parentheses
  let normalized = phone.replace(/[\s\-()]/g, '');

  // Remove +972 prefix if present
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.slice(4);
  } else if (normalized.startsWith('972')) {
    normalized = '0' + normalized.slice(3);
  }

  // Validate: should be 10 digits starting with 05
  if (!/^05\d{8}$/.test(normalized)) {
    console.warn(`⚠️ Invalid phone format after normalization: ${phone} → ${normalized}`);
  }

  return normalized;
}

/**
 * Calculate simple similarity score between two strings (0-100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');

  if (s1 === s2) return 100;

  // Simple character comparison
  let matches = 0;
  const minLen = Math.min(s1.length, s2.length);
  const maxLen = Math.max(s1.length, s2.length);

  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }

  return (matches / maxLen) * 100;
}

/**
 * Find matching MK in database (exact or fuzzy)
 */
async function findMatchingMK(name: string): Promise<MatchResult> {
  // Try exact match first
  const exactMatch = await prisma.mK.findFirst({
    where: { nameHe: name },
  });

  if (exactMatch) {
    return {
      success: true,
      mkId: exactMatch.id,
      dbName: exactMatch.nameHe,
      matchType: 'exact',
      similarity: 100,
    };
  }

  // Try fuzzy matching
  const allMKs = await prisma.mK.findMany({
    select: { id: true, nameHe: true },
  });

  let bestMatch: { id: number; nameHe: string; similarity: number } | null = null;

  for (const mk of allMKs) {
    const similarity = calculateSimilarity(name, mk.nameHe);
    if (similarity >= 85 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { ...mk, similarity };
    }
  }

  if (bestMatch) {
    return {
      success: true,
      mkId: bestMatch.id,
      dbName: bestMatch.nameHe,
      matchType: 'fuzzy',
      similarity: bestMatch.similarity,
    };
  }

  return { success: false };
}

/**
 * Main update function
 */
async function updateMobileNumbers(dryRun: boolean = false): Promise<UpdateResult> {
  const filePath = path.join(process.cwd(), 'docs/MKMobile/mk-mobilenumber.md');

  console.log('📱 MK Mobile Number Update Script');
  console.log('================================\n');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Parse MD file
  console.log('📄 Parsing file:', filePath);
  const parsedMKs = parseMKMobileFile(filePath);
  console.log(`✅ Found ${parsedMKs.length} MK records\n`);

  if (parsedMKs.length === 0) {
    throw new Error('No MK records found in file');
  }

  const result: UpdateResult = {
    totalInFile: parsedMKs.length,
    successfulUpdates: 0,
    failedMatches: 0,
    fuzzyMatches: 0,
    skipped: 0,
    updated: [],
    notFound: [],
    fuzzyMatchDetails: [],
    skippedDetails: [],
  };

  // Get current database count
  const dbCount = await prisma.mK.count();
  console.log(`🗄️ Database has ${dbCount} MK records\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('🔄 Processing updates...\n');
  }

  // Process updates
  const updates: Array<{ id: number; mobile: string; name: string; matchType: string }> = [];

  for (const mk of parsedMKs) {
    const normalizedMobile = normalizePhoneNumber(mk.mobileNumber);

    // Find matching MK
    const match = await findMatchingMK(mk.name);

    if (!match.success) {
      console.log(`❌ Not found: ${mk.name}`);
      result.failedMatches++;
      result.notFound.push({ name: mk.name, mobile: normalizedMobile });
      continue;
    }

    // Check if MK already has this mobile number
    const currentMK = await prisma.mK.findUnique({
      where: { id: match.mkId },
      select: { mobileNumber: true, nameHe: true },
    });

    if (currentMK?.mobileNumber === normalizedMobile) {
      console.log(`⏭️ Skipped (no change): ${match.dbName} → ${normalizedMobile}`);
      result.skipped++;
      result.skippedDetails.push({
        name: match.dbName!,
        reason: 'Already has same mobile number',
      });
      continue;
    }

    // Prepare update
    updates.push({
      id: match.mkId!,
      mobile: normalizedMobile,
      name: match.dbName!,
      matchType: match.matchType!,
    });

    if (match.matchType === 'fuzzy') {
      console.log(
        `⚠️ Fuzzy match (${match.similarity?.toFixed(0)}%): "${mk.name}" → "${match.dbName}" → ${normalizedMobile}`
      );
      result.fuzzyMatches++;
      result.fuzzyMatchDetails.push({
        mdName: mk.name,
        dbName: match.dbName!,
        similarity: match.similarity!,
      });
    } else {
      console.log(`✅ Matched: ${match.dbName} → ${normalizedMobile}`);
    }

    result.updated.push({ name: match.dbName!, mobile: normalizedMobile });
  }

  // Execute updates in transaction
  if (!dryRun && updates.length > 0) {
    console.log(`\n💾 Executing ${updates.length} updates in transaction...`);

    await prisma.$transaction(
      async (tx) => {
        for (const update of updates) {
          await tx.mK.update({
            where: { id: update.id },
            data: { mobileNumber: update.mobile },
          });
        }
      },
      {
        maxWait: 10000, // 10 seconds max wait
        timeout: 60000, // 60 seconds timeout
      }
    );

    console.log('✅ Transaction completed successfully\n');
  }

  result.successfulUpdates = updates.length;

  return result;
}

/**
 * Print summary report
 */
function printSummary(result: UpdateResult, dryRun: boolean) {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MK Mobile Number Update Summary          ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  console.log('📊 Statistics:');
  console.log(`   - Total MKs in MD file: ${result.totalInFile}`);
  console.log(`   - Successful ${dryRun ? 'matches' : 'updates'}: ${result.successfulUpdates}`);
  console.log(`   - Failed matches: ${result.failedMatches}`);
  console.log(`   - Fuzzy matches: ${result.fuzzyMatches}`);
  console.log(`   - Skipped (no change): ${result.skipped}\n`);

  if (result.fuzzyMatches > 0) {
    console.log('⚠️ Fuzzy Matches - REVIEW MANUALLY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const detail of result.fuzzyMatchDetails) {
      console.log(
        `   - MD: "${detail.mdName}" → DB: "${detail.dbName}" (${detail.similarity.toFixed(0)}% match)`
      );
    }
    console.log('');
  }

  if (result.failedMatches > 0) {
    console.log('❌ Not Found in Database:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const notFound of result.notFound) {
      console.log(`   - ${notFound.name} (${notFound.mobile})`);
    }
    console.log('');
  }

  if (dryRun) {
    console.log('🔍 DRY RUN COMPLETE - No changes were made to the database');
  } else {
    console.log('✅ Mobile numbers updated successfully!');
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  try {
    const result = await updateMobileNumbers(dryRun);
    printSummary(result, dryRun);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

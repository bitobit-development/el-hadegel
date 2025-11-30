import { config } from 'dotenv';
import path from 'path';

// IMPORTANT: Load environment variables BEFORE any other imports
config({ path: path.join(process.cwd(), '.env') });

import prisma from '@/lib/prisma';
import { MK_HANDLE_MAP } from '@/lib/mk-handle-mapping';
import { writeFileSync } from 'fs';

/**
 * Find X/Twitter Accounts for All 120 MKs
 *
 * This script:
 * 1. Gets all MKs from the database
 * 2. Checks which ones already have X accounts in the mapping
 * 3. Outputs a list of MKs needing X account research
 * 4. Generates a CSV template for manual research
 *
 * Usage: npx tsx scripts/find-all-mk-x-accounts.ts
 */

interface MKWithHandle {
  id: number;
  mkId: number;
  nameHe: string;
  faction: string;
  xHandle?: string;
  hasHandle: boolean;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Find X Accounts for All 120 MKs                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // 1. Get all MKs from database
  console.log('📊 Fetching all MKs from database...\n');
  const allMKs = await prisma.mK.findMany({
    select: {
      id: true,
      mkId: true,
      nameHe: true,
      faction: true,
    },
    orderBy: { nameHe: 'asc' },
  });

  console.log(`✅ Found ${allMKs.length} MKs in database\n`);

  // 2. Check which MKs already have X handles
  const mksWithStatus: MKWithHandle[] = allMKs.map(mk => {
    const knessetIdStr = String(mk.mkId);
    const xHandle = MK_HANDLE_MAP[knessetIdStr];

    return {
      ...mk,
      xHandle,
      hasHandle: !!xHandle,
    };
  });

  const withHandles = mksWithStatus.filter(mk => mk.hasHandle);
  const withoutHandles = mksWithStatus.filter(mk => !mk.hasHandle);

  console.log('─'.repeat(68));
  console.log('\n📊 CURRENT STATUS\n');
  console.log('═'.repeat(68));
  console.log(`✅ MKs with X accounts:     ${withHandles.length}`);
  console.log(`❌ MKs without X accounts:  ${withoutHandles.length}`);
  console.log(`📊 Coverage:                ${((withHandles.length / allMKs.length) * 100).toFixed(1)}%`);
  console.log('═'.repeat(68));

  if (withoutHandles.length === 0) {
    console.log('\n🎉 All MKs already have X accounts mapped!\n');
    await prisma.$disconnect();
    return;
  }

  // 3. Generate CSV template for manual research
  console.log('\n📝 Generating research template...\n');

  const csvHeader = 'MK_ID,Name_Hebrew,Faction,X_Account,Status\n';
  const csvRows = withoutHandles.map(mk => {
    return `${mk.mkId},"${mk.nameHe}","${mk.faction}","","TODO"`;
  }).join('\n');

  const csvContent = csvHeader + csvRows;
  const outputPath = path.join(process.cwd(), 'docs/mk-coalition/missing-x-accounts.csv');

  writeFileSync(outputPath, '\ufeff' + csvContent, 'utf-8'); // UTF-8 BOM for Excel

  console.log(`✅ CSV template saved to: ${outputPath}\n`);

  // 4. Display list of MKs needing research
  console.log('─'.repeat(68));
  console.log('\n❌ MKs NEEDING X ACCOUNT RESEARCH:\n');
  console.log('═'.repeat(68));

  // Group by faction
  const byFaction = withoutHandles.reduce((acc, mk) => {
    if (!acc[mk.faction]) {
      acc[mk.faction] = [];
    }
    acc[mk.faction].push(mk);
    return acc;
  }, {} as Record<string, MKWithHandle[]>);

  Object.entries(byFaction).forEach(([faction, mks]) => {
    console.log(`\n${faction} (${mks.length} MKs):`);
    mks.forEach(mk => {
      console.log(`   - ${mk.nameHe} (ID: ${mk.mkId})`);
    });
  });

  console.log('\n' + '═'.repeat(68));
  console.log('\n📋 NEXT STEPS:\n');
  console.log('1. Open the CSV template: docs/mk-coalition/missing-x-accounts.csv');
  console.log('2. For each MK, search: "[Hebrew Name] Twitter X account @"');
  console.log('3. Fill in the X_Account column with the handle (without @)');
  console.log('4. Change Status from "TODO" to "FOUND" or "NOT_FOUND"');
  console.log('5. Save the CSV');
  console.log('6. Run: npx tsx scripts/import-missing-x-accounts.ts');
  console.log('7. This will update the handle mapping with new accounts\n');

  // 5. Show example searches
  console.log('─'.repeat(68));
  console.log('\n🔍 EXAMPLE WEB SEARCHES:\n');

  const examples = withoutHandles.slice(0, 5);
  examples.forEach(mk => {
    const searchQuery = `${mk.nameHe} Twitter X account @`;
    console.log(`   "${searchQuery}"`);
  });
  console.log('\n' + '═'.repeat(68));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

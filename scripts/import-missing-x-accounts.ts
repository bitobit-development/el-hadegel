import { config } from 'dotenv';
import path from 'path';

// IMPORTANT: Load environment variables BEFORE any other imports
config({ path: path.join(process.cwd(), '.env') });

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Import Missing X Accounts and Update Handle Mapping
 *
 * Reads the filled-in CSV template and updates lib/mk-handle-mapping.ts
 * with the new X account handles.
 *
 * Usage: npx tsx scripts/import-missing-x-accounts.ts
 */

interface MissingAccount {
  MK_ID: string;
  Name_Hebrew: string;
  Faction: string;
  X_Account: string;
  Status: string;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Import Missing X Accounts                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const csvPath = path.join(process.cwd(), 'docs/mk-coalition/missing-x-accounts.csv');
  const mappingPath = path.join(process.cwd(), 'lib/mk-handle-mapping.ts');

  // 1. Read the CSV
  console.log(`📄 Reading CSV: ${csvPath}\n`);

  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch (error) {
    console.error('❌ Error: CSV file not found!');
    console.log('\nPlease run: npx tsx scripts/find-all-mk-x-accounts.ts first\n');
    process.exit(1);
  }

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as MissingAccount[];

  console.log(`✅ Found ${records.length} records in CSV\n`);

  // 2. Filter for found accounts
  const foundAccounts = records.filter(record => {
    const hasAccount = record.X_Account && record.X_Account.trim() !== '';
    const isFound = record.Status && record.Status.toUpperCase() === 'FOUND';
    return hasAccount && isFound;
  });

  const notFound = records.filter(record => {
    const status = record.Status && record.Status.toUpperCase();
    return status === 'NOT_FOUND';
  });

  const pending = records.filter(record => {
    const hasAccount = record.X_Account && record.X_Account.trim() !== '';
    const status = record.Status && record.Status.toUpperCase();
    return !hasAccount || (status !== 'FOUND' && status !== 'NOT_FOUND');
  });

  console.log('─'.repeat(68));
  console.log('\n📊 CSV STATUS\n');
  console.log('═'.repeat(68));
  console.log(`✅ Found accounts:          ${foundAccounts.length}`);
  console.log(`❌ Not found:               ${notFound.length}`);
  console.log(`⏳ Pending research:        ${pending.length}`);
  console.log('═'.repeat(68));

  if (foundAccounts.length === 0) {
    console.log('\n⚠️  No new accounts to import. Please fill in the CSV first.\n');
    process.exit(0);
  }

  // 3. Read current mapping file
  console.log('\n📖 Reading current handle mapping...\n');
  const currentMapping = readFileSync(mappingPath, 'utf-8');

  // 4. Extract existing mappings (use proper regex to match entire object)
  const handleMapMatch = currentMapping.match(/export const MK_HANDLE_MAP[^{]*\{[\s\S]*?\n\};/);
  const nameMapMatch = currentMapping.match(/export const MK_NAME_MAP[^{]*\{[\s\S]*?\n\};/);

  if (!handleMapMatch || !nameMapMatch) {
    console.error('❌ Error: Could not parse existing mapping file');
    process.exit(1);
  }

  // 5. Build new entries
  const newHandleEntries: string[] = [];
  const newNameEntries: string[] = [];

  foundAccounts.forEach(record => {
    const mkId = record.MK_ID.trim();
    const handle = record.X_Account.trim().replace('@', ''); // Remove @ if present
    const name = record.Name_Hebrew.trim();

    newHandleEntries.push(`  "${mkId}": "${handle}", // ${name} - Imported`);
    newNameEntries.push(`  "${mkId}": "${name}", // Imported`);
  });

  console.log('✅ Generated entries for new accounts\n');

  // 6. Insert new entries into mapping (before closing brace)
  const updatedHandleMap = handleMapMatch[0].replace(
    /(\n?)};/,
    `,\n${newHandleEntries.join(',\n')}\n};`
  );

  const updatedNameMap = nameMapMatch[0].replace(
    /(\n?)};/,
    `,\n${newNameEntries.join(',\n')}\n};`
  );

  // 7. Replace in full file (use proper regex to match entire object)
  let updatedMapping = currentMapping.replace(
    /export const MK_HANDLE_MAP[^{]*\{[\s\S]*?\n\};/,
    updatedHandleMap
  );

  updatedMapping = updatedMapping.replace(
    /export const MK_NAME_MAP[^{]*\{[\s\S]*?\n\};/,
    updatedNameMap
  );

  // 8. Update generation timestamp and note
  const now = new Date().toISOString();
  updatedMapping = updatedMapping.replace(
    /Generated: .*/,
    `Generated: ${now} (including ${foundAccounts.length} manually imported accounts)`
  );

  // 9. Write updated mapping
  writeFileSync(mappingPath, updatedMapping, 'utf-8');

  console.log('─'.repeat(68));
  console.log('\n✅ IMPORT COMPLETE\n');
  console.log('═'.repeat(68));
  console.log(`📝 Added ${foundAccounts.length} new X accounts to mapping`);
  console.log(`📍 Updated: ${mappingPath}`);
  console.log('═'.repeat(68));

  // 10. Show what was added
  if (foundAccounts.length > 0) {
    console.log('\n📋 IMPORTED ACCOUNTS:\n');
    foundAccounts.forEach(record => {
      console.log(`   ✅ ${record.Name_Hebrew} → @${record.X_Account.replace('@', '')}`);
    });
  }

  if (notFound.length > 0) {
    console.log('\n❌ ACCOUNTS NOT FOUND (marked in CSV):\n');
    notFound.slice(0, 10).forEach(record => {
      console.log(`   ❌ ${record.Name_Hebrew}`);
    });
    if (notFound.length > 10) {
      console.log(`   ... and ${notFound.length - 10} more`);
    }
  }

  console.log('\n' + '═'.repeat(68));
  console.log('\n🎉 Success! Next steps:\n');
  console.log('1. Run migration: npx tsx scripts/migrate-news-posts-to-mk.ts');
  console.log('2. Run sync: npx tsx scripts/sync-news-to-tweets.ts');
  console.log('3. Verify on homepage that posts appear on MK cards\n');
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

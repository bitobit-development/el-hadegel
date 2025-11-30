import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

/**
 * Generate MK Handle Mapping from Coalition CSV
 *
 * Reads the coalition members CSV and generates a TypeScript file
 * with a mapping of Knesset MK IDs to X/Twitter handles.
 *
 * Usage: npx tsx scripts/generate-mk-handle-mapping.ts
 */

const CSV_PATH = path.join(process.cwd(), 'docs/mk-coalition/coalition-members.csv');
const OUTPUT_PATH = path.join(process.cwd(), 'lib/mk-handle-mapping.ts');

interface CoalitionMember {
  MK_ID: string;
  Name_Hebrew: string;
  Faction: string;
  Position: string;
  X_Account: string;
  Phone: string;
  Email: string;
  Profile_URL: string;
}

function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   MK Handle Mapping Generator                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`📄 Reading CSV: ${CSV_PATH}\n`);

  // Read and parse CSV
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true, // Handle UTF-8 BOM
    relax_quotes: true, // Allow quotes in unquoted fields
    relax_column_count: true, // Be lenient with column count
  }) as CoalitionMember[];

  console.log(`✅ Found ${records.length} coalition members\n`);

  // Build mapping object
  const handleMapping: Record<string, string> = {};
  const nameMapping: Record<string, string> = {};
  let withAccountCount = 0;
  let withoutAccountCount = 0;

  for (const record of records) {
    const mkId = record.MK_ID.trim();
    const xAccount = record.X_Account?.trim() || '';
    const name = record.Name_Hebrew.trim();

    if (xAccount && xAccount !== '') {
      // Remove @ if present
      const cleanHandle = xAccount.startsWith('@') ? xAccount.substring(1) : xAccount;
      handleMapping[mkId] = cleanHandle;
      nameMapping[mkId] = name;
      withAccountCount++;
    } else {
      withoutAccountCount++;
    }
  }

  console.log(`🔗 Mapping Statistics:`);
  console.log(`   - With X accounts: ${withAccountCount}`);
  console.log(`   - Without X accounts: ${withoutAccountCount}`);
  console.log(`   - Coverage: ${((withAccountCount / records.length) * 100).toFixed(1)}%\n`);

  // Generate TypeScript file
  const tsContent = `/**
 * MK Handle Mapping
 *
 * Auto-generated mapping of Knesset MK IDs to X/Twitter handles.
 *
 * Generated: ${new Date().toISOString()}
 * Source: docs/mk-coalition/coalition-members.csv
 *
 * DO NOT EDIT MANUALLY - Run \`npx tsx scripts/generate-mk-handle-mapping.ts\` to regenerate.
 */

/**
 * Map of Knesset MK ID to X/Twitter handle (without @ prefix)
 *
 * Example: 771 -> "avidichter" (Avi Dichter)
 */
export const MK_HANDLE_MAP: Record<string, string> = ${JSON.stringify(handleMapping, null, 2)};

/**
 * Map of Knesset MK ID to Hebrew name (for debugging)
 */
export const MK_NAME_MAP: Record<string, string> = ${JSON.stringify(nameMapping, null, 2)};

/**
 * Get X handle for a given Knesset MK ID
 *
 * @param mkId - Knesset MK ID (e.g., "771" or 771)
 * @returns X handle without @ prefix, or undefined if not found
 */
export function getMKHandle(mkId: string | number): string | undefined {
  const id = String(mkId);
  return MK_HANDLE_MAP[id];
}

/**
 * Get MK ID from X handle
 *
 * @param handle - X handle (with or without @ prefix)
 * @returns Knesset MK ID, or undefined if not found
 */
export function getMKIdFromHandle(handle: string): string | undefined {
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
  const lowerHandle = cleanHandle.toLowerCase();

  for (const [mkId, mappedHandle] of Object.entries(MK_HANDLE_MAP)) {
    if (mappedHandle.toLowerCase() === lowerHandle) {
      return mkId;
    }
  }

  return undefined;
}

/**
 * Check if a URL is from a known MK's X account
 *
 * @param url - URL to check (e.g., "https://x.com/avidichter/status/123")
 * @returns MK ID if found, undefined otherwise
 */
export function getMKIdFromXUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url);

    // Check if it's an X/Twitter URL
    if (!urlObj.hostname.includes('twitter.com') && !urlObj.hostname.includes('x.com')) {
      return undefined;
    }

    // Extract handle from pathname (e.g., "/avidichter/status/123" -> "avidichter")
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return undefined;
    }

    const handle = pathParts[0];
    return getMKIdFromHandle(handle);
  } catch {
    return undefined;
  }
}
`;

  // Write to file
  writeFileSync(OUTPUT_PATH, tsContent, 'utf-8');

  console.log(`✨ Generated TypeScript mapping file:`);
  console.log(`   ${OUTPUT_PATH}\n`);

  console.log('📋 Example Usage:\n');
  console.log('   import { getMKHandle, getMKIdFromXUrl } from "@/lib/mk-handle-mapping";');
  console.log('   ');
  console.log('   // Get handle from MK ID');
  console.log('   const handle = getMKHandle(771); // "avidichter"');
  console.log('   ');
  console.log('   // Get MK ID from X URL');
  console.log('   const mkId = getMKIdFromXUrl("https://x.com/avidichter/status/123"); // "771"');
  console.log('');

  console.log('✅ Done!\n');
}

main();

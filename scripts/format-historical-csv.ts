#!/usr/bin/env tsx

/**
 * Historical Comments CSV Formatter
 *
 * Converts raw data to proper CSV format for import.
 * Handles field normalization, date conversion, and data cleaning.
 *
 * Usage:
 *   npx tsx scripts/format-historical-csv.ts [input-file] [output-file]
 *   npx tsx scripts/format-historical-csv.ts --template
 *
 * Examples:
 *   npx tsx scripts/format-historical-csv.ts raw-data.csv formatted-data.csv
 *   npx tsx scripts/format-historical-csv.ts raw-data.json formatted-data.csv
 *   npx tsx scripts/format-historical-csv.ts --template > template.csv
 *
 * Supported Input Formats:
 *   - CSV (comma-separated)
 *   - TSV (tab-separated)
 *   - JSON (array of objects)
 *
 * Features:
 *   - Auto-detect input format
 *   - Normalize field names (case-insensitive mapping)
 *   - Convert dates to ISO8601
 *   - Validate and clean URLs
 *   - Map platform names to canonical values
 *   - Remove HTML tags from content
 *   - Add default values
 */

import { readFile, writeFile } from 'fs/promises';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import {
  normalizePlatform,
  normalizeSourceType,
  stripHtmlTags,
  isValidUrl,
  generateCsvTemplate,
  FIELD_ALIASES,
  type HistoricalCommentRow,
  type SourcePlatform,
  type SourceType,
} from './lib/csv-utils';

/**
 * Input format types
 */
type InputFormat = 'csv' | 'tsv' | 'json';

/**
 * Raw input row (flexible structure)
 */
interface RawRow {
  [key: string]: any;
}

/**
 * Detect input format from file extension
 * @param filePath File path
 * @returns Detected format
 */
function detectFormat(filePath: string): InputFormat {
  const extension = filePath.toLowerCase().split('.').pop();

  switch (extension) {
    case 'json':
      return 'json';
    case 'tsv':
    case 'txt':
      return 'tsv';
    case 'csv':
    default:
      return 'csv';
  }
}

/**
 * Read and parse input file
 * @param filePath File path
 * @returns Array of raw rows
 */
async function readInputFile(filePath: string): Promise<RawRow[]> {
  const content = await readFile(filePath, 'utf-8');
  const format = detectFormat(filePath);

  switch (format) {
    case 'json':
      return JSON.parse(content);

    case 'tsv':
      return csvParse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: '\t',
        trim: true,
      });

    case 'csv':
    default:
      // Remove BOM if present
      const cleanContent = content.replace(/^\uFEFF/, '');
      return csvParse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relaxColumnCount: true,
      });
  }
}

/**
 * Normalize field name using aliases
 * @param fieldName Original field name
 * @returns Normalized field name
 */
function normalizeFieldName(fieldName: string): string {
  const lower = fieldName.toLowerCase().trim();
  return FIELD_ALIASES[lower] || fieldName;
}

/**
 * Normalize date to ISO8601 format
 * @param dateValue Raw date value
 * @returns ISO8601 date string or original if invalid
 */
function normalizeDate(dateValue: any): string {
  if (!dateValue) return '';

  // If already ISO8601, return as-is
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(dateValue)) {
    return dateValue;
  }

  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Fall through to return original
  }

  return String(dateValue);
}

/**
 * Clean and validate URL
 * @param url Raw URL value
 * @returns Cleaned URL or original if invalid
 */
function cleanUrl(url: any): string {
  if (!url) return '';

  const urlStr = String(url).trim();

  // Add protocol if missing
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    const withProtocol = `https://${urlStr}`;
    if (isValidUrl(withProtocol)) {
      return withProtocol;
    }
  }

  return urlStr;
}

/**
 * Format a single row
 * @param rawRow Raw input row
 * @returns Formatted row
 */
function formatRow(rawRow: RawRow): Partial<HistoricalCommentRow> {
  const formatted: any = {};

  // Normalize all field names
  for (const [key, value] of Object.entries(rawRow)) {
    const normalizedKey = normalizeFieldName(key);
    formatted[normalizedKey] = value;
  }

  // Process specific fields
  const result: Partial<HistoricalCommentRow> = {};

  // mkId - ensure it's a string number
  if (formatted.mkId) {
    result.mkId = String(formatted.mkId).trim();
  }

  // content - strip HTML and trim
  if (formatted.content) {
    result.content = stripHtmlTags(String(formatted.content)).trim();
  }

  // sourceUrl - clean and validate
  if (formatted.sourceUrl) {
    result.sourceUrl = cleanUrl(formatted.sourceUrl);
  }

  // sourcePlatform - normalize to canonical value
  if (formatted.sourcePlatform) {
    const normalized = normalizePlatform(formatted.sourcePlatform);
    if (normalized) {
      result.sourcePlatform = normalized;
    } else {
      // Keep original if normalization fails (will be caught in validation)
      result.sourcePlatform = String(formatted.sourcePlatform).trim();
    }
  }

  // sourceType - normalize with default
  result.sourceType = normalizeSourceType(formatted.sourceType);

  // commentDate - convert to ISO8601
  if (formatted.commentDate) {
    result.commentDate = normalizeDate(formatted.commentDate);
  }

  // sourceName - trim
  if (formatted.sourceName) {
    result.sourceName = String(formatted.sourceName).trim();
  }

  // sourceCredibility - ensure it's a string number
  if (formatted.sourceCredibility) {
    const credibility = parseInt(String(formatted.sourceCredibility));
    if (!isNaN(credibility) && credibility >= 1 && credibility <= 10) {
      result.sourceCredibility = String(credibility);
    }
  }

  // imageUrl - clean
  if (formatted.imageUrl) {
    result.imageUrl = cleanUrl(formatted.imageUrl);
  }

  // videoUrl - clean
  if (formatted.videoUrl) {
    result.videoUrl = cleanUrl(formatted.videoUrl);
  }

  // additionalContext - trim
  if (formatted.additionalContext) {
    result.additionalContext = String(formatted.additionalContext).trim();
  }

  return result;
}

/**
 * Convert formatted rows to CSV string
 * @param rows Array of formatted rows
 * @returns CSV string
 */
function rowsToCsv(rows: Partial<HistoricalCommentRow>[]): string {
  const columns = [
    'mkId',
    'content',
    'sourceUrl',
    'sourcePlatform',
    'sourceType',
    'commentDate',
    'sourceName',
    'sourceCredibility',
    'imageUrl',
    'videoUrl',
    'additionalContext',
  ];

  // Ensure all rows have all columns
  const normalizedRows = rows.map((row) => {
    const normalized: any = {};
    for (const col of columns) {
      normalized[col] = row[col as keyof HistoricalCommentRow] || '';
    }
    return normalized;
  });

  return csvStringify(normalizedRows, {
    header: true,
    columns,
    quoted_string: true,
    bom: true, // Add BOM for Excel compatibility
  });
}

/**
 * Display formatting summary
 * @param inputFile Input file path
 * @param outputFile Output file path
 * @param rowCount Number of rows formatted
 */
function displaySummary(
  inputFile: string,
  outputFile: string,
  rowCount: number
): void {
  console.log('\n✅ Formatting Complete');
  console.log('━'.repeat(80));
  console.log(`Input File: ${inputFile}`);
  console.log(`Output File: ${outputFile}`);
  console.log(`Rows Formatted: ${rowCount}`);
  console.log('━'.repeat(80));
  console.log('\nNext Steps:');
  console.log(`1. Validate: npx tsx scripts/validate-historical-data.ts ${outputFile}`);
  console.log(`2. Import: npx tsx scripts/import-historical-comments.ts ${outputFile}`);
  console.log('');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Handle --template flag
  if (args.includes('--template') || args.includes('-t')) {
    console.log(generateCsvTemplate());
    process.exit(0);
  }

  // Check arguments
  if (args.length < 2) {
    console.error('❌ Error: Input and output file paths required');
    console.log('\nUsage:');
    console.log(
      '  npx tsx scripts/format-historical-csv.ts <input-file> <output-file>'
    );
    console.log('  npx tsx scripts/format-historical-csv.ts --template');
    console.log('\nExamples:');
    console.log(
      '  npx tsx scripts/format-historical-csv.ts raw-data.csv formatted.csv'
    );
    console.log(
      '  npx tsx scripts/format-historical-csv.ts raw-data.json formatted.csv'
    );
    console.log('  npx tsx scripts/format-historical-csv.ts --template > template.csv');
    console.log('\nSupported input formats: CSV, TSV, JSON');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  console.log('🔧 Formatting Historical Comments CSV');
  console.log('━'.repeat(80));
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log('');

  try {
    // Read input file
    console.log('📖 Reading input file...');
    const rawRows = await readInputFile(inputFile);
    console.log(`✅ Loaded ${rawRows.length} rows\n`);

    // Format rows
    console.log('🔧 Formatting rows...');
    const formattedRows: Partial<HistoricalCommentRow>[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const formatted = formatRow(rawRows[i]);
      formattedRows.push(formatted);

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`  Formatted ${i + 1}/${rawRows.length} rows\r`);
      }
    }

    console.log(`✅ Formatted ${rawRows.length}/${rawRows.length} rows\n`);

    // Convert to CSV
    console.log('💾 Writing CSV file...');
    const csvContent = rowsToCsv(formattedRows);
    await writeFile(outputFile, csvContent, 'utf-8');
    console.log(`✅ Saved to ${outputFile}\n`);

    // Display summary
    displaySummary(inputFile, outputFile, rawRows.length);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run main function
main();

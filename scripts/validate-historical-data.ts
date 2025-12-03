#!/usr/bin/env tsx

/**
 * Historical Comments Data Validation Script
 *
 * Validates CSV data before import to REST API.
 * Checks all required fields, formats, and business rules.
 *
 * Usage:
 *   npx tsx scripts/validate-historical-data.ts <csv-file-path>
 *
 * Example:
 *   npx tsx scripts/validate-historical-data.ts data/historical-comments.csv
 *
 * Exit Codes:
 *   0 - All rows valid
 *   1 - One or more validation errors found
 */

import prisma from '../lib/prisma';
import { writeFile } from 'fs/promises';
import {
  readCsvFile,
  getMissingRequiredFields,
  isValidUrl,
  isValidIso8601,
  hasRecruitmentKeywords,
  normalizePlatform,
  normalizeSourceType,
  VALID_PLATFORMS,
  VALID_SOURCE_TYPES,
  type HistoricalCommentRow,
} from './lib/csv-utils';

/**
 * Validation error types
 */
type ErrorType =
  | 'MISSING_FIELD'
  | 'INVALID_MK_ID'
  | 'MK_NOT_FOUND'
  | 'NOT_COALITION'
  | 'CONTENT_LENGTH'
  | 'NO_KEYWORDS'
  | 'INVALID_URL'
  | 'URL_TOO_LONG'
  | 'INVALID_PLATFORM'
  | 'INVALID_SOURCE_TYPE'
  | 'INVALID_DATE'
  | 'INVALID_CREDIBILITY'
  | 'SOURCE_NAME_TOO_LONG'
  | 'IMAGE_URL_INVALID'
  | 'VIDEO_URL_INVALID';

/**
 * Validation error details
 */
interface ValidationError {
  row: number;
  type: ErrorType;
  field: string;
  message: string;
  value?: string;
}

/**
 * Warning types
 */
type WarningType =
  | 'LOW_CREDIBILITY'
  | 'MISSING_SOURCE_NAME'
  | 'MISSING_OPTIONAL_FIELD';

/**
 * Validation warning details
 */
interface ValidationWarning {
  row: number;
  type: WarningType;
  field: string;
  message: string;
  value?: string;
}

/**
 * Validation result
 */
interface ValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  errorSummary: Record<ErrorType, number>;
}

/**
 * Coalition party names for validation
 */
const COALITION_PARTIES = [
  'הליכוד',
  'התאחדות הספרדים שומרי תורה',
  'יהדות התורה',
  'הציונות הדתית',
  'עוצמה יהודית',
  'נעם - בראשות אבי מעוז',
];

/**
 * Validate a single CSV row
 * @param row CSV row data
 * @param rowNum Row number (1-indexed)
 * @param mkCache Cache of MK data
 * @returns Array of validation errors
 */
async function validateRow(
  row: HistoricalCommentRow,
  rowNum: number,
  mkCache: Map<number, { id: number; nameHe: string; faction: string }>
): Promise<{
  errors: ValidationError[];
  warnings: ValidationWarning[];
}> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Check required fields
  const missingFields = getMissingRequiredFields(row);
  if (missingFields.length > 0) {
    for (const field of missingFields) {
      errors.push({
        row: rowNum,
        type: 'MISSING_FIELD',
        field,
        message: `שדה חובה חסר: ${field}`,
      });
    }
    // If required fields missing, skip other validations
    return { errors, warnings };
  }

  // 2. Validate mkId format
  const mkId = parseInt(row.mkId);
  if (isNaN(mkId) || mkId <= 0) {
    errors.push({
      row: rowNum,
      type: 'INVALID_MK_ID',
      field: 'mkId',
      message: 'מזהה חבר כנסת חייב להיות מספר חיובי',
      value: row.mkId,
    });
  } else {
    // 3. Check MK exists in database
    const mk = mkCache.get(mkId);
    if (!mk) {
      errors.push({
        row: rowNum,
        type: 'MK_NOT_FOUND',
        field: 'mkId',
        message: `חבר כנסת ${mkId} לא נמצא במערכת`,
        value: row.mkId,
      });
    } else {
      // 4. Check MK is coalition member
      if (!COALITION_PARTIES.includes(mk.faction)) {
        errors.push({
          row: rowNum,
          type: 'NOT_COALITION',
          field: 'mkId',
          message: `${mk.nameHe} (${mk.faction}) אינו חבר קואליציה`,
          value: row.mkId,
        });
      }
    }
  }

  // 5. Validate content length
  const contentLength = row.content.trim().length;
  if (contentLength < 10) {
    errors.push({
      row: rowNum,
      type: 'CONTENT_LENGTH',
      field: 'content',
      message: 'תוכן התגובה קצר מדי (מינימום 10 תווים)',
      value: `${contentLength} characters`,
    });
  } else if (contentLength > 5000) {
    errors.push({
      row: rowNum,
      type: 'CONTENT_LENGTH',
      field: 'content',
      message: 'תוכן התגובה ארוך מדי (מקסימום 5000 תווים)',
      value: `${contentLength} characters`,
    });
  }

  // 6. Check recruitment law keywords
  if (!hasRecruitmentKeywords(row.content)) {
    errors.push({
      row: rowNum,
      type: 'NO_KEYWORDS',
      field: 'content',
      message: 'התוכן לא מכיל מילות מפתח הקשורות לחוק הגיוס',
    });
  }

  // 7. Validate sourceUrl format
  if (!isValidUrl(row.sourceUrl)) {
    errors.push({
      row: rowNum,
      type: 'INVALID_URL',
      field: 'sourceUrl',
      message: 'כתובת URL לא תקינה',
      value: row.sourceUrl.substring(0, 100),
    });
  }

  // 8. Check sourceUrl length
  if (row.sourceUrl.length > 2000) {
    errors.push({
      row: rowNum,
      type: 'URL_TOO_LONG',
      field: 'sourceUrl',
      message: 'כתובת URL ארוכה מדי (מקסימום 2000 תווים)',
      value: `${row.sourceUrl.length} characters`,
    });
  }

  // 9. Validate sourcePlatform
  const normalizedPlatform = normalizePlatform(row.sourcePlatform);
  if (!normalizedPlatform) {
    errors.push({
      row: rowNum,
      type: 'INVALID_PLATFORM',
      field: 'sourcePlatform',
      message: `פלטפורמה לא תקינה. חייב להיות אחד מ: ${VALID_PLATFORMS.join(', ')}`,
      value: row.sourcePlatform,
    });
  }

  // 10. Validate sourceType
  const normalizedSourceType = normalizeSourceType(row.sourceType);
  if (!VALID_SOURCE_TYPES.includes(normalizedSourceType as any)) {
    errors.push({
      row: rowNum,
      type: 'INVALID_SOURCE_TYPE',
      field: 'sourceType',
      message: `סוג מקור לא תקין. חייב להיות: ${VALID_SOURCE_TYPES.join(' או ')}`,
      value: row.sourceType,
    });
  }

  // 11. Validate commentDate format
  if (!isValidIso8601(row.commentDate)) {
    errors.push({
      row: rowNum,
      type: 'INVALID_DATE',
      field: 'commentDate',
      message: 'תאריך לא תקין. נדרש פורמט ISO8601 (YYYY-MM-DDTHH:MM:SSZ)',
      value: row.commentDate,
    });
  }

  // 12. Validate optional fields if present
  if (row.sourceCredibility) {
    const credibility = parseInt(row.sourceCredibility);
    if (isNaN(credibility) || credibility < 1 || credibility > 10) {
      errors.push({
        row: rowNum,
        type: 'INVALID_CREDIBILITY',
        field: 'sourceCredibility',
        message: 'ציון אמינות חייב להיות בין 1 ל-10',
        value: row.sourceCredibility,
      });
    } else if (credibility < 5) {
      warnings.push({
        row: rowNum,
        type: 'LOW_CREDIBILITY',
        field: 'sourceCredibility',
        message: `ציון אמינות נמוך (${credibility})`,
        value: row.sourceCredibility,
      });
    }
  }

  if (row.sourceName && row.sourceName.length > 200) {
    errors.push({
      row: rowNum,
      type: 'SOURCE_NAME_TOO_LONG',
      field: 'sourceName',
      message: 'שם המקור ארוך מדי (מקסימום 200 תווים)',
      value: `${row.sourceName.length} characters`,
    });
  } else if (!row.sourceName || row.sourceName.trim() === '') {
    warnings.push({
      row: rowNum,
      type: 'MISSING_SOURCE_NAME',
      field: 'sourceName',
      message: 'שם המקור חסר (מומלץ למלא)',
    });
  }

  if (row.imageUrl && !isValidUrl(row.imageUrl)) {
    errors.push({
      row: rowNum,
      type: 'IMAGE_URL_INVALID',
      field: 'imageUrl',
      message: 'כתובת תמונה לא תקינה',
      value: row.imageUrl.substring(0, 100),
    });
  }

  if (row.videoUrl && !isValidUrl(row.videoUrl)) {
    errors.push({
      row: rowNum,
      type: 'VIDEO_URL_INVALID',
      field: 'videoUrl',
      message: 'כתובת וידאו לא תקינה',
      value: row.videoUrl.substring(0, 100),
    });
  }

  return { errors, warnings };
}

/**
 * Load all MKs into cache
 * @returns Map of MK data by ID
 */
async function loadMkCache(): Promise<Map<number, { id: number; nameHe: string; faction: string }>> {
  const mks = await prisma.mK.findMany({
    select: { id: true, nameHe: true, faction: true },
  });

  const cache = new Map();
  for (const mk of mks) {
    cache.set(mk.id, { id: mk.id, nameHe: mk.nameHe, faction: mk.faction });
  }

  return cache;
}

/**
 * Generate error summary
 * @param errors Array of validation errors
 * @returns Summary by error type
 */
function generateErrorSummary(
  errors: ValidationError[]
): Record<ErrorType, number> {
  const summary: Record<string, number> = {};

  for (const error of errors) {
    summary[error.type] = (summary[error.type] || 0) + 1;
  }

  return summary as Record<ErrorType, number>;
}

/**
 * Save detailed errors to JSON file
 * @param result Validation result
 * @param outputPath Output file path
 */
async function saveErrorReport(
  result: ValidationResult,
  outputPath: string
): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
    },
    errorSummary: result.errorSummary,
    errors: result.errors,
    warnings: result.warnings,
  };

  await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Display validation results
 * @param result Validation result
 */
function displayResults(result: ValidationResult): void {
  console.log('\n✅ Validation Complete');
  console.log('━'.repeat(80));
  console.log(`Total Rows: ${result.totalRows}`);
  console.log(`✅ Valid: ${result.validRows}`);
  console.log(`❌ Invalid: ${result.invalidRows}`);
  console.log('');

  if (result.invalidRows > 0) {
    console.log('Error Summary:');
    const sortedErrors = Object.entries(result.errorSummary).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [type, count] of sortedErrors) {
      console.log(`  - ${type}: ${count} rows`);
    }
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log(`⚠️  Warnings:`);
    const warningTypes = new Map<WarningType, number>();
    for (const warning of result.warnings) {
      warningTypes.set(
        warning.type,
        (warningTypes.get(warning.type) || 0) + 1
      );
    }
    const warningEntries = Array.from(warningTypes.entries());
    for (const [type, count] of warningEntries) {
      console.log(`  - ${count} rows with ${type}`);
    }
    console.log('');
  }

  console.log('━'.repeat(80));
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: CSV file path required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/validate-historical-data.ts <csv-file-path>');
    console.log('\nExample:');
    console.log(
      '  npx tsx scripts/validate-historical-data.ts data/historical-comments.csv'
    );
    process.exit(1);
  }

  const csvPath = args[0];
  const errorReportPath = 'validation-errors.json';

  console.log('🔍 Validating Historical Comments Data');
  console.log('━'.repeat(80));
  console.log(`CSV File: ${csvPath}`);
  console.log('');

  try {
    // Load CSV
    console.log('📖 Reading CSV file...');
    const rows = await readCsvFile(csvPath);
    console.log(`✅ Loaded ${rows.length} rows\n`);

    // Load MK cache
    console.log('📚 Loading MK database...');
    const mkCache = await loadMkCache();
    console.log(`✅ Loaded ${mkCache.size} MKs\n`);

    // Validate each row
    console.log('🔍 Validating rows...');
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let validCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const { errors, warnings } = await validateRow(rows[i], i + 1, mkCache);

      if (errors.length === 0) {
        validCount++;
      }

      allErrors.push(...errors);
      allWarnings.push(...warnings);

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`  Validated ${i + 1}/${rows.length} rows\r`);
      }
    }

    console.log(`✅ Validated ${rows.length}/${rows.length} rows\n`);

    // Generate result
    const result: ValidationResult = {
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: rows.length - validCount,
      errors: allErrors,
      warnings: allWarnings,
      errorSummary: generateErrorSummary(allErrors),
    };

    // Display results
    displayResults(result);

    // Save error report if there are errors
    if (allErrors.length > 0 || allWarnings.length > 0) {
      await saveErrorReport(result, errorReportPath);
      console.log(`📄 Detailed report saved to: ${errorReportPath}\n`);
    }

    // Exit with appropriate code
    if (result.invalidRows > 0) {
      console.log('❌ Validation failed. Fix errors before importing.');
      process.exit(1);
    } else {
      console.log('✅ All rows valid. Ready to import!');
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run main function
main();

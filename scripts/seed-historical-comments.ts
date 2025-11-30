/**
 * Manual CSV Seeding Script for Historical Comments
 *
 * Usage:
 *   npx dotenv-cli -e .env -- npx tsx scripts/seed-historical-comments.ts path/to/comments.csv
 *
 * CSV Format (header row required):
 *   mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,imageUrl,videoUrl
 *
 * Example CSV:
 *   mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,imageUrl,videoUrl
 *   1,"חוק הגיוס חשוב למדינה","https://example.com/article1","News","Primary","2024-01-15T10:00:00Z","ידיעות אחרונות","https://example.com/img1.jpg",""
 *   2,"אני תומך בגיוס חרדים","https://twitter.com/user/status/123","Twitter","Primary","2024-01-16T14:30:00Z","","",""
 *
 * Notes:
 * - CSV must be UTF-8 encoded
 * - Dates must be in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)
 * - sourcePlatform must be: News, Twitter, Facebook, YouTube, Knesset, Interview, or Other
 * - sourceType must be: Primary or Secondary
 * - sourceName, imageUrl, videoUrl are optional (can be empty strings)
 * - Comments will be validated for recruitment law keywords
 * - Duplicates will be automatically detected and linked
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import prisma from '@/lib/prisma';
import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service';
import { isRecruitmentLawComment } from '@/lib/content-hash';
import { isCoalitionMember } from '@/lib/coalition-utils';
import { COMMENT_PLATFORMS, SOURCE_TYPES } from '@/lib/comment-constants';

interface CSVRow {
  mkId: string;
  content: string;
  sourceUrl: string;
  sourcePlatform: string;
  sourceType: string;
  commentDate: string;
  sourceName?: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: {
    mkId: number;
    content: string;
    sourceUrl: string;
    sourcePlatform: string;
    sourceType: string;
    commentDate: Date;
    sourceName?: string;
    imageUrl?: string;
    videoUrl?: string;
    keywords: string[];
  };
}

interface SeedingStats {
  total: number;
  created: number;
  duplicates: number;
  errors: number;
  errorDetails: Array<{ row: number; error: string }>;
}

/**
 * Validate a single CSV row
 */
async function validateRow(row: CSVRow, rowIndex: number): Promise<ValidationResult> {
  try {
    // 1. Validate mkId
    const mkId = parseInt(row.mkId);
    if (isNaN(mkId) || mkId <= 0) {
      return { valid: false, error: `Invalid mkId: ${row.mkId}` };
    }

    // 2. Verify MK exists
    const mk = await prisma.mK.findUnique({
      where: { id: mkId },
      select: { id: true, nameHe: true, faction: true },
    });

    if (!mk) {
      return { valid: false, error: `MK with ID ${mkId} not found in database` };
    }

    // 3. Verify MK is coalition member
    if (!isCoalitionMember(mk.faction)) {
      return {
        valid: false,
        error: `MK ${mk.nameHe} (${mk.faction}) is not a coalition member`
      };
    }

    // 4. Validate content
    const content = row.content?.trim();
    if (!content || content.length < 10) {
      return { valid: false, error: 'Content too short (minimum 10 characters)' };
    }
    if (content.length > 5000) {
      return { valid: false, error: 'Content too long (maximum 5000 characters)' };
    }

    // 5. Validate recruitment law relevance
    const contentCheck = isRecruitmentLawComment(content);
    if (!contentCheck.matches) {
      return {
        valid: false,
        error: 'Content is not related to recruitment law (missing required keywords)'
      };
    }

    // 6. Validate sourceUrl
    const sourceUrl = row.sourceUrl?.trim();
    if (!sourceUrl) {
      return { valid: false, error: 'sourceUrl is required' };
    }
    try {
      new URL(sourceUrl);
    } catch {
      return { valid: false, error: `Invalid URL: ${sourceUrl}` };
    }

    // 7. Validate sourcePlatform
    const sourcePlatform = row.sourcePlatform?.trim();
    if (!COMMENT_PLATFORMS.includes(sourcePlatform as any)) {
      return {
        valid: false,
        error: `Invalid sourcePlatform: ${sourcePlatform}. Must be one of: ${COMMENT_PLATFORMS.join(', ')}`
      };
    }

    // 8. Validate sourceType
    const sourceType = row.sourceType?.trim();
    if (!SOURCE_TYPES.includes(sourceType as any)) {
      return {
        valid: false,
        error: `Invalid sourceType: ${sourceType}. Must be: Primary or Secondary`
      };
    }

    // 9. Validate commentDate
    const commentDate = new Date(row.commentDate);
    if (isNaN(commentDate.getTime())) {
      return {
        valid: false,
        error: `Invalid commentDate: ${row.commentDate}. Use ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)`
      };
    }

    // 10. Validate optional fields
    const sourceName = row.sourceName?.trim() || undefined;
    const imageUrl = row.imageUrl?.trim() || undefined;
    const videoUrl = row.videoUrl?.trim() || undefined;

    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        return { valid: false, error: `Invalid imageUrl: ${imageUrl}` };
      }
    }

    if (videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        return { valid: false, error: `Invalid videoUrl: ${videoUrl}` };
      }
    }

    return {
      valid: true,
      data: {
        mkId,
        content,
        sourceUrl,
        sourcePlatform,
        sourceType,
        commentDate,
        sourceName,
        imageUrl,
        videoUrl,
        keywords: contentCheck.keywords,
      }
    };

  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Seed historical comments from CSV file
 */
async function seedHistoricalComments(csvFilePath: string) {
  console.log('📋 Historical Comments CSV Seeding Script');
  console.log('==========================================\n');

  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }

  console.log(`📂 Reading CSV file: ${csvFilePath}`);

  // Read and parse CSV
  let rows: CSVRow[];
  try {
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`✅ Found ${rows.length} rows to process\n`);
  } catch (error) {
    console.error(`❌ Error parsing CSV file:`, error);
    process.exit(1);
  }

  // Seeding statistics
  const stats: SeedingStats = {
    total: rows.length,
    created: 0,
    duplicates: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log('🔄 Processing rows...\n');

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because of header row and 0-indexing

    process.stdout.write(`[${i + 1}/${rows.length}] Processing row ${rowNumber}... `);

    // Validate row
    const validation = await validateRow(row, rowNumber);
    if (!validation.valid) {
      console.log(`❌ FAILED`);
      console.log(`  Error: ${validation.error}\n`);
      stats.errors++;
      stats.errorDetails.push({
        row: rowNumber,
        error: validation.error!,
      });
      continue;
    }

    // Create comment with deduplication
    try {
      const comment = await commentDeduplicationService.createComment({
        mkId: validation.data!.mkId,
        content: validation.data!.content,
        sourceUrl: validation.data!.sourceUrl,
        sourcePlatform: validation.data!.sourcePlatform,
        sourceType: validation.data!.sourceType,
        sourceName: validation.data!.sourceName,
        commentDate: validation.data!.commentDate,
        keywords: validation.data!.keywords,
        imageUrl: validation.data!.imageUrl,
        videoUrl: validation.data!.videoUrl,
      });

      const isDuplicate = comment.duplicateOf !== null;

      if (isDuplicate) {
        console.log(`⚠️  DUPLICATE (linked to #${comment.duplicateOf})`);
        stats.duplicates++;
      } else {
        console.log(`✅ CREATED (ID: ${comment.id})`);
        stats.created++;
      }
    } catch (error) {
      console.log(`❌ FAILED`);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  Error: ${errorMessage}\n`);
      stats.errors++;
      stats.errorDetails.push({
        row: rowNumber,
        error: errorMessage,
      });
    }
  }

  // Print summary
  console.log('\n==========================================');
  console.log('📊 SEEDING SUMMARY');
  console.log('==========================================');
  console.log(`Total rows processed:    ${stats.total}`);
  console.log(`✅ Successfully created: ${stats.created}`);
  console.log(`⚠️  Marked as duplicate:  ${stats.duplicates}`);
  console.log(`❌ Failed with errors:   ${stats.errors}`);
  console.log('==========================================\n');

  // Print error details if any
  if (stats.errorDetails.length > 0) {
    console.log('❌ ERROR DETAILS:');
    console.log('------------------------------------------');
    stats.errorDetails.forEach(({ row, error }) => {
      console.log(`Row ${row}: ${error}`);
    });
    console.log('------------------------------------------\n');
  }

  // Success message
  if (stats.errors === 0) {
    console.log('🎉 All rows processed successfully!');
  } else {
    console.log('⚠️  Some rows failed. Please review errors above.');
  }
}

// Main execution
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('❌ Error: CSV file path is required');
  console.log('\nUsage:');
  console.log('  npx dotenv-cli -e .env -- npx tsx scripts/seed-historical-comments.ts path/to/comments.csv');
  console.log('\nCSV Format (header row required):');
  console.log('  mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,imageUrl,videoUrl');
  console.log('\nExample:');
  console.log('  1,"חוק הגיוס חשוב","https://example.com","News","Primary","2024-01-15T10:00:00Z","ידיעות אחרונות","",""\n');
  process.exit(1);
}

// Run seeding
seedHistoricalComments(csvFilePath)
  .then(() => {
    console.log('\n✅ Seeding script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

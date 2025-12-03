#!/usr/bin/env tsx

/**
 * Historical Comments Batch Import Script
 *
 * Imports validated CSV data via REST API with rate limiting,
 * retry logic, and checkpoint/resume support.
 *
 * Usage:
 *   npx tsx scripts/import-historical-comments.ts <csv-file-path> [--resume]
 *
 * Example:
 *   npx tsx scripts/import-historical-comments.ts data/historical-comments.csv
 *   npx tsx scripts/import-historical-comments.ts data/historical-comments.csv --resume
 *
 * Environment Variables:
 *   NEWS_API_KEY - API key for authentication (required)
 *   API_BASE_URL - Base URL for API (default: http://localhost:3000)
 *
 * Features:
 *   - Batch processing (100 comments per batch)
 *   - Rate limiting (1000 requests/hour for env keys)
 *   - Retry logic (3 attempts with exponential backoff)
 *   - Checkpoint system (resume from interruption)
 *   - Progress tracking with ETA
 *   - Detailed error logging
 */

import { writeFile, appendFile } from 'fs/promises';
import {
  readCsvFile,
  countCsvRows,
  type HistoricalCommentRow,
} from './lib/csv-utils';
import {
  HistoricalCommentsApiClient,
  calculateSafeDelay,
  formatApiError,
  type ApiResponse,
} from './lib/api-client';
import {
  saveCheckpoint,
  loadCheckpoint,
  checkpointExists,
  deleteCheckpoint,
  createInitialCheckpoint,
  updateCheckpoint,
  displayCheckpoint,
  calculateProgress,
  calculateEta,
  formatDuration,
  isCheckpointValid,
  promptResumeCheckpoint,
  type ImportCheckpoint,
} from './lib/checkpoint';

/**
 * Batch processing configuration
 */
const BATCH_SIZE = 100;
const RATE_LIMIT_PER_HOUR = 1000; // Environment key limit
const SAFE_DELAY_MS = calculateSafeDelay(RATE_LIMIT_PER_HOUR);
const MIN_RATE_LIMIT_REMAINING = 100; // Pause if below this

/**
 * Error log file path
 */
const ERROR_LOG_PATH = 'import-errors.log';

/**
 * Batch processing result
 */
interface BatchResult {
  batchNum: number;
  imported: number;
  duplicates: number;
  errors: number;
  lastSuccessfulUrl?: string;
  processedUrls: string[];
  errorDetails: Array<{
    url: string;
    error: string;
    row: HistoricalCommentRow;
  }>;
}

/**
 * Import statistics
 */
interface ImportStats {
  totalRows: number;
  totalBatches: number;
  imported: number;
  duplicates: number;
  errors: number;
  startTime: number;
  endTime?: number;
}

/**
 * Process a single batch of comments
 * @param batch Array of comments to process
 * @param batchNum Batch number
 * @param apiClient API client instance
 * @param processedUrls Set of already processed URLs (for resume)
 * @returns Batch processing result
 */
async function processBatch(
  batch: HistoricalCommentRow[],
  batchNum: number,
  apiClient: HistoricalCommentsApiClient,
  processedUrls: Set<string>
): Promise<BatchResult> {
  const result: BatchResult = {
    batchNum,
    imported: 0,
    duplicates: 0,
    errors: 0,
    processedUrls: [],
    errorDetails: [],
  };

  for (const comment of batch) {
    // Skip if already processed (resume scenario)
    if (processedUrls.has(comment.sourceUrl)) {
      continue;
    }

    try {
      const response = await apiClient.submitComment(comment);

      if (response.success) {
        result.imported++;
        result.lastSuccessfulUrl = comment.sourceUrl;
      } else if (response.isDuplicate) {
        result.duplicates++;
      } else {
        result.errors++;
        result.errorDetails.push({
          url: comment.sourceUrl,
          error: formatApiError(response),
          row: comment,
        });
      }

      result.processedUrls.push(comment.sourceUrl);

      // Delay between requests to respect rate limit
      await sleep(SAFE_DELAY_MS);
    } catch (error) {
      result.errors++;
      result.errorDetails.push({
        url: comment.sourceUrl,
        error: (error as Error).message,
        row: comment,
      });
    }
  }

  return result;
}

/**
 * Log errors to file
 * @param batchNum Batch number
 * @param errorDetails Array of error details
 */
async function logErrors(
  batchNum: number,
  errorDetails: Array<{ url: string; error: string; row: HistoricalCommentRow }>
): Promise<void> {
  if (errorDetails.length === 0) return;

  const timestamp = new Date().toISOString();
  let logContent = `\n=== Batch ${batchNum} - ${timestamp} ===\n`;

  for (const { url, error, row } of errorDetails) {
    logContent += `\nURL: ${url}\n`;
    logContent += `Error: ${error}\n`;
    logContent += `MK ID: ${row.mkId}\n`;
    logContent += `Content: ${row.content.substring(0, 100)}...\n`;
    logContent += `Platform: ${row.sourcePlatform}\n`;
    logContent += `Date: ${row.commentDate}\n`;
    logContent += '---\n';
  }

  await appendFile(ERROR_LOG_PATH, logContent, 'utf-8');
}

/**
 * Display progress bar
 * @param current Current progress value
 * @param total Total value
 * @param label Progress label
 */
function displayProgressBar(current: number, total: number, label: string): void {
  const barLength = 40;
  const percentage = Math.round((current / total) * 100);
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${current}/${total})`);
}

/**
 * Display batch summary
 * @param batchResult Batch result
 * @param stats Current import statistics
 * @param startTime Import start time
 */
function displayBatchSummary(
  batchResult: BatchResult,
  stats: ImportStats,
  startTime: number
): void {
  const checkpoint: ImportCheckpoint = {
    timestamp: new Date().toISOString(),
    csvFile: '',
    totalRows: stats.totalRows,
    batchNum: batchResult.batchNum,
    totalBatches: stats.totalBatches,
    imported: stats.imported,
    duplicates: stats.duplicates,
    errors: stats.errors,
    processedUrls: [],
  };

  const progress = calculateProgress(checkpoint);
  const eta = calculateEta(checkpoint, startTime);

  console.log(`\n${'━'.repeat(80)}`);
  console.log(
    `Batch ${batchResult.batchNum}/${stats.totalBatches} - Progress: ${progress}%`
  );
  console.log(
    `✅ Imported: ${batchResult.imported} | ⚠️  Duplicates: ${batchResult.duplicates} | ❌ Errors: ${batchResult.errors}`
  );
  if (eta) {
    console.log(`⏱️  ETA: ${formatDuration(eta)}`);
  }
  console.log(`${'━'.repeat(80)}`);
}

/**
 * Display final report
 * @param stats Import statistics
 */
function displayFinalReport(stats: ImportStats): void {
  const elapsedSeconds = stats.endTime
    ? Math.round((stats.endTime - stats.startTime) / 1000)
    : 0;
  const rate =
    elapsedSeconds > 0
      ? Math.round((stats.imported / elapsedSeconds) * 60)
      : 0;

  console.log('\n\n✅ Import Complete');
  console.log('━'.repeat(80));
  console.log(`Total Rows: ${stats.totalRows}`);
  console.log(`✅ Successfully Imported: ${stats.imported} (new comments)`);
  console.log(`⚠️  Detected as Duplicates: ${stats.duplicates}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`⏱️  Time Elapsed: ${formatDuration(elapsedSeconds)}`);
  console.log(`📊 Average Rate: ${rate} comments/minute`);

  if (stats.errors > 0) {
    console.log(`\n📄 Error log: ${ERROR_LOG_PATH}`);
  }

  console.log('━'.repeat(80));
}

/**
 * Sleep for specified milliseconds
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle graceful shutdown (save checkpoint on SIGINT)
 */
function setupGracefulShutdown(
  checkpoint: ImportCheckpoint,
  onShutdown: () => void
): void {
  let isShuttingDown = false;

  const handler = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('\n\n⚠️  Interrupt detected. Saving checkpoint...');
    await saveCheckpoint(checkpoint);
    console.log('✅ Checkpoint saved. You can resume with --resume flag.');
    onShutdown();
    process.exit(0);
  };

  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
}

/**
 * Main import function
 */
async function main() {
  const args = process.argv.slice(2);
  const resumeFlag = args.includes('--resume');
  const csvPath = args.find((arg) => !arg.startsWith('--'));

  if (!csvPath) {
    console.error('❌ Error: CSV file path required');
    console.log('\nUsage:');
    console.log(
      '  npx tsx scripts/import-historical-comments.ts <csv-file-path> [--resume]'
    );
    console.log('\nExample:');
    console.log(
      '  npx tsx scripts/import-historical-comments.ts data/historical-comments.csv'
    );
    console.log(
      '  npx tsx scripts/import-historical-comments.ts data/historical-comments.csv --resume'
    );
    process.exit(1);
  }

  // Check API key
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: NEWS_API_KEY environment variable not set');
    console.log('\nSet your API key:');
    console.log('  export NEWS_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

  console.log('📥 Historical Comments Batch Import');
  console.log('━'.repeat(80));
  console.log(`CSV File: ${csvPath}`);
  console.log(`API URL: ${baseUrl}`);
  console.log(`Rate Limit: ${RATE_LIMIT_PER_HOUR} requests/hour`);
  console.log(`Delay: ${SAFE_DELAY_MS}ms between requests`);
  console.log('');

  try {
    // Load CSV
    console.log('📖 Reading CSV file...');
    const totalRows = await countCsvRows(csvPath);
    const totalBatches = Math.ceil(totalRows / BATCH_SIZE);
    console.log(`✅ Found ${totalRows} rows (${totalBatches} batches)\n`);

    // Initialize or load checkpoint
    let checkpoint: ImportCheckpoint;
    let startBatch = 1;
    let processedUrls = new Set<string>();

    if (resumeFlag && (await checkpointExists())) {
      const existingCheckpoint = await loadCheckpoint();
      if (
        existingCheckpoint &&
        isCheckpointValid(existingCheckpoint, csvPath, totalRows)
      ) {
        const shouldResume = await promptResumeCheckpoint(existingCheckpoint);
        if (shouldResume) {
          checkpoint = existingCheckpoint;
          startBatch = checkpoint.batchNum + 1;
          processedUrls = new Set(checkpoint.processedUrls);
          console.log(`\n✅ Resuming from batch ${startBatch}/${totalBatches}\n`);
        } else {
          checkpoint = createInitialCheckpoint(csvPath, totalRows, totalBatches);
          await deleteCheckpoint();
        }
      } else {
        checkpoint = createInitialCheckpoint(csvPath, totalRows, totalBatches);
      }
    } else {
      checkpoint = createInitialCheckpoint(csvPath, totalRows, totalBatches);
    }

    // Initialize API client
    const apiClient = new HistoricalCommentsApiClient(apiKey, baseUrl);

    // Check rate limit before starting
    console.log('🔍 Checking rate limit...');
    const rateLimitInfo = await apiClient.checkRateLimit();
    if (rateLimitInfo) {
      console.log(
        `✅ Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining\n`
      );
    }

    // Initialize statistics
    const stats: ImportStats = {
      totalRows,
      totalBatches,
      imported: checkpoint.imported,
      duplicates: checkpoint.duplicates,
      errors: checkpoint.errors,
      startTime: Date.now(),
    };

    // Setup graceful shutdown
    setupGracefulShutdown(checkpoint, () => {});

    // Load all rows
    const allRows = await readCsvFile(csvPath);

    // Process batches
    console.log('🚀 Starting import...\n');

    for (let batchNum = startBatch; batchNum <= totalBatches; batchNum++) {
      const startIdx = (batchNum - 1) * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, totalRows);
      const batch = allRows.slice(startIdx, endIdx);

      // Process batch
      const batchResult = await processBatch(
        batch,
        batchNum,
        apiClient,
        processedUrls
      );

      // Update statistics
      stats.imported += batchResult.imported;
      stats.duplicates += batchResult.duplicates;
      stats.errors += batchResult.errors;

      // Log errors
      if (batchResult.errorDetails.length > 0) {
        await logErrors(batchNum, batchResult.errorDetails);
      }

      // Update checkpoint
      checkpoint = updateCheckpoint(checkpoint, batchResult);
      await saveCheckpoint(checkpoint);

      // Update processed URLs set
      for (const url of batchResult.processedUrls) {
        processedUrls.add(url);
      }

      // Display progress
      displayBatchSummary(batchResult, stats, stats.startTime);

      // Check rate limit and pause if needed
      const currentRateLimit = await apiClient.checkRateLimit();
      if (
        currentRateLimit &&
        currentRateLimit.remaining < MIN_RATE_LIMIT_REMAINING
      ) {
        const now = Math.floor(Date.now() / 1000);
        const waitSeconds = Math.max(0, currentRateLimit.reset - now);
        if (waitSeconds > 0) {
          console.log(
            `\n⏳ Rate limit low (${currentRateLimit.remaining} remaining). Pausing for ${waitSeconds}s...`
          );
          await sleep(waitSeconds * 1000);
        }
      }
    }

    // Complete
    stats.endTime = Date.now();
    await deleteCheckpoint();

    // Display final report
    displayFinalReport(stats);

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run main function
main();

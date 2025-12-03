/**
 * Checkpoint system for resuming interrupted imports
 * Saves progress after each batch to enable recovery
 */

import { writeFile, readFile, access } from 'fs/promises';
import { constants } from 'fs';

/**
 * Checkpoint data structure
 */
export interface ImportCheckpoint {
  timestamp: string;
  csvFile: string;
  totalRows: number;
  batchNum: number;
  totalBatches: number;
  imported: number;
  duplicates: number;
  errors: number;
  lastSuccessfulUrl?: string;
  processedUrls: string[];
}

/**
 * Default checkpoint file path
 */
const DEFAULT_CHECKPOINT_PATH = './import-checkpoint.json';

/**
 * Save checkpoint to disk
 * @param checkpoint Checkpoint data
 * @param filePath Path to checkpoint file
 */
export async function saveCheckpoint(
  checkpoint: ImportCheckpoint,
  filePath: string = DEFAULT_CHECKPOINT_PATH
): Promise<void> {
  try {
    const json = JSON.stringify(checkpoint, null, 2);
    await writeFile(filePath, json, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to save checkpoint: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Load checkpoint from disk
 * @param filePath Path to checkpoint file
 * @returns Checkpoint data or null if not found
 */
export async function loadCheckpoint(
  filePath: string = DEFAULT_CHECKPOINT_PATH
): Promise<ImportCheckpoint | null> {
  try {
    // Check if file exists
    await access(filePath, constants.F_OK);

    // Read and parse
    const json = await readFile(filePath, 'utf-8');
    const checkpoint = JSON.parse(json) as ImportCheckpoint;

    return checkpoint;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

/**
 * Check if checkpoint exists
 * @param filePath Path to checkpoint file
 * @returns True if checkpoint exists
 */
export async function checkpointExists(
  filePath: string = DEFAULT_CHECKPOINT_PATH
): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete checkpoint file
 * @param filePath Path to checkpoint file
 */
export async function deleteCheckpoint(
  filePath: string = DEFAULT_CHECKPOINT_PATH
): Promise<void> {
  try {
    const { unlink } = await import('fs/promises');
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Create initial checkpoint
 * @param csvFile CSV file path
 * @param totalRows Total number of rows
 * @param totalBatches Total number of batches
 * @returns Initial checkpoint
 */
export function createInitialCheckpoint(
  csvFile: string,
  totalRows: number,
  totalBatches: number
): ImportCheckpoint {
  return {
    timestamp: new Date().toISOString(),
    csvFile,
    totalRows,
    batchNum: 0,
    totalBatches,
    imported: 0,
    duplicates: 0,
    errors: 0,
    processedUrls: [],
  };
}

/**
 * Update checkpoint after batch processing
 * @param checkpoint Current checkpoint
 * @param batchResults Batch processing results
 * @returns Updated checkpoint
 */
export function updateCheckpoint(
  checkpoint: ImportCheckpoint,
  batchResults: {
    batchNum: number;
    imported: number;
    duplicates: number;
    errors: number;
    lastSuccessfulUrl?: string;
    processedUrls: string[];
  }
): ImportCheckpoint {
  return {
    ...checkpoint,
    timestamp: new Date().toISOString(),
    batchNum: batchResults.batchNum,
    imported: checkpoint.imported + batchResults.imported,
    duplicates: checkpoint.duplicates + batchResults.duplicates,
    errors: checkpoint.errors + batchResults.errors,
    lastSuccessfulUrl:
      batchResults.lastSuccessfulUrl || checkpoint.lastSuccessfulUrl,
    processedUrls: [
      ...checkpoint.processedUrls,
      ...batchResults.processedUrls,
    ],
  };
}

/**
 * Display checkpoint summary
 * @param checkpoint Checkpoint to display
 */
export function displayCheckpoint(checkpoint: ImportCheckpoint): void {
  console.log('\n📌 Checkpoint Summary');
  console.log('━'.repeat(50));
  console.log(`CSV File: ${checkpoint.csvFile}`);
  console.log(`Total Rows: ${checkpoint.totalRows}`);
  console.log(
    `Progress: Batch ${checkpoint.batchNum}/${checkpoint.totalBatches}`
  );
  console.log(`Imported: ${checkpoint.imported}`);
  console.log(`Duplicates: ${checkpoint.duplicates}`);
  console.log(`Errors: ${checkpoint.errors}`);
  console.log(`Last Updated: ${checkpoint.timestamp}`);
  if (checkpoint.lastSuccessfulUrl) {
    console.log(`Last URL: ${checkpoint.lastSuccessfulUrl.substring(0, 60)}...`);
  }
  console.log('━'.repeat(50));
}

/**
 * Calculate progress percentage
 * @param checkpoint Checkpoint data
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(checkpoint: ImportCheckpoint): number {
  if (checkpoint.totalBatches === 0) return 0;
  return Math.round((checkpoint.batchNum / checkpoint.totalBatches) * 100);
}

/**
 * Calculate ETA in seconds
 * @param checkpoint Checkpoint data
 * @param startTime Start time in milliseconds
 * @returns ETA in seconds or null if not calculable
 */
export function calculateEta(
  checkpoint: ImportCheckpoint,
  startTime: number
): number | null {
  if (checkpoint.batchNum === 0) return null;

  const elapsedMs = Date.now() - startTime;
  const batchesRemaining = checkpoint.totalBatches - checkpoint.batchNum;
  const avgTimePerBatch = elapsedMs / checkpoint.batchNum;
  const etaMs = avgTimePerBatch * batchesRemaining;

  return Math.round(etaMs / 1000);
}

/**
 * Format seconds to human-readable time
 * @param seconds Number of seconds
 * @returns Formatted time string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Validate checkpoint against CSV file
 * @param checkpoint Checkpoint to validate
 * @param csvFile Current CSV file path
 * @param totalRows Current total rows
 * @returns True if checkpoint is valid for resume
 */
export function isCheckpointValid(
  checkpoint: ImportCheckpoint,
  csvFile: string,
  totalRows: number
): boolean {
  // Check if same CSV file
  if (checkpoint.csvFile !== csvFile) {
    console.warn('⚠️  Warning: Checkpoint is for different CSV file');
    return false;
  }

  // Check if row count matches
  if (checkpoint.totalRows !== totalRows) {
    console.warn('⚠️  Warning: CSV file has different row count');
    return false;
  }

  // Check if already completed
  if (checkpoint.batchNum >= checkpoint.totalBatches) {
    console.warn('⚠️  Warning: Import already completed');
    return false;
  }

  return true;
}

/**
 * Prompt user for checkpoint resume decision
 * @param checkpoint Existing checkpoint
 * @returns True if user wants to resume
 */
export async function promptResumeCheckpoint(
  checkpoint: ImportCheckpoint
): Promise<boolean> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    displayCheckpoint(checkpoint);
    console.log(
      `\n🔄 Found existing checkpoint from ${new Date(checkpoint.timestamp).toLocaleString('he-IL')}`
    );
    rl.question('\nResume from checkpoint? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

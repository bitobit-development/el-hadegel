/**
 * Helper Script for Historical Comments Collection
 *
 * This script works in tandem with Claude (who has MCP tool access).
 *
 * WORKFLOW:
 * 1. Claude uses WebSearch/WebFetch MCP tools to find and extract quotes
 * 2. Claude saves extracted data to data/extracted-comments/mk_{id}.json
 * 3. This script reads those files and submits to API with validation
 *
 * Usage:
 *   npx tsx scripts/find-comments-helper.ts --submit-pending
 *   npx tsx scripts/find-comments-helper.ts --mk-id 90
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

// ============================================================================
// Types
// ============================================================================

interface ExtractedComment {
  mkId: number;
  mkName: string;
  content: string;
  sourceUrl: string;
  sourcePlatform: 'News' | 'Twitter' | 'Facebook' | 'YouTube' | 'Knesset' | 'Interview' | 'Other';
  sourceType: 'Primary' | 'Secondary';
  commentDate: string; // ISO8601
  sourceName: string;
  sourceCredibility: number; // 1-10
}

interface SubmissionResult {
  success: boolean;
  commentId?: number;
  isDuplicate?: boolean;
  error?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const EXTRACTED_DIR = 'data/extracted-comments';
const SUBMITTED_DIR = 'data/submitted-comments';
const API_URL = process.env.API_URL || 'http://localhost:3000/api/historical-comments';
const API_KEY = process.env.NEWS_API_KEY;

if (!API_KEY) {
  console.error('❌ NEWS_API_KEY not found in environment');
  process.exit(1);
}

// ============================================================================
// API Submission
// ============================================================================

async function submitComment(comment: ExtractedComment): Promise<SubmissionResult> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mkId: comment.mkId,
        content: comment.content,
        sourceUrl: comment.sourceUrl,
        sourcePlatform: comment.sourcePlatform,
        sourceType: comment.sourceType,
        commentDate: comment.commentDate,
        sourceName: comment.sourceName,
        sourceCredibility: comment.sourceCredibility,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      commentId: data.data.id,
      isDuplicate: data.data.isDuplicate,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// File Processing
// ============================================================================

async function processExtractedFile(filePath: string): Promise<void> {
  const fileName = filePath.split('/').pop() || '';
  console.log(`\n📄 Processing: ${fileName}`);

  try {
    const content = readFileSync(filePath, 'utf-8');
    const comments: ExtractedComment[] = JSON.parse(content);

    if (!Array.isArray(comments) || comments.length === 0) {
      console.log('  ⚠️  No comments in file, skipping');
      return;
    }

    console.log(`  Found ${comments.length} comments for ${comments[0].mkName}`);

    let submitted = 0;
    let duplicates = 0;
    let errors = 0;

    for (const comment of comments) {
      console.log(`\n  Processing quote from ${comment.sourceName}...`);
      console.log(`  "${comment.content.substring(0, 80)}..."`);

      const result = await submitComment(comment);

      if (result.success) {
        submitted++;
        if (result.isDuplicate) {
          duplicates++;
          console.log(`  ✅ Submitted (duplicate detected, ID: ${result.commentId})`);
        } else {
          console.log(`  ✅ Submitted (ID: ${result.commentId})`);
        }
      } else {
        errors++;
        console.log(`  ❌ Failed: ${result.error}`);
      }

      // Rate limiting: Wait 0.5s between submissions
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n  Summary: ${submitted} submitted, ${duplicates} duplicates, ${errors} errors`);

    // Move file to submitted directory if all succeeded
    if (errors === 0) {
      const submittedPath = filePath.replace(EXTRACTED_DIR, SUBMITTED_DIR);
      writeFileSync(submittedPath, content, 'utf-8');
      unlinkSync(filePath);
      console.log(`  ✅ Moved to submitted directory`);
    }
  } catch (error) {
    console.error(`  ❌ Error processing file:`, error);
  }
}

async function submitPendingFiles(): Promise<void> {
  if (!existsSync(EXTRACTED_DIR)) {
    console.log('❌ No extracted-comments directory found');
    console.log('💡 Claude should create files in data/extracted-comments/');
    return;
  }

  const files = readdirSync(EXTRACTED_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => join(EXTRACTED_DIR, f));

  if (files.length === 0) {
    console.log('✅ No pending files to submit');
    return;
  }

  console.log(`\n🚀 Found ${files.length} pending files\n`);

  for (const file of files) {
    await processExtractedFile(file);
  }
}

async function submitSingleMK(mkId: number): Promise<void> {
  const filePath = join(EXTRACTED_DIR, `mk_${mkId}.json`);

  if (!existsSync(filePath)) {
    console.log(`❌ No extracted comments file found for MK ${mkId}`);
    console.log(`Expected: ${filePath}`);
    return;
  }

  await processExtractedFile(filePath);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  console.log('🔧 Historical Comments Helper\n');

  if (args.includes('--submit-pending')) {
    await submitPendingFiles();
  } else if (args.includes('--mk-id')) {
    const mkIdIndex = args.indexOf('--mk-id');
    const mkId = parseInt(args[mkIdIndex + 1]);

    if (isNaN(mkId)) {
      console.error('❌ Invalid MK ID');
      process.exit(1);
    }

    await submitSingleMK(mkId);
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/find-comments-helper.ts --submit-pending');
    console.log('  npx tsx scripts/find-comments-helper.ts --mk-id 90');
  }
}

main().catch(console.error);

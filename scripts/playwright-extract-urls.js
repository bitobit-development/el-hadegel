#!/usr/bin/env node

/**
 * This script provides the necessary data and instructions for using Playwright MCP
 * to extract profile image URLs from all 120 MK profile pages
 */

const fs = require('fs');
const path = require('path');

const MK_DATA_FILE = path.join(__dirname, 'mk-data.json');
const PROGRESS_FILE = path.join(__dirname, 'download-progress.json');

// Load data
const mkData = JSON.parse(fs.readFileSync(MK_DATA_FILE, 'utf-8'));

// Initialize or load progress
let progress = {
  completed: [],
  failed: [],
  imageUrls: {},
  lastProcessedIndex: -1,
  timestamp: new Date().toISOString()
};

if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch (error) {
    console.error('Error loading progress:', error.message);
  }
}

/**
 * Save an image URL for an MK
 */
function saveImageUrl(mkId, imageUrl) {
  progress.imageUrls[mkId] = imageUrl;
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Mark an MK as failed
 */
function markAsFailed(mkId) {
  if (!progress.failed.includes(mkId)) {
    progress.failed.push(mkId);
  }
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Get next batch of MKs to process
 */
function getNextBatch(batchSize = 10) {
  const needsProcessing = mkData.mks.filter(mk =>
    !progress.imageUrls[mk.mkId] && !progress.failed.includes(mk.mkId)
  );
  return needsProcessing.slice(0, batchSize);
}

/**
 * Display current status
 */
function displayStatus() {
  const total = mkData.mks.length;
  const extracted = Object.keys(progress.imageUrls).length;
  const failed = progress.failed.length;
  const remaining = total - extracted - failed;

  console.log('=== Image URL Extraction Status ===\n');
  console.log(`Total MKs: ${total}`);
  console.log(`✅ URLs Extracted: ${extracted} (${Math.round(extracted/total*100)}%)`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏳ Remaining: ${remaining}\n`);

  if (remaining > 0) {
    console.log('Next batch to process:');
    const nextBatch = getNextBatch(5);
    nextBatch.forEach((mk, i) => {
      console.log(`  ${i + 1}. ${mk.name} (ID: ${mk.mkId})`);
      console.log(`     ${mk.profileUrl}`);
    });

    console.log('\n📋 Playwright MCP Commands:');
    console.log('For each URL above, run:');
    console.log('1. browser_navigate(url)');
    console.log('2. browser_wait_for({ time: 3 })');
    console.log('3. browser_evaluate:');
    console.log('   element: "Profile image"');
    console.log('   function: () => {');
    console.log('     const img = document.querySelector(\'img[alt*="חבר הכנסת"]\');');
    console.log('     return img?.src || null;');
    console.log('   }');
  } else {
    console.log('✨ All image URLs have been extracted!');
  }
}

/**
 * Generate a complete extraction command list
 */
function generateExtractionPlan() {
  const needsProcessing = mkData.mks.filter(mk =>
    !progress.imageUrls[mk.mkId] && !progress.failed.includes(mk.mkId)
  );

  console.log('\n=== Complete Extraction Plan ===\n');
  console.log(`MKs to process: ${needsProcessing.length}\n`);

  needsProcessing.forEach((mk, index) => {
    console.log(`--- MK ${index + 1}/${needsProcessing.length}: ${mk.name} (ID: ${mk.mkId}) ---`);
    console.log(`URL: ${mk.profileUrl}\n`);
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--plan')) {
    generateExtractionPlan();
  } else if (args.includes('--save')) {
    // Save an image URL
    const mkId = args[args.indexOf('--save') + 1];
    const imageUrl = args[args.indexOf('--save') + 2];
    if (mkId && imageUrl) {
      saveImageUrl(mkId, imageUrl);
      console.log(`✅ Saved image URL for MK ID ${mkId}`);
    } else {
      console.log('Usage: --save <mkId> <imageUrl>');
    }
  } else if (args.includes('--fail')) {
    // Mark as failed
    const mkId = args[args.indexOf('--fail') + 1];
    if (mkId) {
      markAsFailed(mkId);
      console.log(`❌ Marked MK ID ${mkId} as failed`);
    } else {
      console.log('Usage: --fail <mkId>');
    }
  } else {
    displayStatus();
  }
}

module.exports = { saveImageUrl, markAsFailed, getNextBatch, displayStatus };

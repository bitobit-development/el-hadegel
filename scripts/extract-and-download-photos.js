#!/usr/bin/env node

/**
 * Extract image URLs from MK profile pages and download them
 * This script needs to be run with Playwright MCP to extract image URLs
 */

const fs = require('fs');
const path = require('path');

const MK_DATA_FILE = path.join(__dirname, 'mk-data.json');
const PROGRESS_FILE = path.join(__dirname, 'download-progress.json');

// Load MK data
const mkData = JSON.parse(fs.readFileSync(MK_DATA_FILE, 'utf-8'));

function initializeProgress() {
  return {
    completed: [],
    failed: [],
    imageUrls: {},
    timestamp: new Date().toISOString()
  };
}

function loadOrCreateProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading progress, creating new:', error.message);
  }
  return initializeProgress();
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function main() {
  console.log('=== MK Photo URL Extractor ===\n');

  const progress = loadOrCreateProgress();
  const mks = mkData.mks;

  console.log(`Total MKs: ${mks.length}`);
  console.log(`Image URLs extracted: ${Object.keys(progress.imageUrls).length}`);
  console.log(`Completed downloads: ${progress.completed.length}`);
  console.log(`Failed: ${progress.failed.length}\n`);

  // Find MKs that still need image URL extraction
  const needsExtraction = mks.filter(mk => !progress.imageUrls[mk.mkId]);

  console.log(`MKs needing image URL extraction: ${needsExtraction.length}\n`);

  if (needsExtraction.length > 0) {
    console.log('Next MKs to process (showing first 10):');
    needsExtraction.slice(0, 10).forEach((mk, i) => {
      console.log(`  ${i + 1}. ${mk.name} (ID: ${mk.mkId})`);
      console.log(`     URL: ${mk.profileUrl}`);
    });

    console.log('\n📋 To extract image URLs, use Playwright MCP to:');
    console.log('   1. Navigate to each profile URL');
    console.log('   2. Extract the profile image src attribute');
    console.log('   3. Store in download-progress.json under imageUrls');
    console.log('\n   Example Playwright evaluation:');
    console.log('   const img = document.querySelector(\'img[alt*="חבר הכנסת"]\');');
    console.log('   return img?.src;');
  } else {
    console.log('✅ All image URLs have been extracted!');
    console.log(`\nRun the download script to download ${mks.length - progress.completed.length} remaining images.`);
  }

  console.log(`\nProgress file: ${PROGRESS_FILE}`);
  console.log(`Output directory: ${mkData.outputDir}`);
}

if (require.main === module) {
  main();
}

module.exports = { loadOrCreateProgress, saveProgress, initializeProgress };

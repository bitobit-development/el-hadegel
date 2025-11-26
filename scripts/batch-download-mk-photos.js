#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Batch download script for MK profile photos
 * Downloads images in batches with progress tracking
 */

const MK_DATA_FILE = path.join(__dirname, 'mk-data.json');
const PROGRESS_FILE = path.join(__dirname, 'download-progress.json');
const DELAY_BETWEEN_DOWNLOADS = 1000; // 1 second between downloads

// Load MK data
const mkData = JSON.parse(fs.readFileSync(MK_DATA_FILE, 'utf-8'));
const OUTPUT_DIR = mkData.outputDir;

// Statistics
const stats = {
  total: mkData.mks.length,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Load progress from previous run
 */
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading progress:', error.message);
  }
  return { completed: [], failed: [], imageUrls: {} };
}

/**
 * Save progress
 */
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

/**
 * Download image from URL
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://m.knesset.gov.il/'
      }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        // Verify file was created and has content
        const stats = fs.statSync(filepath);
        if (stats.size > 0) {
          resolve();
        } else {
          fs.unlinkSync(filepath);
          reject(new Error('Downloaded file is empty'));
        }
      });

      file.on('error', (err) => {
        file.close();
        try {
          fs.unlinkSync(filepath);
        } catch {}
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      try {
        fs.unlinkSync(filepath);
      } catch {}
      reject(err);
    });
  });
}

/**
 * Sleep function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download MK photo if URL is known
 */
async function downloadMKPhoto(mk, imageUrl, index, total) {
  const sanitizedName = sanitizeFilename(mk.name);
  const ext = path.extname(imageUrl) || '.jpg';
  const filename = `${sanitizedName}${ext}`;
  const filepath = path.join(OUTPUT_DIR, filename);

  // Check if already exists
  if (fs.existsSync(filepath)) {
    console.log(`[${index + 1}/${total}] ⏭️  ${mk.name} - Already exists`);
    stats.skipped++;
    return { success: true, skipped: true };
  }

  try {
    console.log(`[${index + 1}/${total}] ⬇️  Downloading ${mk.name}...`);
    await downloadImage(imageUrl, filepath);
    console.log(`[${index + 1}/${total}] ✅ ${mk.name} - Success`);
    stats.successful++;
    return { success: true, filepath };
  } catch (error) {
    console.log(`[${index + 1}/${total}] ❌ ${mk.name} - Failed: ${error.message}`);
    stats.failed++;
    stats.errors.push({ mk: mk.name, mkId: mk.mkId, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('=== MK Profile Photo Batch Downloader ===\n');

  // Load progress
  const progress = loadProgress();
  console.log(`📊 Progress: ${progress.completed.length} completed, ${progress.failed.length} failed\n`);

  // Filter MKs that need processing
  const mksToProcess = mkData.mks.filter(mk => !progress.completed.includes(mk.mkId));

  if (mksToProcess.length === 0) {
    console.log('✨ All MKs have been processed!');
    console.log('\nFinal Statistics:');
    console.log(`Total: ${stats.total}`);
    console.log(`Completed: ${progress.completed.length}`);
    console.log(`Failed: ${progress.failed.length}`);
    return;
  }

  console.log(`📥 Need to process: ${mksToProcess.length} MKs\n`);
  console.log('⚠️  Note: This script requires image URLs to be extracted first.');
  console.log('   Image URLs will be fetched using Playwright MCP.\n');

  // Check if we have image URLs
  if (Object.keys(progress.imageUrls).length === 0) {
    console.log('❌ No image URLs found. Please run the Playwright scraper first to extract image URLs.\n');
    console.log('Expected format in download-progress.json:');
    console.log('{');
    console.log('  "imageUrls": {');
    console.log('    "771": "https://main.knesset.gov.il/mk/MKPersonalDetailsImages/771/image.jpg",');
    console.log('    "1063": "https://main.knesset.gov.il/mk/MKPersonalDetailsImages/1063/image.jpg"');
    console.log('  }');
    console.log('}');
    return;
  }

  console.log('Starting downloads...\n');
  console.log('='.repeat(80));

  // Process MKs
  for (let i = 0; i < mksToProcess.length; i++) {
    const mk = mksToProcess[i];
    const imageUrl = progress.imageUrls[mk.mkId];

    if (!imageUrl) {
      console.log(`[${i + 1}/${mksToProcess.length}] ⚠️  ${mk.name} - No image URL found`);
      progress.failed.push(mk.mkId);
      continue;
    }

    const result = await downloadMKPhoto(mk, imageUrl, i, mksToProcess.length);

    if (result.success && !result.skipped) {
      progress.completed.push(mk.mkId);
    } else if (!result.success) {
      progress.failed.push(mk.mkId);
    }

    // Save progress after each download
    saveProgress(progress);

    // Delay between requests
    if (i < mksToProcess.length - 1) {
      await sleep(DELAY_BETWEEN_DOWNLOADS);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n=== Download Complete ===');
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  if (stats.errors.length > 0) {
    console.log('\nFailed downloads:');
    stats.errors.forEach(err => {
      console.log(`  - ${err.mk} (ID: ${err.mkId}): ${err.error}`);
    });
  }

  console.log('\nProgress saved to:', PROGRESS_FILE);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadMKPhoto, downloadImage, sanitizeFilename };

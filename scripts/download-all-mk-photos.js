#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Automated script to download all 120 Knesset member profile photos
 * Uses direct image URLs from the Knesset website
 */

const MARKDOWN_FILE = path.join(__dirname, '../docs/parlament-website/all-mks-list.md');
const OUTPUT_DIR = path.join(__dirname, '../docs/parlament-website/pm-profile-img');
const DELAY_BETWEEN_REQUESTS = 1500; // 1.5 seconds between downloads

// Statistics
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

/**
 * Parse the markdown file to extract MK information
 */
function parseMKsFromMarkdown() {
  const content = fs.readFileSync(MARKDOWN_FILE, 'utf-8');
  const lines = content.split('\n');
  const mks = [];

  for (const line of lines) {
    if (line.startsWith('|') && line.includes('Profile](')) {
      const match = line.match(/\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*\[Profile\]\((https:\/\/[^)]+)\)/);
      if (match) {
        const [, name, party, mkId, profileUrl] = match;
        mks.push({
          name: name.trim(),
          party: party.trim(),
          mkId: mkId.trim(),
          profileUrl: profileUrl.trim()
        });
      }
    }
  }

  return mks;
}

/**
 * Sanitize filename to be filesystem-safe
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
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

/**
 * Construct image URL from MK ID
 * Pattern observed: https://main.knesset.gov.il/mk/MKPersonalDetailsImages/{mkId}/{filename}.JPG
 * We'll need to fetch the actual filename from the profile page
 */
async function getImageUrlForMK(mkId) {
  // Common image filename patterns based on MK ID
  const possibleExtensions = ['JPG', 'jpg', 'PNG', 'png', 'JPEG', 'jpeg'];

  // First, try to construct URL based on observed pattern
  // The actual implementation will fetch from profile page
  return null; // Will be fetched via Playwright in actual implementation
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if file already exists
 */
function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch {
    return false;
  }
}

/**
 * Main download function for a single MK
 */
async function downloadMKPhoto(mk, index, total) {
  const sanitizedName = sanitizeFilename(mk.name);

  // Try different extensions
  const extensions = ['JPG', 'jpg', 'PNG', 'png'];
  let downloaded = false;

  for (const ext of extensions) {
    const filename = `${sanitizedName}.${ext}`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Check if already exists
    if (fileExists(filepath)) {
      console.log(`[${index + 1}/${total}] ⏭️  Skipped ${mk.name} - already exists`);
      stats.skipped++;
      return true;
    }
  }

  // For now, we'll log that we need Playwright to get the actual image URL
  console.log(`[${index + 1}/${total}] 🔍 ${mk.name} (MK ID: ${mk.mkId})`);
  console.log(`   Profile: ${mk.profileUrl}`);

  return false;
}

/**
 * Main execution function
 */
async function main() {
  console.log('=== Knesset Member Photo Download Script ===\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory: ${OUTPUT_DIR}\n`);
  }

  // Parse MKs from markdown
  console.log('📖 Parsing MK list from markdown file...');
  const mks = parseMKsFromMarkdown();
  stats.total = mks.length;
  console.log(`✓ Found ${mks.length} MKs\n`);

  console.log('⚠️  This script identifies MKs that need photo downloads.');
  console.log('   To download photos, we need to use Playwright MCP to:');
  console.log('   1. Navigate to each profile page');
  console.log('   2. Extract the profile image URL');
  console.log('   3. Download the image\n');

  console.log('Starting process...\n');
  console.log('='.repeat(80));

  // Export MK data for Playwright script
  const mkData = {
    mks,
    outputDir: OUTPUT_DIR,
    timestamp: new Date().toISOString()
  };

  const dataFilePath = path.join(__dirname, 'mk-data.json');
  fs.writeFileSync(dataFilePath, JSON.stringify(mkData, null, 2));
  console.log(`✓ Exported MK data to: ${dataFilePath}\n`);

  // List all MKs
  console.log('MK List for Download:');
  console.log('-'.repeat(80));
  mks.forEach((mk, index) => {
    console.log(`${(index + 1).toString().padStart(3)}. ${mk.name.padEnd(40)} MK ID: ${mk.mkId}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n=== Summary ===');
  console.log(`Total MKs to process: ${stats.total}`);
  console.log(`\nNext steps:`);
  console.log(`1. Use Playwright MCP to navigate to each profile page`);
  console.log(`2. Extract image URLs using the pattern found`);
  console.log(`3. Download all ${mks.length} profile photos`);
  console.log(`\nData file: ${dataFilePath}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

// Export for use as module
module.exports = {
  parseMKsFromMarkdown,
  sanitizeFilename,
  downloadImage,
  downloadMKPhoto,
  OUTPUT_DIR,
  DELAY_BETWEEN_REQUESTS
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

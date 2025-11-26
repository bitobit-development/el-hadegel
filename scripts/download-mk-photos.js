const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Script to download profile photos of all Knesset members
 * Reads from docs/parlament-website/all-mks-list.md
 * Saves images to docs/parlament-website/pm-profile-img/
 */

const MARKDOWN_FILE = path.join(__dirname, '../docs/parlament-website/all-mks-list.md');
const OUTPUT_DIR = path.join(__dirname, '../docs/parlament-website/pm-profile-img');
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests

// Statistics
const stats = {
  total: 0,
  successful: 0,
  failed: 0,
  errors: []
};

/**
 * Parse the markdown file to extract MK information
 */
function parseMKsFromMarkdown() {
  const content = fs.readFileSync(MARKDOWN_FILE, 'utf-8');
  const lines = content.split('\n');
  const mks = [];

  // Find the table rows (skip header rows)
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('|') && line.includes('Profile](')) {
      // Extract data from table row
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
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .trim();
}

/**
 * Download image from URL
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to process all MKs
 */
async function main() {
  console.log('=== Knesset Member Photo Download Script ===\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Parse MKs from markdown
  console.log('Parsing MK list from markdown file...');
  const mks = parseMKsFromMarkdown();
  stats.total = mks.length;
  console.log(`Found ${mks.length} MKs\n`);

  console.log('⚠️  NOTE: This script requires manual intervention.');
  console.log('For each MK, you need to:');
  console.log('1. Use Playwright MCP to navigate to the profile URL');
  console.log('2. Take a snapshot to find the profile image');
  console.log('3. Extract the image URL');
  console.log('4. Download the image\n');

  console.log('MK Profile URLs:');
  console.log('================\n');

  // Print all MKs with their information
  mks.forEach((mk, index) => {
    console.log(`${index + 1}. ${mk.name}`);
    console.log(`   Party: ${mk.party}`);
    console.log(`   MK ID: ${mk.mkId}`);
    console.log(`   Profile: ${mk.profileUrl}`);
    console.log('');
  });

  console.log('\n=== Summary ===');
  console.log(`Total MKs: ${stats.total}`);
  console.log('\nTo download photos, we need to use Playwright MCP to:');
  console.log('1. Navigate to each profile URL');
  console.log('2. Locate the profile image element');
  console.log('3. Extract the image source URL');
  console.log('4. Download and save each image');
  console.log('\nThis requires browser automation with the Playwright MCP tools.');
}

// Export for use as module
module.exports = {
  parseMKsFromMarkdown,
  sanitizeFilename,
  downloadImage,
  OUTPUT_DIR,
  DELAY_BETWEEN_REQUESTS
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

// Read the markdown file and extract MK data
function parseMKsFromMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const mks = [];

  for (const line of lines) {
    // Match table rows with MK data
    const match = line.match(/\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*\[Profile\]\((https:\/\/[^)]+)\)/);
    if (match) {
      const [, name, party, mkId, profileUrl] = match;
      mks.push({ name: name.trim(), party: party.trim(), mkId: mkId.trim(), profileUrl });
    }
  }

  return mks;
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
}

async function main() {
  console.log('Starting MK image download process...');

  const mkListPath = path.join(__dirname, '../docs/parlament-website/all-mks-list.md');
  const outputDir = path.join(__dirname, '../docs/parlament-website/pm-profile-img');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Parse MKs from markdown
  const mks = parseMKsFromMarkdown(mkListPath);
  console.log(`Found ${mks.length} MKs to process`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < mks.length; i++) {
    const mk = mks[i];
    const progress = `[${i + 1}/${mks.length}]`;

    try {
      console.log(`${progress} Processing: ${mk.name}...`);

      // Navigate to profile page (use desktop site instead of mobile)
      const desktopUrl = mk.profileUrl.replace('m.knesset.gov.il', 'main.knesset.gov.il');
      await page.goto(desktopUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait a bit for dynamic content to load
      await page.waitForTimeout(2000);

      // Extract the background-image URL from the lobby-img div
      const imageUrl = await page.evaluate(() => {
        const lobbyImgDiv = document.querySelector('.lobby-img[role="img"]');
        if (lobbyImgDiv) {
          const style = lobbyImgDiv.getAttribute('style');
          const match = style.match(/url\("(.+?)"\)/);
          if (match && match[1]) {
            return match[1];
          }
        }
        return null;
      });

      if (imageUrl) {
        const mkFolderName = sanitizeFilename(mk.name);
        const mkFolder = path.join(outputDir, mkFolderName);

        // Create folder for this MK
        if (!fs.existsSync(mkFolder)) {
          fs.mkdirSync(mkFolder, { recursive: true });
        }

        const filename = 'profile.jpg';
        const filepath = path.join(mkFolder, filename);

        await downloadImage(imageUrl, filepath);
        console.log(`${progress} ✓ Downloaded: ${mkFolderName}/${filename}`);
        successCount++;
      } else {
        console.log(`${progress} ✗ No image found for: ${mk.name}`);
        failCount++;
      }

      // Small delay between requests
      await page.waitForTimeout(500);

    } catch (error) {
      console.error(`${progress} ✗ Error processing ${mk.name}:`, error.message);
      failCount++;
    }
  }

  await browser.close();

  console.log('\n=== Summary ===');
  console.log(`Total MKs: ${mks.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Images saved to: ${outputDir}`);
}

main().catch(console.error);

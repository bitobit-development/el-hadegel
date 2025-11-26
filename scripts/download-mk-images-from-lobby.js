const fs = require('fs');
const path = require('path');
const https = require('https');
const { chromium } = require('playwright');

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
  console.log('Starting MK image download from lobby page...');

  const outputDir = path.join(__dirname, '../docs/parlament-website/pm-profile-img');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to lobby page...');
  await page.goto('https://main.knesset.gov.il/mk/apps/mklobby/main/current-knesset-mks/all-current-mks', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for content to load
  console.log('Waiting for content to load...');
  await page.waitForTimeout(5000);

  // Scroll to load all images
  console.log('Scrolling to load all images...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Wait for images to load after scrolling
  await page.waitForTimeout(3000);

  // Extract all MK data from the lobby page
  console.log('Extracting MK data...');
  const mkData = await page.evaluate(() => {
    // Try multiple selectors
    let lobbyImgs = document.querySelectorAll('.lobby-img[role="img"]');
    console.log('With role="img":', lobbyImgs.length);

    if (lobbyImgs.length === 0) {
      lobbyImgs = document.querySelectorAll('.lobby-img');
      console.log('Without role:', lobbyImgs.length);
    }

    if (lobbyImgs.length === 0) {
      lobbyImgs = document.querySelectorAll('[role="img"]');
      console.log('All role="img":', lobbyImgs.length);
    }

    if (lobbyImgs.length === 0) {
      lobbyImgs = document.querySelectorAll('div[style*="background-image"]');
      console.log('All divs with background-image:', lobbyImgs.length);
    }

    const data = [];

    lobbyImgs.forEach((div) => {
      const style = div.getAttribute('style');
      const label = div.getAttribute('aria-label');

      if (style && style.includes('background-image')) {
        // Extract URL from background-image style
        const match = style.match(/url\(["']?(.+?)["']?\)/);
        if (match && match[1]) {
          const name = label ? label.replace('חבר הכנסת ', '').replace('חברת הכנסת ', '') : 'Unknown';
          data.push({
            name,
            imageUrl: match[1]
          });
        }
      }
    });

    return data;
  });

  await browser.close();

  console.log(`Found ${mkData.length} MKs with images`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < mkData.length; i++) {
    const mk = mkData[i];
    const progress = `[${i + 1}/${mkData.length}]`;

    try {
      console.log(`${progress} Processing: ${mk.name}...`);

      const mkFolderName = sanitizeFilename(mk.name);
      const mkFolder = path.join(outputDir, mkFolderName);

      // Create folder for this MK
      if (!fs.existsSync(mkFolder)) {
        fs.mkdirSync(mkFolder, { recursive: true });
      }

      const filename = 'profile.jpg';
      const filepath = path.join(mkFolder, filename);

      await downloadImage(mk.imageUrl, filepath);
      console.log(`${progress} ✓ Downloaded: ${mkFolderName}/${filename}`);
      successCount++;

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`${progress} ✗ Error processing ${mk.name}:`, error.message);
      failCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total MKs: ${mkData.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Images saved to: ${outputDir}`);
}

main().catch(console.error);

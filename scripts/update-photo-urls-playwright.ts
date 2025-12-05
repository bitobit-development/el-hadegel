import 'dotenv/config';
import prisma from '../lib/prisma';
import { chromium } from 'playwright';

async function updatePhotoUrls() {
  console.log('🔄 Fetching correct photo URLs from Knesset website...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const mks = await prisma.mK.findMany({
    select: {
      mkId: true,
      nameHe: true,
      photoUrl: true,
    },
    orderBy: { mkId: 'asc' },
  });

  let updated = 0;
  let failed = 0;
  let unchanged = 0;

  for (const mk of mks) {
    try {
      const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mk.mkId}`;
      console.log(`📷 ${mk.nameHe} (${mk.mkId})...`);

      // Navigate to MK's page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for the Angular app to load and render the profile photo
      let photoUrl = null;
      try {
        // Wait for the lobby-img div that contains the profile photo as background-image
        await page.waitForSelector('.lobby-img', { timeout: 10000 });

        // Extract photo URL from the background-image CSS property
        photoUrl = await page.evaluate(() => {
          // The profile photo is set as background-image on the .lobby-img div
          const lobbyImg = document.querySelector('.lobby-img');
          if (lobbyImg) {
            const style = window.getComputedStyle(lobbyImg);
            const bgImage = style.backgroundImage;
            // Extract URL from: url("https://...")
            const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
            if (match && match[1]) {
              // Remove query parameters like ?v=timestamp
              return match[1].split('?')[0];
            }
          }
          return null;
        });
      } catch (e) {
        // Element didn't appear, skip
      }

      if (!photoUrl) {
        console.log(`  ⚠️  No photo URL found`);
        failed++;
        continue;
      }

      // Verify the new URL works
      const response = await fetch(photoUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.log(`  ❌ Photo URL returns HTTP ${response.status}`);
        failed++;
        continue;
      }

      // Update database if URL changed
      if (photoUrl !== mk.photoUrl) {
        await prisma.mK.update({
          where: { mkId: mk.mkId },
          data: { photoUrl },
        });
        console.log(`  ✅ Updated`);
        updated++;
      } else {
        console.log(`  ℹ️  Unchanged`);
        unchanged++;
      }

    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ℹ️  Unchanged: ${unchanged}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total: ${mks.length}`);

  await prisma.$disconnect();
}

updatePhotoUrls().catch(console.error);

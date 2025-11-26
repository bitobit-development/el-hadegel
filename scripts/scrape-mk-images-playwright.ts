import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

interface ScrapeResult {
  mkId: number;
  nameHe: string;
  success: boolean;
  photoUrl?: string;
  error?: string;
}

/**
 * Scrapes the profile image URL for a given MK from the Knesset mobile website
 */
async function scrapeImageUrl(page: any, mkId: number): Promise<string | null> {
  try {
    const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`;
    console.log(`  Navigating to: ${url}`);

    // Navigate to MK profile page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the lobby-img div to load
    await page.waitForSelector('.lobby-img', { timeout: 10000 });

    // Extract the background-image URL from the style attribute
    const imageUrl = await page.evaluate(() => {
      const lobbyImg = document.querySelector('.lobby-img');
      if (!lobbyImg) return null;

      const style = lobbyImg.getAttribute('style');
      if (!style) return null;

      // Extract URL from style="background-image: url('...')"
      const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
      return match ? match[1] : null;
    });

    if (!imageUrl) {
      console.log(`  ⚠️  No image found in lobby-img div`);
      return null;
    }

    // Clean URL by removing query parameters
    const cleanUrl = imageUrl.split('?')[0];
    console.log(`  ✓ Found image: ${cleanUrl}`);

    return cleanUrl;
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting MK Image Scraper with Playwright\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Fetch all MKs from database
  const mks = await prisma.mK.findMany({
    select: { mkId: true, nameHe: true, photoUrl: true },
    orderBy: { mkId: 'asc' }
  });

  console.log(`📊 Found ${mks.length} MKs in database\n`);

  const results: ScrapeResult[] = [];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Loop through MKs and scrape images
  for (let i = 0; i < mks.length; i++) {
    const mk = mks[i];
    console.log(`\n[${i + 1}/${mks.length}] Processing: ${mk.nameHe} (ID: ${mk.mkId})`);

    // Skip if already has a valid Knesset photo URL
    if (mk.photoUrl && mk.photoUrl.includes('knesset.gov.il')) {
      console.log(`  ⏭️  Already has Knesset photo, skipping`);
      skippedCount++;
      results.push({
        mkId: mk.mkId,
        nameHe: mk.nameHe,
        success: true,
        photoUrl: mk.photoUrl
      });
      continue;
    }

    const imageUrl = await scrapeImageUrl(page, mk.mkId);

    if (imageUrl) {
      // Update database with the scraped image URL
      try {
        await prisma.mK.update({
          where: { mkId: mk.mkId },
          data: { photoUrl: imageUrl }
        });

        console.log(`  💾 Database updated successfully`);
        successCount++;
        results.push({
          mkId: mk.mkId,
          nameHe: mk.nameHe,
          success: true,
          photoUrl: imageUrl
        });
      } catch (error) {
        console.log(`  ✗ Database update failed: ${error instanceof Error ? error.message : String(error)}`);
        failCount++;
        results.push({
          mkId: mk.mkId,
          nameHe: mk.nameHe,
          success: false,
          error: 'Database update failed'
        });
      }
    } else {
      failCount++;
      results.push({
        mkId: mk.mkId,
        nameHe: mk.nameHe,
        success: false,
        error: 'Failed to scrape image URL'
      });
    }

    // Small delay to avoid overwhelming the server
    await page.waitForTimeout(500);
  }

  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 SCRAPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully scraped and updated: ${successCount}`);
  console.log(`⏭️  Skipped (already had Knesset photos): ${skippedCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total MKs processed: ${mks.length}`);

  // Print failed MKs if any
  if (failCount > 0) {
    console.log('\n❌ Failed MKs:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.nameHe} (ID: ${r.mkId}): ${r.error}`);
      });
  }

  console.log('\n✨ Script completed!\n');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

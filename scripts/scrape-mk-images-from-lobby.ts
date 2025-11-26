import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

interface MKImageData {
  mkId: number;
  imageUrl: string;
  name: string;
}

async function scrapeAllMKImages(): Promise<MKImageData[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    const url = 'https://main.knesset.gov.il/mk/apps/mklobby/main/current-knesset-mks/all-current-mks';
    console.log(`Navigating to: ${url}\n`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the profile cards to appear
    console.log('Waiting for profile cards to load...');
    await page.waitForSelector('.profile-card-container', { timeout: 15000 });

    // Wait for all cards to render
    await page.waitForTimeout(5000);

    console.log('✓ Profile cards loaded\n');

    // Extract all MK data from profile cards
    const mkData = await page.evaluate(() => {
      const cards = document.querySelectorAll('.profile-card-container');
      const results: Array<{ mkId: number; imageUrl: string; name: string }> = [];

      cards.forEach((card) => {
        // Find the link (contains mkId in href)
        const link = card.querySelector('a[href*="/mk-personal-details/"]');
        if (!link) return;

        const href = link.getAttribute('href');
        const mkIdMatch = href?.match(/\/mk-personal-details\/(\d+)/);
        if (!mkIdMatch) return;

        const mkId = parseInt(mkIdMatch[1], 10);

        // Find the img element
        const img = card.querySelector('img[src*="fs.knesset.gov.il"]');
        if (!img) return;

        const imageUrl = img.getAttribute('src');
        if (!imageUrl) return;

        // Clean URL (remove query parameters)
        const cleanUrl = imageUrl.split('?')[0];

        // Get name from profile-name div
        const nameDiv = card.querySelector('.profile-name');
        const name = nameDiv?.textContent?.trim() || '';

        results.push({
          mkId,
          imageUrl: cleanUrl,
          name
        });
      });

      return results;
    });

    await browser.close();
    return mkData;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting MK Image Scraper from Lobby Page\n');

  try {
    // Scrape all MK images
    console.log('📥 Scraping MK lobby page...');
    const scrapedData = await scrapeAllMKImages();
    console.log(`✓ Found ${scrapedData.length} MKs with images\n`);

    // Get all MKs from database
    const dbMKs = await prisma.mK.findMany({
      select: { mkId: true, nameHe: true, photoUrl: true }
    });

    console.log(`📊 Database has ${dbMKs.length} MKs\n`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    // Update database
    for (const dbMK of dbMKs) {
      const scraped = scrapedData.find(s => s.mkId === dbMK.mkId);

      if (!scraped) {
        console.log(`⚠️  ${dbMK.nameHe} (${dbMK.mkId}) - Not found in lobby page`);
        notFound++;
        continue;
      }

      // Skip if already has the same URL
      if (dbMK.photoUrl === scraped.imageUrl) {
        console.log(`⏭️  ${dbMK.nameHe} (${dbMK.mkId}) - Already up to date`);
        skipped++;
        continue;
      }

      // Update database
      await prisma.mK.update({
        where: { mkId: dbMK.mkId },
        data: { photoUrl: scraped.imageUrl }
      });

      console.log(`✅ ${dbMK.nameHe} (${dbMK.mkId}) - Updated`);
      console.log(`   ${scraped.imageUrl}`);
      updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 SCRAPING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped (already current): ${skipped}`);
    console.log(`⚠️  Not found in lobby: ${notFound}`);
    console.log(`📊 Total: ${dbMKs.length}`);
    console.log('\n✨ Script completed!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import prisma from '../lib/prisma';
import * as cheerio from 'cheerio';

async function updatePhotoUrls() {
  console.log('🔄 Fetching correct photo URLs from Knesset website...\n');

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
      // Fetch the MK's profile page
      const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mk.mkId}`;
      console.log(`Fetching ${mk.nameHe} (${mk.mkId})...`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.log(`  ❌ Failed to fetch page (HTTP ${response.status})`);
        failed++;
        continue;
      }

      // Wait for the page to load (it's an Angular app)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const html = await response.text();
      const $ = cheerio.load(html);

      // Try to find the photo URL in the HTML
      // Look for img tags with MK in the src
      let photoUrl = null;

      // Method 1: Look for img src containing "MKPersonalDetailsImages"
      $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('MKPersonalDetailsImages')) {
          photoUrl = src;
          if (!photoUrl.startsWith('http')) {
            photoUrl = `https://main.knesset.gov.il${photoUrl}`;
          }
          return false; // break
        }
      });

      // Method 2: Look for any img with the MK ID in the path
      if (!photoUrl) {
        $('img').each((_, el) => {
          const src = $(el).attr('src');
          if (src && src.includes(`/${mk.mkId}/`)) {
            photoUrl = src;
            if (!photoUrl.startsWith('http')) {
              photoUrl = `https://main.knesset.gov.il${photoUrl}`;
            }
            return false; // break
          }
        });
      }

      if (!photoUrl) {
        console.log(`  ⚠️  No photo URL found in HTML`);
        failed++;
        continue;
      }

      // Verify the new URL works
      const testResponse = await fetch(photoUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.log(`  ❌ New URL doesn't work (HTTP ${testResponse.status})`);
        failed++;
        continue;
      }

      // Update database if URL changed
      if (photoUrl !== mk.photoUrl) {
        await prisma.mK.update({
          where: { mkId: mk.mkId },
          data: { photoUrl },
        });
        console.log(`  ✅ Updated: ${photoUrl.substring(0, 80)}...`);
        updated++;
      } else {
        console.log(`  ℹ️  URL unchanged`);
        unchanged++;
      }

    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Unchanged: ${unchanged}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${mks.length}`);

  await prisma.$disconnect();
}

updatePhotoUrls().catch(console.error);

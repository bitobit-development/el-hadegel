import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';

// All MK IDs from batch-scrape-contacts.md
const allMkIds = [
  // Batch 1 (COMPLETED)
  1, 35, 41, 69, 90, 103, 208, 214, 723, 751,
  // Batch 2
  754, 768, 771, 814, 826, 837, 854, 860, 861, 872,
  // Batch 3
  874, 876, 878, 881, 884, 899, 905, 906, 914, 915,
  // Batch 4
  938, 948, 950, 951, 953, 956, 957, 970, 974, 976,
  // Batch 5
  977, 978, 981, 982, 987, 988, 992, 994, 995, 996,
  // Batch 6
  998, 1000, 1002, 1003, 1004, 1006, 1007, 1008, 1011, 1013,
  // Batch 7
  1018, 1022, 1026, 1029, 1032, 1039, 1043, 1044, 1045, 1048,
  // Batch 8
  1049, 1050, 1055, 1056, 1059, 1060, 1061, 1063, 1066, 1067,
  // Batch 9
  1068, 1076, 1079, 1082, 1085, 1088, 1090, 1091, 1093, 1094,
  // Batch 10
  1095, 1096, 1098, 1099, 1100, 1101, 1102, 1103, 1105, 1106,
  // Batch 11
  1107, 1108, 1109, 1110, 1111, 1112, 1114, 1115, 1116, 1118,
  // Batch 12
  1121, 1122, 1123, 1124, 1125, 1126, 1127, 1128, 1129, 1130
];

// Skip already scraped IDs (Batches 1-6 completed)
const alreadyScraped = [
  1, 35, 41, 69, 90, 103, 208, 214, 723, 751, 1063, // Batch 1
  754, 768, 771, 814, 826, 837, 854, 860, 861, 872, // Batch 2
  874, 876, 878, 881, 884, 899, 905, 906, 914, 915, // Batch 3
  938, 948, 950, 951, 953, 956, 957, 970, 974, 976, // Batch 4
  977, 978, 981, 982, 987, 988, 992, 994, 995, 996, // Batch 5
  998, 1000, 1002, 1003, 1004, 1006, 1007, 1008, 1011, 1013 // Batch 6
];
const mkIdsToScrape = allMkIds.filter(id => !alreadyScraped.includes(id));

interface ContactData {
  mkId: number;
  phone: string | null;
  email: string | null;
  nameHe?: string;
}

async function scrapeContacts() {
  console.log('🚀 Starting automated contact scraping...\n');
  console.log(`📊 Total MKs to scrape: ${mkIdsToScrape.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results: ContactData[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < mkIdsToScrape.length; i++) {
    const mkId = mkIdsToScrape[i];
    const progress = `[${i + 1}/${mkIdsToScrape.length}]`;

    try {
      console.log(`${progress} Scraping MK ${mkId}...`);

      // Navigate to MK page
      await page.goto(`https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for content to load - wait for h2 heading to appear (indicates page loaded)
      await page.waitForSelector('h2', { timeout: 10000 });
      await page.waitForTimeout(2000); // Additional wait for dynamic content

      // Extract contact info
      const contact = await page.evaluate(() => {
        // Find the contact div by looking for the phone label
        const phoneLabels = Array.from(document.querySelectorAll('generic'));
        const phoneLabel = phoneLabels.find(el => el.getAttribute('generic') === 'טלפון');

        let phone = null;
        let email = null;

        if (phoneLabel && phoneLabel.nextElementSibling) {
          phone = phoneLabel.nextElementSibling.textContent?.trim() || null;
        }

        // Find email link
        const emailLink = document.querySelector('a[href^="mailto:"]');
        email = emailLink ? emailLink.textContent?.trim() : null;

        // Get MK name from page title
        const nameHeading = document.querySelector('h2');
        const nameHe = nameHeading ? nameHeading.textContent?.trim() : null;

        return { phone, email, nameHe };
      });

      results.push({ mkId, phone: contact.phone, email: contact.email, nameHe: contact.nameHe || undefined });
      console.log(`✅ ${contact.nameHe || mkId}: phone="${contact.phone}", email="${contact.email}"`);
      successCount++;

      // Small delay between requests to be respectful
      await page.waitForTimeout(1000);

    } catch (error) {
      console.error(`❌ Error scraping MK ${mkId}:`, error);
      results.push({ mkId, phone: null, email: null });
      errorCount++;
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('📈 SCRAPING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully scraped: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📊 Total processed: ${mkIdsToScrape.length}`);
  console.log('\n💾 Updating database...\n');

  // Update database
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const contact of results) {
    try {
      const mk = await prisma.mK.findUnique({
        where: { mkId: contact.mkId },
        select: { mkId: true, nameHe: true, phone: true, email: true }
      });

      if (!mk) {
        console.log(`⚠️  MK ${contact.mkId} not found in database`);
        notFound++;
        continue;
      }

      if (mk.phone === contact.phone && mk.email === contact.email) {
        skipped++;
        continue;
      }

      await prisma.mK.update({
        where: { mkId: contact.mkId },
        data: {
          phone: contact.phone,
          email: contact.email
        }
      });

      console.log(`✅ ${mk.nameHe} (${contact.mkId}) - Updated`);
      updated++;

    } catch (error) {
      console.error(`❌ Error updating MK ${contact.mkId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 DATABASE UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped (already current): ${skipped}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log('\n✨ All done!\n');
}

scrapeContacts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

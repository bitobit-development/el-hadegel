/**
 * Automated script to extract contact details (phone and email) for Knesset Members
 * from the Knesset website and update the database.
 *
 * Usage: npx tsx scripts/extract-mk-contacts.ts
 */

import { chromium, Browser, Page } from 'playwright';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma';
// Initialize Prisma with better-sqlite3 adapter (same as lib/prisma.ts)

interface MKContact {
  mkId: number;
  nameHe: string;
  phone: string | null;
  email: string | null;
}

/**
 * Extract contact details from MK profile page
 */
async function extractMKContacts(page: Page, mkId: number): Promise<{ phone: string | null; email: string | null }> {
  try {
    const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`;
    console.log(`  Navigating to: ${url}`);

    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Extract phone number (look for phone icon and adjacent text)
    let phone: string | null = null;
    try {
      const phoneElement = await page.locator('text=/02-\\d{7}|02-\\d{7}, 02-\\d{7}/').first();
      const phoneText = await phoneElement.textContent({ timeout: 5000 });
      phone = phoneText?.trim() || null;
    } catch (e) {
      console.log('  ⚠️  No phone found');
    }

    // Extract email (look for mailto links)
    let email: string | null = null;
    try {
      const emailElement = await page.locator('a[href^="mailto:"]').first();
      const emailHref = await emailElement.getAttribute('href', { timeout: 5000 });
      email = emailHref?.replace('mailto:', '') || null;
    } catch (e) {
      console.log('  ⚠️  No email found');
    }

    return { phone, email };
  } catch (error) {
    console.error(`  ❌ Error extracting contacts for MK ${mkId}:`, error);
    return { phone: null, email: null };
  }
}

/**
 * Update MK contact details in database
 */
async function updateMKContacts(mkId: number, phone: string | null, email: string | null): Promise<void> {
  try {
    await prisma.mK.update({
      where: { mkId },
      data: {
        phone: phone || undefined,
        email: email || undefined,
      },
    });
    console.log(`  ✅ Updated database for MK ${mkId}`);
  } catch (error) {
    console.error(`  ❌ Error updating database for MK ${mkId}:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting MK contact extraction...\n');

  let browser: Browser | null = null;

  try {
    // Get all MKs missing contact details
    const mksToProcess = await prisma.mK.findMany({
      where: {
        OR: [
          { phone: null },
          { email: null },
        ],
      },
      select: {
        mkId: true,
        nameHe: true,
      },
      orderBy: { mkId: 'asc' },
    });

    console.log(`📋 Found ${mksToProcess.length} MKs missing contact details\n`);

    if (mksToProcess.length === 0) {
      console.log('✅ All MKs already have contact details!');
      return;
    }

    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });

    const page = await context.newPage();

    // Process each MK one at a time
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < mksToProcess.length; i++) {
      const mk = mksToProcess[i];
      console.log(`\n[${i + 1}/${mksToProcess.length}] Processing: ${mk.nameHe} (ID: ${mk.mkId})`);

      try {
        // Extract contacts
        const { phone, email } = await extractMKContacts(page, mk.mkId);

        if (phone || email) {
          console.log(`  📞 Phone: ${phone || 'N/A'}`);
          console.log(`  📧 Email: ${email || 'N/A'}`);

          // Update database
          await updateMKContacts(mk.mkId, phone, email);
          successCount++;
        } else {
          console.log(`  ⚠️  No contact details found`);
          errorCount++;
        }

        // Small delay between requests to be respectful
        if (i < mksToProcess.length - 1) {
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${mk.nameHe}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Extraction Summary:');
    console.log(`   Total processed: ${mksToProcess.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

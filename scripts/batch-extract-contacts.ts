import { chromium } from 'playwright';
import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db');

interface MKToProcess {
  mkId: number;
  nameHe: string;
}

interface ExtractedContact {
  mkId: number;
  name: string;
  phone: string | null;
  email: string | null;
}

async function extractContactsFromPage(page: any, url: string): Promise<{ phone: string | null; email: string | null }> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    // Wait longer for Angular app to load
    await page.waitForTimeout(4000);

    const result = await page.evaluate(() => {
      let phone: string | null = null;
      let email: string | null = null;

      // Find phone - match single or multiple phone numbers
      const phoneRegex = /02-\d{7}(?:,\s*02-\d{7})*/;
      const bodyText = document.body.innerText;
      const phoneMatch = bodyText.match(phoneRegex);
      if (phoneMatch) {
        phone = phoneMatch[0];
      }

      // Find email
      const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
      if (emailLinks.length > 0) {
        const href = emailLinks[0].getAttribute('href');
        email = href?.replace('mailto:', '') || null;
      }

      return { phone, email };
    });

    return result;
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    return { phone: null, email: null };
  }
}

async function main() {
  console.log('🚀 Starting batch contact extraction...\n');

  // Get MKs missing contacts
  const mks = db.prepare(`
    SELECT mkId, nameHe
    FROM MK
    WHERE phone IS NULL OR email IS NULL
    ORDER BY mkId
  `).all() as MKToProcess[];

  console.log(`📋 Found ${mks.length} MKs to process\n`);

  const results: ExtractedContact[] = [];
  let successCount = 0;

  // Launch browser once and reuse page
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (let i = 0; i < mks.length; i++) {
    const mk = mks[i];
    console.log(`[${i + 1}/${mks.length}] ${mk.nameHe} (${mk.mkId})...`);

    const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mk.mkId}`;
    const { phone, email } = await extractContactsFromPage(page, url);

    if (phone || email) {
      console.log(`  ✅ Phone: ${phone || 'N/A'} | Email: ${email || 'N/A'}`);

      // Update database
      db.prepare(`
        UPDATE MK
        SET phone = ?, email = ?
        WHERE mkId = ?
      `).run(phone, email, mk.mkId);

      successCount++;
    } else {
      console.log(`  ⚠️  No contacts found`);
    }

    results.push({ mkId: mk.mkId, name: mk.nameHe, phone, email });
  }

  await browser.close();
  db.close();

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Complete! Updated ${successCount}/${mks.length} MKs`);
  console.log('='.repeat(60));
}

main().catch(console.error);

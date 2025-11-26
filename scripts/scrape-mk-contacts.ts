import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

/**
 * This script provides a template for scraping MK contact information.
 * Since the Knesset website blocks automated scraping, you'll need to:
 *
 * 1. Use Playwright MCP interactively to navigate to each MK page
 * 2. Run the extraction code to get phone and email
 * 3. Manually compile the results into the contactData array below
 *
 * Example extraction code for Playwright MCP:
 *
 * await page.goto('https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/1063');
 * await page.evaluate(() => {
 *   const contactDiv = document.querySelector('.mk-contact');
 *   if (!contactDiv) return null;
 *   const phoneSpan = contactDiv.querySelector('span');
 *   const phone = phoneSpan ? phoneSpan.textContent?.trim() : null;
 *   const emailLink = contactDiv.querySelector('a[href^="mailto:"]');
 *   const email = emailLink ? emailLink.textContent?.trim() : null;
 *   return { phone, email };
 * });
 */

interface ContactData {
  mkId: number;
  phone: string | null;
  email: string | null;
}

// Add scraped contact data here
const contactData: ContactData[] = [
  { mkId: 1, phone: "02-6408460", email: "yedelstein@knesset.gov.il" },
  { mkId: 35, phone: "02-6408997, 02-6408328", email: "mgafni@knesset.gov.il" },
  { mkId: 41, phone: "02-6408698", email: "aderey@knesset.gov.il" },
  { mkId: 69, phone: null, email: "yiskatz@knesset.gov.il" },
  { mkId: 90, phone: "02-6403227", email: "bnetanyahu@knesset.gov.il" },
  { mkId: 103, phone: "02-6408304", email: "mporush@knesset.gov.il" },
  { mkId: 208, phone: "02-6408337", email: "atibi@knesset.gov.il" },
  { mkId: 214, phone: "02-6408870, 02-6408871", email: "aliberman@knesset.gov.il" },
  { mkId: 723, phone: "02-6408430, 02-6408431", email: "ggamliel@knesset.gov.il" },
  { mkId: 751, phone: "02-6408040", email: "ymargi@knesset.gov.il" },
  { mkId: 1063, phone: "02-6408110, 02-6408212", email: "amaaoz@knesset.gov.il" },
  // Batch 2 (COMPLETED)
  { mkId: 754, phone: "02-6408475", email: "ieichler@knesset.gov.il" },
  { mkId: 768, phone: "02-6408838", email: "zelkin@knesset.gov.il" },
  { mkId: 771, phone: "02-6408422", email: "davraham@knesset.gov.il" },
  { mkId: 814, phone: "02-6408135", email: "umaklev@knesset.gov.il" },
  { mkId: 826, phone: "02-6408411", email: "ylevin@knesset.gov.il" },
  { mkId: 837, phone: "02-6408683", email: "amarh@knesset.gov.il" },
  { mkId: 854, phone: "02-6408145", email: "akramh@knesset.gov.il" },
  { mkId: 860, phone: "02-6408011", email: "kelharrar@knesset.gov.il" },
  { mkId: 861, phone: "02-6408435, 02-6408434", email: "yakova@knesset.gov.il" },
  { mkId: 872, phone: "02-6408387", email: "btoporovsky@knesset.gov.il" },
  // Batch 3 (IN PROGRESS)
  { mkId: 874, phone: "02-6408383", email: "cohenmeir@knesset.gov.il" },
  { mkId: 876, phone: "02-6408187", email: "mickeylevy@knesset.gov.il" },
  { mkId: 878, phone: "02-6753555", email: "ylapid@knesset.gov.il" },
  { mkId: 881, phone: "02-6408009", email: "michaelim@knesset.gov.il" },
  { mkId: 884, phone: "02-6408043", email: "ostruk@knesset.gov.il" },
  { mkId: 899, phone: "02-6408464, 02-6408462", email: "sterne@knesset.gov.il" },
  { mkId: 905, phone: "02-6496203", email: "ptamano@knesset.gov.il" },
  { mkId: 906, phone: "02-6408340", email: "ybentzur@knesset.gov.il" },
  { mkId: 914, phone: "02-6408033, 02-6408821", email: "dbitan@knesset.gov.il" },
  { mkId: 915, phone: "02-6408010", email: "bmerav@knesset.gov.il" },
  // Batch 4 (COMPLETED)
  { mkId: 938, phone: "02-6408419, 02-6408418", email: "aymanod@knesset.gov.il" },
  { mkId: 948, phone: "02-6408367, 02-6408368", email: "aidat@knesset.gov.il" },
  { mkId: 950, phone: "02-6408101, 02-6408102", email: "shaskel@knesset.gov.il" },
  { mkId: 951, phone: "02-6408331", email: "odedfo@knesset.gov.il" },
  { mkId: 953, phone: "02-6408406", email: "amiro@knesset.gov.il" },
  { mkId: 956, phone: "02-6408154", email: "ymalinovsky@knesset.gov.il" },
  { mkId: 957, phone: "02-6408666", email: "malkielim@knesset.gov.il" },
  { mkId: 970, phone: "02-6408453, 02-6408454", email: "yazulai@knesset.gov.il" },
  { mkId: 974, phone: "02-6408416", email: "nbarkat@knesset.gov.il" },
  { mkId: 976, phone: "02-6408465", email: "okatz@knesset.gov.il" },
  // Batch 5 (COMPLETED)
  { mkId: 977, phone: "02-6408023", email: "osofer@knesset.gov.il" },
  { mkId: 978, phone: "02-6408373", email: "ofarkash@knesset.gov.il" },
  { mkId: 981, phone: "02-6408399, 02-6408397", email: "eginzburg@knesset.gov.il" },
  { mkId: 982, phone: "02-6408853", email: "aschuster@knesset.gov.il" },
  { mkId: 987, phone: "02-6496217", email: "kallner@knesset.gov.il" },
  { mkId: 988, phone: "02-6408200", email: "bgantz@knesset.gov.il" },
  { mkId: 992, phone: "02-6753333", email: "hatia@knesset.gov.il" },
  { mkId: 994, phone: "02-6408981", email: "esova@knesset.gov.il" },
  { mkId: 995, phone: "02-6408150", email: "yoavse@knesset.gov.il" },
  { mkId: 996, phone: "02-6408167", email: "ytesler@knesset.gov.il" },
  // Batch 6 (COMPLETED)
  { mkId: 998, phone: "02-6753333", email: "ylahav@knesset.gov.il" },
  { mkId: 1000, phone: "02-6408143", email: "ctropper@knesset.gov.il" },
  { mkId: 1002, phone: "02-6496267, 02-6408054", email: "mgolan@knesset.gov.il" },
  { mkId: 1003, phone: "02-6408028, 02-6408075", email: "mbiton@knesset.gov.il" },
  { mkId: 1004, phone: "02-6408145", email: "mshir@knesset.gov.il" },
  { mkId: 1006, phone: "02-6408310", email: "mecohen@knesset.gov.il" },
  { mkId: 1007, phone: "02-6408161, 02-6408203", email: "mabas@knesset.gov.il" },
  { mkId: 1008, phone: "02-6408528, 02-6408412", email: "marbel@knesset.gov.il" },
  { mkId: 1011, phone: "02-6408834", email: "shlomok@knesset.gov.il" },
  { mkId: 1013, phone: "02-6408125", email: "ocassif@knesset.gov.il" },
  // Add more MKs as you scrape them...
  // Format: { mkId: NUMBER, phone: "PHONE_NUMBER", email: "EMAIL@knesset.gov.il" },
];

async function updateContactInfo() {
  console.log('🚀 Updating MK Contact Information\n');
  console.log(`📊 Total contacts to update: ${contactData.length}\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const contact of contactData) {
    try {
      // Check if MK exists
      const mk = await prisma.mK.findUnique({
        where: { mkId: contact.mkId },
        select: { mkId: true, nameHe: true, phone: true, email: true }
      });

      if (!mk) {
        console.log(`⚠️  MK ${contact.mkId} not found in database`);
        notFound++;
        continue;
      }

      // Skip if already has the same contact info
      if (mk.phone === contact.phone && mk.email === contact.email) {
        console.log(`⏭️  ${mk.nameHe} (${contact.mkId}) - Already current`);
        skipped++;
        continue;
      }

      // Update
      await prisma.mK.update({
        where: { mkId: contact.mkId },
        data: {
          phone: contact.phone,
          email: contact.email
        }
      });

      console.log(`✅ ${mk.nameHe} (${contact.mkId}) - Updated`);
      console.log(`   📞 ${contact.phone}`);
      console.log(`   ✉️  ${contact.email}`);
      updated++;

    } catch (error) {
      console.error(`❌ Error updating MK ${contact.mkId}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped (already current): ${skipped}`);
  console.log(`⚠️  Not found in database: ${notFound}`);
  console.log(`📊 Total processed: ${contactData.length}`);
  console.log('\n✨ Done!\n');
}

updateContactInfo()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function scrapeImageUrl(mkId: number): Promise<string | null> {
  try {
    const url = `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`;
    const response = await fetch(url);
    const html = await response.text();

    // Extract image URL from the lobby-img div
    // Pattern: background-image: url(&quot;...&quot;)
    const match = html.match(/background-image:\s*url\((?:&quot;|")([^"&]+)(?:&quot;|")\)/);
    if (match && match[1]) {
      const imageUrl = match[1];
      // Remove query parameters for cleaner URL
      return imageUrl.split('?')[0];
    }

    return null;
  } catch (error) {
    console.error(`\nFailed to scrape MK ${mkId}:`, error);
    return null;
  }
}

async function main() {
  console.log('Starting to scrape MK profile images...\n');

  const mks = await prisma.mK.findMany({
    select: { mkId: true, nameHe: true, photoUrl: true },
    orderBy: { mkId: 'asc' }
  });

  let updated = 0;
  let failed = 0;

  for (const mk of mks) {
    process.stdout.write(`Scraping ${mk.nameHe} (${mk.mkId})...`);

    const imageUrl = await scrapeImageUrl(mk.mkId);

    if (imageUrl) {
      await prisma.mK.update({
        where: { mkId: mk.mkId },
        data: { photoUrl: imageUrl }
      });
      console.log(` ✓ ${imageUrl}`);
      updated++;
    } else {
      console.log(` ✗ Failed`);
      failed++;
    }

    // Add a small delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✓ Updated ${updated} MK images`);
  console.log(`✗ Failed to scrape ${failed} MK images`);
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
  });

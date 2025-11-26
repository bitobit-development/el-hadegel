import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function getMKIds() {
  const mks = await prisma.mK.findMany({
    select: { mkId: true, nameHe: true },
    orderBy: { mkId: 'asc' }
  });

  console.log('MK IDs for scraping:\n');
  console.log(JSON.stringify(mks.map(mk => mk.mkId), null, 2));
  console.log(`\nTotal: ${mks.length} MKs`);
}

getMKIds()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

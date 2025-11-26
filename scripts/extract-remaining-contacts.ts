import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db');

interface MKToProcess {
  mkId: number;
  nameHe: string;
}

async function main() {
  // Get MKs missing contacts
  const mks = db.prepare(`
    SELECT mkId, nameHe
    FROM MK
    WHERE phone IS NULL OR email IS NULL
    ORDER BY mkId
  `).all() as MKToProcess[];

  console.log(`📋 ${mks.length} MKs remaining:\n`);

  for (const mk of mks) {
    console.log(`${mk.mkId}: ${mk.nameHe}`);
    console.log(`   URL: https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mk.mkId}`);
  }

  db.close();
}

main().catch(console.error);

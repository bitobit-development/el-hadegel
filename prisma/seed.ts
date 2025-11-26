import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // Read the MK data from markdown file
  const mkDataPath = path.join(__dirname, '../docs/parlament-website/all-mks-list.md');
  const mkDataContent = fs.readFileSync(mkDataPath, 'utf-8');

  // Parse the markdown table
  const tableLines = mkDataContent.split('\n').filter(line => line.startsWith('|'));

  // Skip header rows (first 2 lines are header and separator)
  const dataLines = tableLines.slice(2);

  const mksToCreate = [];

  for (const line of dataLines) {
    // Split by | and clean up
    const columns = line.split('|').map(col => col.trim()).filter(col => col);

    if (columns.length < 5) continue;

    const [_, nameHe, faction, mkIdStr, profileLinkCell] = columns;

    // Extract MK ID from the cell (it's a number)
    const mkId = parseInt(mkIdStr, 10);

    // Extract profile URL from markdown link [Profile](url)
    const profileUrlMatch = profileLinkCell.match(/\[Profile\]\((.*?)\)/);
    const profileUrl = profileUrlMatch ? profileUrlMatch[1] : `https://m.knesset.gov.il/mk/apps/mk/mk-personal-details/${mkId}`;

    if (!isNaN(mkId) && nameHe && faction) {
      // Generate photo URL using the Knesset's CDN pattern
      const photoUrl = `https://fs.knesset.gov.il/globaldocs/MK/${mkId}/1_${mkId}_3_1732.jpeg`;

      mksToCreate.push({
        mkId,
        nameHe,
        faction,
        profileUrl,
        photoUrl,
        currentPosition: 'NEUTRAL' as const,
      });
    }
  }

  console.log(`📊 Found ${mksToCreate.length} Knesset members to import`);

  // Create all MKs
  for (const mkData of mksToCreate) {
    await prisma.mK.upsert({
      where: { mkId: mkData.mkId },
      update: mkData,
      create: mkData,
    });
  }

  console.log(`✅ Successfully seeded ${mksToCreate.length} Knesset members`);

  // Create a default admin user (password: admin123 - hashed with bcrypt)
  // For production, this should be changed!
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.admin.upsert({
    where: { email: 'admin@el-hadegel.com' },
    update: {},
    create: {
      email: 'admin@el-hadegel.com',
      password: hashedPassword,
      name: 'Admin',
    },
  });

  console.log('✅ Created default admin user (email: admin@el-hadegel.com, password: admin123)');
  console.log('⚠️  Remember to change the admin password in production!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

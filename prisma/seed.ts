import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import prisma from '../lib/prisma';

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

  // Create admin users with production credentials
  const bcrypt = require('bcryptjs');
  console.log('Creating admin users...');

  // Hash passwords
  const admin1Password = await bcrypt.hash('Tsitsi2025!!', 10);
  const admin2Password = await bcrypt.hash('Itamar2025!!', 10);

  // Delete existing admins to avoid conflicts
  await prisma.admin.deleteMany();

  // Create new admin accounts
  await prisma.admin.createMany({
    data: [
      {
        email: 'admin@elhadegel.co.il',
        password: admin1Password,
        name: 'Admin',
      },
      {
        email: 'itamar@elhadegel.co.il',
        password: admin2Password,
        name: 'Itamar',
      },
    ],
  });

  console.log('✅ Created 2 admin users');
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

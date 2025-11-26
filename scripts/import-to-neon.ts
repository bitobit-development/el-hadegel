import 'dotenv/config';
import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

interface ExportData {
  mks: any[];
  tweets: any[];
  positionHistory: any[];
  admins: any[];
  apiKeys: any[];
  exportedAt: string;
  totalRecords: number;
}

async function importData() {
  console.log('📥 Importing data to Neon PostgreSQL...\n');

  // Read exported data
  const dataPath = path.join(process.cwd(), 'data-export.json');

  if (!fs.existsSync(dataPath)) {
    throw new Error('data-export.json not found. Run export-sqlite-data.ts first.');
  }

  const exportData: ExportData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📅 Data exported at: ${exportData.exportedAt}`);
  console.log(`📊 Total records to import: ${exportData.totalRecords}\n`);

  try {
    // Clear existing data (in correct order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    await prisma.positionHistory.deleteMany();
    await prisma.tweet.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.mK.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Import MKs and create ID mapping
    console.log('📥 Importing MKs...');
    const mkIdMapping: Record<number, number> = {}; // old internal ID -> new internal ID

    for (const mk of exportData.mks) {
      const newMk = await prisma.mK.create({
        data: {
          mkId: mk.mkId,
          nameHe: mk.nameHe,
          faction: mk.faction,
          currentPosition: mk.currentPosition,
          photoUrl: mk.photoUrl,
          profileUrl: mk.profileUrl,
          phone: mk.phone,
          email: mk.email,
        },
      });
      mkIdMapping[mk.id] = newMk.id; // Map old ID to new ID
    }
    console.log(`✅ Imported ${exportData.mks.length} MKs\n`);

    // Import Admins
    console.log('📥 Importing Admins...');
    for (const admin of exportData.admins) {
      await prisma.admin.create({
        data: {
          email: admin.email,
          password: admin.password, // Already hashed
          name: admin.name,
        },
      });
    }
    console.log(`✅ Imported ${exportData.admins.length} Admins\n`);

    // Import ApiKeys
    console.log('📥 Importing API Keys...');
    for (const apiKey of exportData.apiKeys) {
      await prisma.apiKey.create({
        data: {
          name: apiKey.name,
          keyHash: apiKey.keyHash,
          isActive: apiKey.isActive === 1, // SQLite stores boolean as 0/1
          lastUsedAt: apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt) : null,
          createdBy: apiKey.createdBy,
          createdAt: new Date(apiKey.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${exportData.apiKeys.length} API Keys\n`);

    // Import Tweets
    console.log('📥 Importing Tweets...');
    for (const tweet of exportData.tweets) {
      const newMkId = mkIdMapping[tweet.mkId];
      if (!newMkId) {
        console.warn(`⚠️  Skipping tweet ${tweet.id}: MK ID ${tweet.mkId} not found`);
        continue;
      }

      await prisma.tweet.create({
        data: {
          mkId: newMkId, // Use mapped ID
          content: tweet.content,
          sourceUrl: tweet.sourceUrl,
          sourcePlatform: tweet.sourcePlatform,
          postedAt: new Date(tweet.postedAt),
          createdAt: new Date(tweet.createdAt),
        },
      });
    }
    console.log(`✅ Imported ${exportData.tweets.length} Tweets\n`);

    // Import PositionHistory
    console.log('📥 Importing Position History...');
    for (const history of exportData.positionHistory) {
      const newMkId = mkIdMapping[history.mkId];
      if (!newMkId) {
        console.warn(`⚠️  Skipping history ${history.id}: MK ID ${history.mkId} not found`);
        continue;
      }

      await prisma.positionHistory.create({
        data: {
          mkId: newMkId, // Use mapped ID
          position: history.position,
          notes: history.notes,
          changedBy: history.changedBy,
          changedAt: new Date(history.changedAt),
        },
      });
    }
    console.log(`✅ Imported ${exportData.positionHistory.length} Position History records\n`);

    // Verify counts
    console.log('🔍 Verifying import...');
    const counts = {
      mks: await prisma.mK.count(),
      tweets: await prisma.tweet.count(),
      positionHistory: await prisma.positionHistory.count(),
      admins: await prisma.admin.count(),
      apiKeys: await prisma.apiKey.count(),
    };

    console.log('✅ Final counts:');
    console.log(`   MKs: ${counts.mks} (expected: ${exportData.mks.length})`);
    console.log(`   Tweets: ${counts.tweets} (expected: ${exportData.tweets.length})`);
    console.log(`   Position History: ${counts.positionHistory} (expected: ${exportData.positionHistory.length})`);
    console.log(`   Admins: ${counts.admins} (expected: ${exportData.admins.length})`);
    console.log(`   API Keys: ${counts.apiKeys} (expected: ${exportData.apiKeys.length})`);

    // Check for discrepancies
    const discrepancies = [];
    if (counts.mks !== exportData.mks.length) discrepancies.push('MKs');
    if (counts.tweets !== exportData.tweets.length) discrepancies.push('Tweets');
    if (counts.positionHistory !== exportData.positionHistory.length) discrepancies.push('Position History');
    if (counts.admins !== exportData.admins.length) discrepancies.push('Admins');
    if (counts.apiKeys !== exportData.apiKeys.length) discrepancies.push('API Keys');

    if (discrepancies.length > 0) {
      console.warn(`\n⚠️  Discrepancies found in: ${discrepancies.join(', ')}`);
    } else {
      console.log('\n✅ All data imported successfully with correct counts!');
    }
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importData().catch(console.error);

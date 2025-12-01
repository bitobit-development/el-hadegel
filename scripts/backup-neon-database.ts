import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = './backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `neon-backup-${timestamp}`);

async function main() {
  console.log('🔄 Starting Neon database backup...\n');

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  try {
    // Backup MKs
    console.log('📦 Backing up MKs...');
    const mks = await prisma.mK.findMany();
    fs.writeFileSync(
      path.join(backupPath, 'MK.json'),
      JSON.stringify(mks, null, 2)
    );
    console.log(`   ✅ Exported ${mks.length} MKs`);

    // Backup PositionHistory
    console.log('📦 Backing up PositionHistory...');
    const positionHistory = await prisma.positionHistory.findMany();
    fs.writeFileSync(
      path.join(backupPath, 'PositionHistory.json'),
      JSON.stringify(positionHistory, null, 2)
    );
    console.log(`   ✅ Exported ${positionHistory.length} position history records`);

    // Backup Admins (without passwords for security)
    console.log('📦 Backing up Admins...');
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    fs.writeFileSync(
      path.join(backupPath, 'Admin.json'),
      JSON.stringify(admins, null, 2)
    );
    console.log(`   ✅ Exported ${admins.length} admins`);

    // Backup Tweets
    console.log('📦 Backing up Tweets...');
    const tweets = await prisma.tweet.findMany();
    fs.writeFileSync(
      path.join(backupPath, 'Tweet.json'),
      JSON.stringify(tweets, null, 2)
    );
    console.log(`   ✅ Exported ${tweets.length} tweets`);

    // Backup ApiKeys (without actual keys for security)
    console.log('📦 Backing up ApiKeys...');
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        createdBy: true,
      },
    });
    fs.writeFileSync(
      path.join(backupPath, 'ApiKey.json'),
      JSON.stringify(apiKeys, null, 2)
    );
    console.log(`   ✅ Exported ${apiKeys.length} API keys`);

    // Backup MKStatusInfo
    console.log('📦 Backing up MKStatusInfo...');
    const mkStatusInfo = await prisma.mKStatusInfo.findMany();
    fs.writeFileSync(
      path.join(backupPath, 'MKStatusInfo.json'),
      JSON.stringify(mkStatusInfo, null, 2)
    );
    console.log(`   ✅ Exported ${mkStatusInfo.length} MK status info records`);

    // Backup NewsPosts
    console.log('📦 Backing up NewsPosts...');
    const newsPosts = await prisma.newsPost.findMany();
    fs.writeFileSync(
      path.join(backupPath, 'NewsPost.json'),
      JSON.stringify(newsPosts, null, 2)
    );
    console.log(`   ✅ Exported ${newsPosts.length} news posts`);

    // Backup HistoricalComments
    console.log('📦 Backing up HistoricalComments...');
    const historicalComments = await prisma.historicalComment.findMany();
    fs.writeFileSync(
      path.join(backupPath, 'HistoricalComment.json'),
      JSON.stringify(historicalComments, null, 2)
    );
    console.log(`   ✅ Exported ${historicalComments.length} historical comments`);

    // Backup LawDocuments
    console.log('📦 Backing up LawDocuments...');
    const lawDocuments = await prisma.lawDocument.findMany({
      include: {
        paragraphs: {
          include: {
            comments: true,
          },
        },
      },
    });
    fs.writeFileSync(
      path.join(backupPath, 'LawDocument.json'),
      JSON.stringify(lawDocuments, null, 2)
    );
    console.log(`   ✅ Exported ${lawDocuments.length} law documents`);

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL',
      tables: {
        MK: mks.length,
        PositionHistory: positionHistory.length,
        Admin: admins.length,
        Tweet: tweets.length,
        ApiKey: apiKeys.length,
        MKStatusInfo: mkStatusInfo.length,
        NewsPost: newsPosts.length,
        HistoricalComment: historicalComments.length,
        LawDocument: lawDocuments.length,
      },
    };
    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`\n📊 Summary:`);
    console.log(JSON.stringify(metadata.tables, null, 2));
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

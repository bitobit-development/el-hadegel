import Database from 'better-sqlite3';
import * as path from 'path';
import 'dotenv/config';
import prisma from '../lib/prisma';

// This script migrates data from local SQLite to Neon PostgreSQL

async function main() {
  console.log('🚀 Starting migration from SQLite to Neon...\n');

  // Use the existing Prisma client (connected to Neon)
  const neonPrisma = prisma;

  // Connect to SQLite directly
  const sqlitePath = path.join(__dirname, '../prisma/dev.db');
  const sqlite = new Database(sqlitePath);

  try {
    // 1. Export MKs from SQLite
    console.log('📊 Exporting MKs from SQLite...');
    const mks = sqlite.prepare('SELECT * FROM MK ORDER BY mkId').all();
    console.log(`   Found ${mks.length} MKs in SQLite\n`);

    // 2. Export Admins from SQLite
    console.log('👤 Exporting Admins from SQLite...');
    const admins = sqlite.prepare('SELECT * FROM Admin').all();
    console.log(`   Found ${admins.length} admins in SQLite\n`);

    // 3. Export Position History from SQLite
    console.log('📜 Exporting Position History from SQLite...');
    const history = sqlite.prepare('SELECT * FROM PositionHistory ORDER BY changedAt').all();
    console.log(`   Found ${history.length} history entries in SQLite\n`);

    // 4. Export Tweets from SQLite
    console.log('🐦 Exporting Tweets from SQLite...');
    const tweets = sqlite.prepare('SELECT * FROM Tweet ORDER BY postedAt').all();
    console.log(`   Found ${tweets.length} tweets in SQLite\n`);

    // 5. Export API Keys from SQLite
    console.log('🔑 Exporting API Keys from SQLite...');
    const apiKeys = sqlite.prepare('SELECT * FROM ApiKey').all();
    console.log(`   Found ${apiKeys.length} API keys in SQLite\n`);

    // Close SQLite connection
    sqlite.close();

    // 6. Clear Neon database (in correct order to avoid FK constraints)
    console.log('🧹 Clearing Neon database...');
    await neonPrisma.tweet.deleteMany();
    await neonPrisma.positionHistory.deleteMany();
    await neonPrisma.apiKey.deleteMany();
    await neonPrisma.admin.deleteMany();
    await neonPrisma.mK.deleteMany();
    console.log('   ✅ Cleared\n');

    // 7. Import MKs to Neon
    console.log('📥 Importing MKs to Neon...');
    for (const mk of mks as any[]) {
      await neonPrisma.mK.create({
        data: {
          id: mk.id,
          mkId: mk.mkId,
          nameHe: mk.nameHe,
          faction: mk.faction,
          photoUrl: mk.photoUrl,
          profileUrl: mk.profileUrl,
          phone: mk.phone,
          email: mk.email,
          currentPosition: mk.currentPosition,
          createdAt: new Date(mk.createdAt),
          updatedAt: new Date(mk.updatedAt),
        },
      });
    }
    console.log(`   ✅ Imported ${mks.length} MKs\n`);

    // 8. Import Admins to Neon
    console.log('📥 Importing Admins to Neon...');
    for (const admin of admins as any[]) {
      await neonPrisma.admin.create({
        data: {
          id: admin.id,
          email: admin.email,
          password: admin.password,
          name: admin.name,
          createdAt: new Date(admin.createdAt),
        },
      });
    }
    console.log(`   ✅ Imported ${admins.length} admins\n`);

    // 9. Import Position History to Neon
    console.log('📥 Importing Position History to Neon...');
    for (const entry of history as any[]) {
      await neonPrisma.positionHistory.create({
        data: {
          id: entry.id,
          mkId: entry.mkId,
          position: entry.position,
          notes: entry.notes,
          changedBy: entry.changedBy,
          changedAt: new Date(entry.changedAt),
        },
      });
    }
    console.log(`   ✅ Imported ${history.length} history entries\n`);

    // 10. Import Tweets to Neon
    console.log('📥 Importing Tweets to Neon...');
    for (const tweet of tweets as any[]) {
      await neonPrisma.tweet.create({
        data: {
          id: tweet.id,
          mkId: tweet.mkId,
          content: tweet.content,
          sourceUrl: tweet.sourceUrl,
          sourcePlatform: tweet.sourcePlatform,
          postedAt: new Date(tweet.postedAt),
          createdAt: new Date(tweet.createdAt),
        },
      });
    }
    console.log(`   ✅ Imported ${tweets.length} tweets\n`);

    // 11. Import API Keys to Neon
    console.log('📥 Importing API Keys to Neon...');
    for (const key of apiKeys as any[]) {
      await neonPrisma.apiKey.create({
        data: {
          id: key.id,
          name: key.name,
          keyHash: key.keyHash,
          isActive: key.isActive === 1,
          lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
          createdAt: new Date(key.createdAt),
          createdBy: key.createdBy,
        },
      });
    }
    console.log(`   ✅ Imported ${apiKeys.length} API keys\n`);

    // 12. Verify migration
    console.log('🔍 Verifying migration...');
    const neonMKCount = await neonPrisma.mK.count();
    const neonAdminCount = await neonPrisma.admin.count();
    const neonHistoryCount = await neonPrisma.positionHistory.count();
    const neonTweetCount = await neonPrisma.tweet.count();
    const neonApiKeyCount = await neonPrisma.apiKey.count();

    console.log(`   MKs: ${neonMKCount}/${mks.length}`);
    console.log(`   Admins: ${neonAdminCount}/${admins.length}`);
    console.log(`   History: ${neonHistoryCount}/${history.length}`);
    console.log(`   Tweets: ${neonTweetCount}/${tweets.length}`);
    console.log(`   API Keys: ${neonApiKeyCount}/${apiKeys.length}\n`);

    if (
      neonMKCount === mks.length &&
      neonAdminCount === admins.length &&
      neonHistoryCount === history.length &&
      neonTweetCount === tweets.length &&
      neonApiKeyCount === apiKeys.length
    ) {
      console.log('✅ Migration completed successfully!\n');
    } else {
      console.error('❌ Migration verification failed. Counts do not match.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await neonPrisma.$disconnect();
  }
}

main();

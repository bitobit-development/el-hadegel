import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Connect to SQLite database
const db = new Database(path.join(process.cwd(), 'prisma/dev.db'));

// Export function
async function exportData() {
  console.log('📦 Exporting data from SQLite...\n');

  try {
    // Export MKs
    const mks = db.prepare('SELECT * FROM MK ORDER BY mkId').all();
    console.log(`✅ MKs: ${mks.length} records`);

    // Export Tweets
    const tweets = db.prepare('SELECT * FROM Tweet ORDER BY id').all();
    console.log(`✅ Tweets: ${tweets.length} records`);

    // Export PositionHistory
    const positionHistory = db.prepare('SELECT * FROM PositionHistory ORDER BY id').all();
    console.log(`✅ Position History: ${positionHistory.length} records`);

    // Export Admins (with password hashes)
    const admins = db.prepare('SELECT * FROM Admin ORDER BY id').all();
    console.log(`✅ Admins: ${admins.length} records`);

    // Export ApiKeys
    const apiKeys = db.prepare('SELECT * FROM ApiKey ORDER BY id').all();
    console.log(`✅ API Keys: ${apiKeys.length} records`);

    // Create export object
    const exportData = {
      mks,
      tweets,
      positionHistory,
      admins,
      apiKeys,
      exportedAt: new Date().toISOString(),
      totalRecords: mks.length + tweets.length + positionHistory.length + admins.length + apiKeys.length,
    };

    // Write to JSON file
    const outputPath = path.join(process.cwd(), 'data-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log(`\n✅ Data exported to: ${outputPath}`);
    console.log(`📊 Total records: ${exportData.totalRecords}`);

    db.close();
  } catch (error) {
    console.error('❌ Export failed:', error);
    db.close();
    throw error;
  }
}

// Run export
exportData().catch(console.error);

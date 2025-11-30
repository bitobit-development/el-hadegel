import { config } from 'dotenv';
import path from 'path';

// IMPORTANT: Load environment variables BEFORE any other imports
config({ path: path.join(process.cwd(), '.env') });

import { syncAllNewsPosts } from '@/lib/news-tweet-sync';

/**
 * Sync All NewsPosts to Tweets
 *
 * This script syncs all linked NewsPosts to the Tweet table.
 * This allows news posts to appear on MK cards.
 *
 * Usage: npx tsx scripts/sync-news-to-tweets.ts
 */

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   NewsPost → Tweet Sync Script                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Finding unsynced NewsPosts with MK links...\n');

  try {
    const syncedCount = await syncAllNewsPosts();

    console.log('─'.repeat(68));
    console.log('\n📊 SYNC SUMMARY\n');
    console.log('═'.repeat(68));
    console.log(`✅ Synced to Tweet table:  ${syncedCount} news posts`);
    console.log('═'.repeat(68));

    if (syncedCount > 0) {
      console.log('\n✨ Success! News posts now appear on MK cards.\n');
      console.log('Next Steps:');
      console.log('1. 🌐 Visit the homepage and find the MK cards');
      console.log('2. 👁️  The post count button should now show the news posts');
      console.log('3. 📖 Click the button to view tweets and news posts together\n');
    } else {
      console.log('\n💡 No unsynced posts found. All news posts are already synced.\n');
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

import { config } from 'dotenv';
import path from 'path';

// IMPORTANT: Load environment variables BEFORE any other imports
config({ path: path.join(process.cwd(), '.env') });

import prisma from '@/lib/prisma';
import { identifyMK } from '@/lib/mk-identifier';

/**
 * Migrate Existing News Posts to MK Linking
 *
 * This script processes all existing news posts and attempts to
 * automatically link them to MK members based on URL and content analysis.
 *
 * Usage: npx tsx scripts/migrate-news-posts-to-mk.ts
 */

interface MigrationStats {
  total: number;
  alreadyLinked: number;
  newlyLinked: number;
  urlMatches: number;
  nameMatches: number;
  noMatch: number;
  errors: number;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   News Posts → MK Migration Script                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const stats: MigrationStats = {
    total: 0,
    alreadyLinked: 0,
    newlyLinked: 0,
    urlMatches: 0,
    nameMatches: 0,
    noMatch: 0,
    errors: 0,
  };

  try {
    // 1. Get all news posts
    console.log('📊 Fetching all news posts from database...\n');
    const allPosts = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    stats.total = allPosts.length;
    console.log(`✅ Found ${stats.total} news posts to process\n`);

    if (stats.total === 0) {
      console.log('No posts to migrate. Exiting.\n');
      return;
    }

    console.log('─'.repeat(68));
    console.log('Processing posts...\n');

    // 2. Process each post
    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];

      console.log(`[${i + 1}/${stats.total}] Post #${post.id}`);
      console.log(`   URL: ${post.sourceUrl.substring(0, 60)}...`);

      try {
        // Skip if already linked
        if (post.mkId !== null) {
          console.log(`   ⏭️  Already linked to MK #${post.mkId}`);
          stats.alreadyLinked++;
          continue;
        }

        // Identify MK
        const identification = await identifyMK(post.sourceUrl, post.content);

        if (identification.mkId !== null) {
          // Update post with MK link
          await prisma.newsPost.update({
            where: { id: post.id },
            data: { mkId: identification.mkId },
          });

          console.log(`   ✅ Linked to MK #${identification.mkId} (${identification.method}, ${identification.confidence} confidence)`);
          stats.newlyLinked++;

          if (identification.method === 'url_match') {
            stats.urlMatches++;
          } else if (identification.method === 'name_match') {
            stats.nameMatches++;
          }
        } else {
          console.log(`   ⚠️  No MK match found`);
          stats.noMatch++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        stats.errors++;
      }

      // Add spacing between posts (except for last one)
      if (i < allPosts.length - 1) {
        console.log('');
      }
    }

    console.log('\n' + '═'.repeat(68));
    console.log('\n📊 MIGRATION SUMMARY\n');
    console.log('═'.repeat(68));
    console.log(`📝 Total posts processed:    ${stats.total}`);
    console.log(`🔗 Already linked:            ${stats.alreadyLinked}`);
    console.log(`✅ Newly linked:              ${stats.newlyLinked}`);
    console.log(`   - Via URL matching:        ${stats.urlMatches}`);
    console.log(`   - Via name matching:       ${stats.nameMatches}`);
    console.log(`⚠️  No match found:           ${stats.noMatch}`);
    console.log(`❌ Errors:                    ${stats.errors}`);
    console.log('═'.repeat(68));

    if (stats.newlyLinked > 0) {
      console.log('\n✨ Success! Linked posts will now appear on MK cards.\n');
      console.log('Next Steps:');
      console.log('1. 🌐 Visit the homepage to see MK cards');
      console.log('2. 👁️  Check that news posts appear on the correct MK cards');
      console.log('3. 🔄 You can re-run this script safely - already linked posts will be skipped\n');
    }

    if (stats.noMatch > 0) {
      console.log(`\n💡 ${stats.noMatch} posts could not be auto-linked.`);
      console.log('   These may be general news posts not specific to any MK.\n');
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

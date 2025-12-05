import 'dotenv/config';
import { readFileSync } from 'fs';

async function restoreXPosts() {
  console.log('🔄 Restoring X/Twitter posts to news feed...\n');

  // Read the file with X post URLs
  const fileContent = readFileSync('./docs/posts/x-posts.txt', 'utf-8');
  const urls = fileContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.startsWith('https://'));

  console.log(`📊 Found ${urls.length} X post URLs\n`);

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('NEWS_API_KEY not found in environment variables');
  }

  // Use localhost if dev server is running, otherwise use production URL
  const baseUrl = 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/news-posts`;

  let created = 0;
  let duplicates = 0;
  let failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] Processing: ${url.substring(0, 60)}...`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: url,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`  ✅ Created`);
        created++;
      } else if (response.status === 409) {
        console.log(`  ℹ️  Duplicate (already exists)`);
        duplicates++;
      } else {
        console.log(`  ❌ Failed: ${data.error || response.statusText}`);
        failed++;
      }

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ℹ️  Duplicates: ${duplicates}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total: ${urls.length}`);
}

restoreXPosts().catch(console.error);

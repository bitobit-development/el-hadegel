/**
 * Migrate Videos from File System to Cloudflare R2
 *
 * This script uploads all existing videos from the local /videos directory
 * to Cloudflare R2 storage. Use this during migration from file-based to
 * cloud-based video storage.
 *
 * Prerequisites:
 * - R2 environment variables configured in .env
 * - Videos exist in /videos directory
 * - R2 bucket created and accessible
 *
 * Usage:
 *   npx tsx scripts/migrate-videos-to-r2.ts
 */

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2-client';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Video file extensions to migrate
 */
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

/**
 * MIME type mapping for video extensions
 */
const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

/**
 * Main migration function
 */
async function migrateVideos() {
  console.log('🚀 Starting video migration to Cloudflare R2...\n');

  // 1. Check videos directory exists
  const videosDir = join(process.cwd(), 'videos');
  if (!existsSync(videosDir)) {
    console.log('⚠️  No /videos directory found. Nothing to migrate.');
    return;
  }

  // 2. Read all files from videos directory
  console.log('📂 Reading videos directory...');
  const files = await readdir(videosDir);
  const videoFiles = files.filter(file =>
    VIDEO_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext))
  );

  if (videoFiles.length === 0) {
    console.log('⚠️  No video files found in /videos directory.');
    return;
  }

  console.log(`✅ Found ${videoFiles.length} video file(s) to migrate\n`);

  // 3. Upload each video to R2
  let successCount = 0;
  let errorCount = 0;

  for (const file of videoFiles) {
    try {
      console.log(`📤 Uploading: ${file}...`);

      // Read file
      const filePath = join(videosDir, file);
      const buffer = await readFile(filePath);

      // Determine MIME type
      const extension = VIDEO_EXTENSIONS.find(ext => file.toLowerCase().endsWith(ext)) || '.mp4';
      const contentType = MIME_TYPES[extension];

      // Upload to R2
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: `videos/${file}`,
          Body: buffer,
          ContentType: contentType,
          ContentLength: buffer.length,
        })
      );

      console.log(`   ✅ Uploaded successfully (${(buffer.length / 1024 / 1024).toFixed(2)} MB)\n`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to upload ${file}:`, error);
      errorCount++;
    }
  }

  // 4. Summary
  console.log('\n' + '='.repeat(50));
  console.log('Migration Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successfully uploaded: ${successCount} file(s)`);
  if (errorCount > 0) {
    console.log(`❌ Failed uploads: ${errorCount} file(s)`);
  }
  console.log('='.repeat(50));

  // 5. Next steps reminder
  if (successCount > 0) {
    console.log('\n📝 Next steps:');
    console.log('   1. Verify files in R2 bucket via Cloudflare Dashboard');
    console.log('   2. Test video playback on your site');
    console.log('   3. Once confirmed working, you can delete local /videos directory');
    console.log('   4. Update Vercel environment variables with R2 credentials');
  }
}

// Run migration
migrateVideos()
  .then(() => {
    console.log('\n✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });

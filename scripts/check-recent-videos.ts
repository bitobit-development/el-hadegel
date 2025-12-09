import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('🎥 Checking Last 2 Uploaded Videos\n');

  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: {
      id: true,
      title: true,
      fileName: true,
      thumbnailUrl: true,
      isPublished: true,
      createdAt: true,
    }
  });

  if (videos.length === 0) {
    console.log('❌ No videos found in database');
  } else {
    console.log(`Found ${videos.length} video(s):\n`);

    videos.forEach((video, index) => {
      console.log(`Video #${index + 1}:`);
      console.log(`  ID: ${video.id}`);
      console.log(`  Title: ${video.title}`);
      console.log(`  File Name: ${video.fileName}`);
      console.log(`  Thumbnail URL: ${video.thumbnailUrl || 'None'}`);
      console.log(`  Is Published: ${video.isPublished}`);
      console.log(`  Created At: ${video.createdAt}`);
      console.log(`  Streaming URL: /api/videos/${video.fileName}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

import prisma from '../lib/prisma';

async function verify() {
  console.log('🔍 Verifying database data...\n');

  try {
    // Count records
    const mkCount = await prisma.mK.count();
    const tweetCount = await prisma.tweet.count();
    const positionHistoryCount = await prisma.positionHistory.count();
    const adminCount = await prisma.admin.count();
    const apiKeyCount = await prisma.apiKey.count();

    console.log('📊 Record Counts:');
    console.log(`   MKs: ${mkCount}`);
    console.log(`   Tweets: ${tweetCount}`);
    console.log(`   Position History: ${positionHistoryCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   API Keys: ${apiKeyCount}\n`);

    // Sample MK data
    const sampleMK = await prisma.mK.findFirst({
      where: { mkId: 771 }, // Avi Dichter
    });

    if (sampleMK) {
      console.log('📋 Sample MK (Avi Dichter):');
      console.log(`   Name: ${sampleMK.nameHe}`);
      console.log(`   Faction: ${sampleMK.faction}`);
      console.log(`   Position: ${sampleMK.currentPosition}`);
      console.log(`   Phone: ${sampleMK.phone || 'N/A'}`);
      console.log(`   Email: ${sampleMK.email || 'N/A'}\n`);

      // Check Hebrew encoding
      const isHebrew = /[\u0590-\u05FF]/.test(sampleMK.nameHe);
      console.log(`✅ Hebrew encoding: ${isHebrew ? 'Working ✓' : 'Failed ✗'}\n`);
    }

    // Test position stats
    const stats = await prisma.mK.groupBy({
      by: ['currentPosition'],
      _count: true,
    });

    console.log('📊 Position Distribution:');
    stats.forEach((stat) => {
      console.log(`   ${stat.currentPosition}: ${stat._count}`);
    });
    console.log();

    // Check admin
    const admin = await prisma.admin.findFirst();
    if (admin) {
      console.log('👤 Admin Account:');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}\n`);
    }

    // Check API key
    const apiKey = await prisma.apiKey.findFirst();
    if (apiKey) {
      console.log('🔑 API Key:');
      console.log(`   Name: ${apiKey.name}`);
      console.log(`   Active: ${apiKey.isActive ? 'Yes' : 'No'}\n`);
    }

    console.log('✅ Verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify().catch(console.error);

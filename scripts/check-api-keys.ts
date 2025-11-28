import { config } from 'dotenv';
config();

import prisma from '@/lib/prisma';

async function checkApiKeys() {
  console.log('🔑 Checking API Keys in database...\n');

  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📊 Total API Keys: ${apiKeys.length}\n`);

    if (apiKeys.length === 0) {
      console.log('⚠️  No API keys found in database');
      console.log('\nTo create the test API key, you need to run a seed script or create it manually.');
    } else {
      apiKeys.forEach((key, index) => {
        console.log(`API Key #${index + 1}:`);
        console.log('━'.repeat(60));
        console.log(`ID: ${key.id}`);
        console.log(`Name: ${key.name}`);
        console.log(`Hash: ${key.keyHash.substring(0, 30)}...`);
        console.log(`Active: ${key.isActive ? '✅' : '❌'}`);
        console.log(`Created By: ${key.createdBy}`);
        console.log(`Created At: ${key.createdAt.toISOString()}`);
        console.log(`Last Used: ${key.lastUsedAt?.toISOString() || 'Never'}`);
        console.log('━'.repeat(60));
        console.log('');
      });
    }

    console.log('\n💡 Note: The plain API key (e.g., "test-api-key-dev-2024") is never stored.');
    console.log('   Only the bcrypt hash is stored in the database for security.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function seedApiKeys() {
  console.log('🔑 Seeding API keys...');

  // Test API key for development: "test-api-key-dev-2024"
  const testKeyHash = await bcrypt.hash('test-api-key-dev-2024', 10);

  await prisma.apiKey.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Development Test Key',
      keyHash: testKeyHash,
      isActive: true,
      createdBy: 'admin@el-hadegel.com',
    },
  });

  console.log('✅ API Keys seeded successfully');
  console.log('   - Test Key: "test-api-key-dev-2024"');
}

seedApiKeys()
  .catch((e) => {
    console.error('❌ Error seeding API keys:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

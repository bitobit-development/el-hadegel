import 'dotenv/config';
import prisma from '../lib/prisma';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('🔐 Seeding admin users only...\n');

  // Hash passwords
  const admin1Password = await bcrypt.hash('Tsitsi2025!!', 10);
  const admin2Password = await bcrypt.hash('Itamar2025!!', 10);

  // Delete existing admins to avoid conflicts
  await prisma.admin.deleteMany();
  console.log('   Cleared existing admins\n');

  // Create new admin accounts
  await prisma.admin.createMany({
    data: [
      {
        email: 'admin@elhadegel.co.il',
        password: admin1Password,
        name: 'Admin',
      },
      {
        email: 'itamar@elhadegel.co.il',
        password: admin2Password,
        name: 'Itamar',
      },
    ],
  });

  console.log('✅ Created 2 admin users:');
  console.log('   - admin@elhadegel.co.il');
  console.log('   - itamar@elhadegel.co.il\n');

  await prisma.$disconnect();
}

main();

import 'dotenv/config';
import prisma from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('🔐 Create New Admin User\n');

  const name = await question('Enter admin name: ');
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password: ');

  if (!name || !email || !password) {
    console.error('❌ All fields are required');
    rl.close();
    process.exit(1);
  }

  // Check if email already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.error(`❌ Admin with email ${email} already exists`);
    rl.close();
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin
  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  console.log('\n✅ Admin user created successfully!');
  console.log(`   Name: ${admin.name}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   ID: ${admin.id}\n`);

  rl.close();
  await prisma.$disconnect();
}

main();

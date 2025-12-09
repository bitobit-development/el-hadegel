import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

async function createGaryAdmin() {
  console.log('🔐 Creating Admin User: Gary\n');

  const name = 'Gary';
  const email = 'gary@elhadegel.co.il';
  const password = 'elhadegel2025!!';

  try {
    // Check if email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log('\n💡 Use a different email or delete the existing admin first.');
      await prisma.$disconnect();
      return;
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

    console.log('✅ Admin user created successfully!\n');
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   ID:', admin.id);
    console.log('\n🔑 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createGaryAdmin();

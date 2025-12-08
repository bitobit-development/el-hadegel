import prisma from '../lib/prisma';

async function verifyUpdates() {
  console.log('🔍 Verifying Mobile Number Updates\n');
  console.log('====================================\n');

  // Sample MKs to check
  const samplesToCheck = [
    { name: 'בנימין נתניהו', expected: '0548776658' },
    { name: 'יאיר לפיד', expected: '0549909901' },
    { name: 'איתמר בן גביר', expected: '0528693867' },
    { name: 'בני גנץ', expected: '0525650000' },
    { name: 'אביגדור ליברמן', expected: '0508800800' },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const sample of samplesToCheck) {
    const mk = await prisma.mK.findFirst({
      where: { nameHe: sample.name },
      select: { nameHe: true, mobileNumber: true },
    });

    if (!mk) {
      console.log(`❌ ${sample.name} - NOT FOUND IN DATABASE`);
      failCount++;
      continue;
    }

    if (mk.mobileNumber === sample.expected) {
      console.log(`✅ ${mk.nameHe} - ${mk.mobileNumber} ✓`);
      successCount++;
    } else {
      console.log(
        `⚠️ ${mk.nameHe} - Expected: ${sample.expected}, Got: ${mk.mobileNumber || 'NULL'}`
      );
      failCount++;
    }
  }

  console.log('\n====================================');
  console.log(`✅ Verified: ${successCount}/${samplesToCheck.length}`);
  console.log(`❌ Failed: ${failCount}/${samplesToCheck.length}`);

  // Count total MKs with mobile numbers
  const totalWithMobile = await prisma.mK.count({
    where: { mobileNumber: { not: null } },
  });

  const totalMKs = await prisma.mK.count();

  console.log(`\n📊 Total MKs with mobile numbers: ${totalWithMobile}/${totalMKs}`);

  await prisma.$disconnect();
}

verifyUpdates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

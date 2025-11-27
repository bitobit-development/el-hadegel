import 'dotenv/config'
import prisma from '../lib/prisma'

async function main() {
  console.log('Creating test status info entry...')

  // Get the first MK
  const mk = await prisma.mK.findFirst()

  if (!mk) {
    console.error('No MKs found in database')
    process.exit(1)
  }

  console.log(`Found MK: ${mk.nameHe} (ID: ${mk.id})`)

  // Create a test status info entry
  const statusInfo = await prisma.mKStatusInfo.create({
    data: {
      mkId: mk.id,
      content: 'זהו מידע ניסיון על עמדת חבר הכנסת בנושא חוק הגיוס. מידע זה נוצר למטרות בדיקה בלבד.',
      createdBy: 'test@example.com',
    },
  })

  console.log('✅ Created status info entry:', {
    id: statusInfo.id,
    mkId: statusInfo.mkId,
    content: statusInfo.content.substring(0, 50) + '...',
    createdBy: statusInfo.createdBy,
    createdAt: statusInfo.createdAt,
  })

  console.log('\n🎉 Test data created successfully!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

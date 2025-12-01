import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function main() {
  const comments = [
    {
      paragraphId: 3,
      firstName: 'דוד',
      lastName: 'כהן',
      email: 'david@example.com',
      phoneNumber: '0521111111',
      commentContent: 'דחיית השירות עד גיל 26 היא תקופה ארוכה מדי. יש להפחית ל-23 לכל היותר.',
      status: 'PENDING' as const,
    },
    {
      paragraphId: 4,
      firstName: 'רחל',
      lastName: 'לוי',
      email: 'rachel@example.com',
      phoneNumber: '0522222222',
      commentContent: 'מכסות הגיוס של 4,800-5,000 בשנה אינן מספיקות. יש להעלות למינימום של 10,000 בשנה.',
      status: 'PENDING' as const,
    },
  ];

  for (const data of comments) {
    await prisma.lawComment.create({ data });
  }

  console.log('✅ Created 2 pending comments for bulk testing');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

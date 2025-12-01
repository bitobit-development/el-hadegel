import * as dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function main() {
  console.log('🔄 Creating test law document...\n');

  // Delete existing test law documents
  const existingDocs = await prisma.lawDocument.findMany({
    where: { title: { contains: 'חוק גיוס' } },
  });

  if (existingDocs.length > 0) {
    console.log(`🗑️  Deleting ${existingDocs.length} existing test documents...\n`);
    await prisma.lawDocument.deleteMany({
      where: { title: { contains: 'חוק גיוס' } },
    });
  }

  // Create law document with IDF recruitment law content
  const lawDocument = await prisma.lawDocument.create({
    data: {
      title: 'חוק גיוס לצה"ל (תיקון מס\' 12), התשפ"ד-2024',
      description: 'הצעת חוק לתיקון חוק שירות ביטחון (גיוס חרדים)',
      version: '1.0',
      isActive: true,
      publishedAt: new Date('2024-11-15'),
      paragraphs: {
        create: [
          {
            orderIndex: 1,
            sectionTitle: 'הגדרות',
            content: 'בחוק זה, "תלמיד ישיבה" - מי שעיקר עיסוקו בתורה ושגילו 18 ומעלה, ואינו עובד למעט הוראה בישיבה או בכולל.',
          },
          {
            orderIndex: 2,
            sectionTitle: 'גיל גיוס',
            content: 'גיל הגיוס לשירות סדיר בצה"ל יהיה 18 שנים, ולתלמידי ישיבות שגילם עולה על 21 שנים - דחיית שירות עד גיל 26.',
          },
          {
            orderIndex: 3,
            sectionTitle: 'דחיית שירות',
            content: 'שר הביטחון רשאי לדחות מועד גיוסו של תלמיד ישיבה שעיקר עיסוקו תורה, מדי שנה בשנה, עד הגיעו לגיל 26 שנים.',
          },
          {
            orderIndex: 4,
            sectionTitle: 'מכסות גיוס',
            content: 'מספר תלמידי הישיבות שיתגייסו מדי שנה יעמוד על לפחות 4,800 בשנת 2025, ו-5,000 בשנת 2026 ואילך.',
          },
          {
            orderIndex: 5,
            sectionTitle: 'שירות אזרחי-לאומי',
            content: 'תלמיד ישיבה שבחר שלא להתגייס לצה"ל, יוכל לבצע שירות אזרחי-לאומי במשך 24 חודשים במוסדות ציבור.',
          },
          {
            orderIndex: 6,
            sectionTitle: 'סנקציות',
            content: 'תלמיד ישיבה שלא התייצב לגיוס ולא ביצע שירות אזרחי-לאומי, לא יהיה זכאי למענקים ולהטבות מטעם המדינה.',
          },
          {
            orderIndex: 7,
            sectionTitle: 'תחילה',
            content: 'תחילתו של חוק זה ביום כ"ה בכסלו התשפ"ה (27 בדצמבר 2024).',
          },
        ],
      },
    },
  });

  console.log(`✅ Created law document: "${lawDocument.title}"`);
  console.log(`   ID: ${lawDocument.id}`);
  console.log(`   Paragraphs: 7\n`);

  console.log('📋 Paragraph titles:');
  console.log('   1. הגדרות');
  console.log('   2. גיל גיוס');
  console.log('   3. דחיית שירות');
  console.log('   4. מכסות גיוס');
  console.log('   5. שירות אזרחי-לאומי');
  console.log('   6. סנקציות');
  console.log('   7. תחילה\n');

  console.log(`✅ Test law document created successfully!`);
  console.log(`\n🔗 View at: http://localhost:3000/law-document/${lawDocument.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating test law document:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

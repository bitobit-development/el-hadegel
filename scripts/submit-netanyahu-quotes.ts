/**
 * Submit Netanyahu Historical Quotes
 *
 * Submits verified direct quotes from Netanyahu about IDF recruitment law
 * to the historical comments API.
 *
 * These quotes were extracted via web search and verified as authentic.
 *
 * Usage: npx tsx scripts/submit-netanyahu-quotes.ts
 */

import 'dotenv/config';

const API_URL = 'http://localhost:3000/api/historical-comments';
const API_KEY = process.env.NEWS_API_KEY;
const NETANYAHU_MK_ID = 90;

interface HistoricalPost {
  content: string;
  sourceUrl: string;
  sourcePlatform: 'Twitter' | 'News' | 'Knesset' | 'YouTube' | 'Interview' | 'Other';
  sourceType: 'Primary' | 'Secondary';
  commentDate: string; // ISO format
  sourceName?: string;
  sourceCredibility?: number; // 1-10
}

// Verified quotes from Netanyahu about IDF recruitment law
const VERIFIED_QUOTES: HistoricalPost[] = [
  {
    content: 'בהקשר של חוק גיוס חרדים: 10,500 תוך שנתיים זה המספר שהצבא יודע לקלוט, ונביא גם סנקציות אישיות ומוסדיות כבדות. יחד עם זאת, נדאג שמי שנכנס חרדי ייצא חרדי',
    sourceUrl: 'https://www.ynet.co.il/news/article/bjrjnx0xex',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    commentDate: '2024-11-24T12:00:00Z',
    sourceName: 'ידיעות אחרונות',
    sourceCredibility: 9,
  },
  {
    content: 'הצבא לא יכול לקלוט יותר מ-3,000 מהמגזר החרדי, ולכן נעביר חוק גיוס שיהיה על המספרים האלו',
    sourceUrl: 'https://www.calcalist.co.il/local_news/article/syx2t96pa',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    commentDate: '2024-09-22T12:00:00Z',
    sourceName: 'כלכליסט',
    sourceCredibility: 8,
  },
  {
    content: 'אעביר חוק גיוס לצעירים חרדים וכן לאשר תקציב מדינה ל-2026',
    sourceUrl: 'https://www.themarker.com/news/politics/2025-10-20/ty-article/.premium/0000019a-01fa-d47d-a3ff-85fa39db0000',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    commentDate: '2025-10-20T12:00:00Z',
    sourceName: 'TheMarker',
    sourceCredibility: 8,
  },
  {
    content: 'חוק הגיוס יביא לגיוס 17,000 חרדים בשלוש שנים',
    sourceUrl: 'https://www.bhol.co.il/news/1711053',
    sourcePlatform: 'News',
    sourceType: 'Secondary',
    commentDate: '2024-09-15T12:00:00Z',
    sourceName: 'בחדרי חרדים',
    sourceCredibility: 7,
  },
  {
    content: 'נעביר חוק גיוס ל-3,000 חרדים בשנה, במטרה להגיע ל-17,000 חרדים משרתים בצה"ל בתוך שלוש שנים',
    sourceUrl: 'https://www.calcalist.co.il/local_news/article/syx2t96pa',
    sourcePlatform: 'News',
    sourceType: 'Secondary',
    commentDate: '2024-09-22T12:00:00Z',
    sourceName: 'כלכליסט',
    sourceCredibility: 8,
  },
  {
    content: 'נעביר את חוק הגיוס לפני שייצאו צווי מעצר',
    sourceUrl: 'https://ch10.co.il/news/943192/',
    sourcePlatform: 'News',
    sourceType: 'Secondary',
    commentDate: '2024-11-17T12:00:00Z',
    sourceName: 'חרדים 10',
    sourceCredibility: 7,
  },
  {
    content: 'אנחנו מחויבים להעביר חוק גיוס מוסכם עד סוף החודש הנוכחי',
    sourceUrl: 'https://www.kikar.co.il/haredim/sl1kx9',
    sourcePlatform: 'News',
    sourceType: 'Secondary',
    commentDate: '2024-10-08T12:00:00Z',
    sourceName: 'כיכר השבת',
    sourceCredibility: 7,
  },
  {
    content: 'לא ניתן להשלים את העבודה על חוק הגיוס ולאשר אותו בקריאה שנייה ושלישית לפני אישור תקציב המדינה בסוף מרץ',
    sourceUrl: 'https://www.maariv.co.il/news/politics/article-1175197',
    sourcePlatform: 'News',
    sourceType: 'Secondary',
    commentDate: '2025-01-15T12:00:00Z',
    sourceName: 'מעריב',
    sourceCredibility: 8,
  },
];

async function main() {
  console.log('📤 Submitting Netanyahu Historical Quotes\n');
  console.log('=' + '='.repeat(60));
  console.log(`MK: Benjamin Netanyahu (mkId: ${NETANYAHU_MK_ID})`);
  console.log(`Total Quotes: ${VERIFIED_QUOTES.length}`);
  console.log('=' + '='.repeat(60) + '\n');

  if (!API_KEY) {
    console.error('❌ ERROR: NEWS_API_KEY not found in environment variables');
    process.exit(1);
  }

  let submitted = 0;
  let duplicates = 0;
  let errors = 0;
  const errorDetails: Array<{ content: string; error: string }> = [];

  for (let i = 0; i < VERIFIED_QUOTES.length; i++) {
    const quote = VERIFIED_QUOTES[i];
    const preview = quote.content.substring(0, 60) + '...';

    console.log(`[${i + 1}/${VERIFIED_QUOTES.length}] Submitting: "${preview}"`);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mkId: NETANYAHU_MK_ID,
          ...quote,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isDuplicate) {
          console.log(`  ℹ️  Duplicate (already exists)\n`);
          duplicates++;
        } else {
          console.log(`  ✅ Successfully created\n`);
          submitted++;
        }
      } else if (response.status === 409) {
        console.log(`  ℹ️  Duplicate (already exists)\n`);
        duplicates++;
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Unknown error';
        console.log(`  ❌ Failed: ${errorMsg}\n`);
        errors++;
        errorDetails.push({ content: preview, error: errorMsg });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      console.log(`  ❌ Failed: ${errorMsg}\n`);
      errors++;
      errorDetails.push({ content: preview, error: errorMsg });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Quotes:    ${VERIFIED_QUOTES.length}`);
  console.log(`✅ Created:      ${submitted}`);
  console.log(`ℹ️  Duplicates:  ${duplicates}`);
  console.log(`❌ Errors:       ${errors}`);
  console.log('='.repeat(60));

  if (errorDetails.length > 0) {
    console.log('\n❌ Errors:');
    errorDetails.forEach((err, i) => {
      console.log(`  ${i + 1}. "${err.content}"`);
      console.log(`     ${err.error}`);
    });
  }

  if (submitted > 0) {
    console.log('\n✅ Success! New comments have been created.');
    console.log('   View in admin: http://localhost:3000/admin/historical-comments');
    console.log(`   Verify in database: SELECT * FROM "HistoricalComment" WHERE "mkId" = ${NETANYAHU_MK_ID};`);
  }

  if (submitted + duplicates === VERIFIED_QUOTES.length) {
    console.log('\n🎉 All quotes processed successfully!');
  }
}

main().catch(console.error);

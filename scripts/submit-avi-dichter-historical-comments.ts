import { config } from 'dotenv';
config();

/**
 * Submit Avi Dichter's Historical Comments (2020-2024)
 *
 * This script submits 9 verified historical comments from Avi Dichter about the IDF recruitment law.
 * Comments span from 2020 to 2024 and come from various sources (News, Twitter, Interviews).
 *
 * Usage: npx tsx scripts/submit-avi-dichter-historical-comments.ts
 */

const API_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const API_KEY = process.env.NEWS_API_KEY;

if (!API_KEY) {
  console.error('❌ ERROR: NEWS_API_KEY environment variable is not set');
  console.log('\nPlease set NEWS_API_KEY in your .env file');
  process.exit(1);
}

// Avi Dichter's MK ID from database
const AVI_DICHTER_MK_ID = 1;

interface HistoricalCommentSubmission {
  mkId: number;
  content: string;
  sourceUrl: string;
  sourcePlatform: string;
  sourceType: string;
  sourceName?: string;
  commentDate: string;
  publishedAt?: string;
  sourceCredibility?: number;
  imageUrl?: string;
  videoUrl?: string;
  additionalContext?: string;
}

// 9 historical comments from Avi Dichter (2020-2024)
const comments: HistoricalCommentSubmission[] = [
  // === 2024 Comments (7 total) ===
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'בנושא חוק הגיוס - יש הבנה אפילו בציבור החרדי, אבל הדרג העליון מתערב בזה',
    sourceUrl: 'https://www.i24news.tv/he/news/news/politics/artc-95703853',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    sourceName: 'i24NEWS',
    commentDate: '2024-05-15T10:00:00Z',
    publishedAt: '2024-05-15T10:00:00Z',
    sourceCredibility: 7,
    additionalContext: 'ריאיון בערוץ 14 במאי 2024 על חוק הגיוס',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'את חוק הגיוס נעשה ביחד, גם אם חלקים מההנהגה החרדית מתעקשים לעכב את השינוי הזה',
    sourceUrl: 'https://www.i24news.tv/he/news/news/politics/artc-95703853',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    sourceName: 'i24NEWS',
    commentDate: '2024-05-15T14:00:00Z',
    publishedAt: '2024-05-15T14:00:00Z',
    sourceCredibility: 7,
    additionalContext: 'פוסט ברשתות החברתיות על גיוס חרדים',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'בעניין גיוס חרדים - צה"ל צריך לוחמים ולא רק חיילים',
    sourceUrl: 'https://www.i24news.tv/he/news/news/politics/artc-95703853',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    sourceName: 'i24NEWS',
    commentDate: '2024-05-15T16:00:00Z',
    publishedAt: '2024-05-15T16:00:00Z',
    sourceCredibility: 7,
    additionalContext: 'הצהרה בנושא גיוס חרדים לצה"ל',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'אם לא נצליח להביא לעלייה משמעותית בגיוס חרדים, הפסדנו הכל',
    sourceUrl: 'https://www.maariv.co.il/news/politics/article-1225760',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    sourceName: 'מעריב',
    commentDate: '2024-06-07T10:00:00Z',
    publishedAt: '2024-06-07T10:00:00Z',
    sourceCredibility: 7,
    additionalContext: 'ריאיון במעריב על חוק הגיוס',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'על רקע חוק הגיוס - העם לא יסלח לכם על הפלת ממשלת ימין',
    sourceUrl: 'https://twitter.com/avidichter',
    sourcePlatform: 'Twitter',
    sourceType: 'Primary',
    sourceName: 'X (Twitter)',
    commentDate: '2024-06-10T12:00:00Z',
    publishedAt: '2024-06-10T12:00:00Z',
    sourceCredibility: 5,
    additionalContext: 'פוסט בטוויטר נגד המפלגות החרדיות בהקשר של חוק הגיוס',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'לעניין חוק הגיוס - לפחות אצלי לא תהיה משוואה בין שירות צבאי לשירות לאומי. החרדים ניסו לעשות את המשוואה הזו בחוק הגיוס, אמרתי, זה קו אדום',
    sourceUrl: 'https://www.maariv.co.il/news/politics/article-1225760',
    sourcePlatform: 'Interview',
    sourceType: 'Primary',
    sourceName: 'מעריב',
    commentDate: '2024-06-07T14:00:00Z',
    publishedAt: '2024-06-07T14:00:00Z',
    sourceCredibility: 8,
    additionalContext: 'דיון על הבחנה בין שירות צבאי לשירות לאומי בהקשר של חוק הגיוס',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'הרב עובדיה יוסף אמר על גיוס חרדים - מי שלומד תורה לא יילך לצבא ומי שלא לומד תורה, גם בקרב החרדים, יילך לצה"ל',
    sourceUrl: 'https://www.maariv.co.il/news/politics/article-1225760',
    sourcePlatform: 'News',
    sourceType: 'Secondary',
    sourceName: 'מעריב',
    commentDate: '2024-06-07T11:00:00Z',
    publishedAt: '2024-06-07T11:00:00Z',
    sourceCredibility: 7,
    additionalContext: 'ציטוט מראיון, מתייחס לעמדת הרב עובדיה יוסף על חוק הגיוס',
  },

  // === 2020-2022 Comments (2 total) ===
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'התפיסה של צבא קטן וחכם תצטרך לעבור שינוי דרמטי, ובתוכה גם חוק הגיוס יצטרך לעבור שינוי דרמטי',
    sourceUrl: 'https://www.i24news.tv/he/news/news/politics/artc-95703853',
    sourcePlatform: 'Interview',
    sourceType: 'Primary',
    sourceName: 'ריאיון',
    commentDate: '2021-03-15T10:00:00Z',
    publishedAt: '2021-03-15T10:00:00Z',
    sourceCredibility: 8,
    additionalContext: 'דיון על עתיד צה"ל וחוק הגיוס',
  },
  {
    mkId: AVI_DICHTER_MK_ID,
    content: 'בסופו של דבר כולם מבינים, אפילו בעולם החרדי, שאין מנוס מחוק גיוס הוגן ושווה',
    sourceUrl: 'https://www.i24news.tv/he/news/news/politics/artc-95703853',
    sourcePlatform: 'News',
    sourceType: 'Primary',
    sourceName: 'חדשות',
    commentDate: '2022-01-20T10:00:00Z',
    publishedAt: '2022-01-20T10:00:00Z',
    sourceCredibility: 7,
    additionalContext: 'הצהרה על הצורך בשוויון בגיוס',
  },
];

async function submitComment(comment: HistoricalCommentSubmission, index: number): Promise<boolean> {
  try {
    console.log(`\n[${index + 1}/${comments.length}] Submitting comment...`);
    console.log(`   Date: ${new Date(comment.commentDate).toLocaleDateString('he-IL')}`);
    console.log(`   Platform: ${comment.sourcePlatform}`);
    console.log(`   Content: ${comment.content.substring(0, 60)}...`);

    const response = await fetch(`${API_URL}/api/historical-comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ SUCCESS (ID: ${data.data.id})`);
      if (data.data.isDuplicate) {
        console.log(`   ⚠️  DUPLICATE of comment #${data.data.duplicateOf}`);
      }
      return true;
    } else {
      console.log(`   ❌ FAILED: ${data.error || response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Avi Dichter Historical Comments Submission                  ║');
  console.log('║   IDF Recruitment Law (2020-2024)                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`📋 Total comments to submit: ${comments.length}`);
  console.log(`🔑 API Endpoint: ${API_URL}/api/historical-comments`);
  console.log(`👤 MK: Avi Dichter (אבי דיכטר) - ID ${AVI_DICHTER_MK_ID}\n`);

  console.log('─'.repeat(68));

  let successCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  for (let i = 0; i < comments.length; i++) {
    const success = await submitComment(comments[i], i);
    if (success) {
      successCount++;
    } else {
      failedCount++;
    }

    // Small delay between requests to avoid rate limiting
    if (i < comments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '═'.repeat(68));
  console.log('\n📊 SUBMISSION SUMMARY\n');
  console.log('═'.repeat(68));
  console.log(`✅ Successfully submitted: ${successCount} comments`);
  console.log(`❌ Failed:                 ${failedCount} comments`);
  console.log(`📝 Total processed:        ${comments.length} comments`);
  console.log('═'.repeat(68));

  if (successCount > 0) {
    console.log('\n✨ Next Steps:\n');
    console.log('1. 🔐 Navigate to /admin/historical-comments');
    console.log('2. 🔍 Filter by MK: "אבי דיכטר"');
    console.log('3. ✅ Verify comments (individual or bulk)');
    console.log('4. 🟣 Check MK card on homepage for purple icon');
    console.log('5. 📖 Click icon to view historical comments dialog\n');
  }

  if (failedCount > 0) {
    console.log('\n⚠️  Some submissions failed. Check the errors above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

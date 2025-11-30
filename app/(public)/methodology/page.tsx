/**
 * Methodology Page
 * SEO-optimized page explaining how positions are determined and verified
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'המתודולוגיה שלנו - איך קובעים עמדות | אל הדגל',
  description:
    'למד איך אנחנו קובעים ומעדכנים את עמדות חברי הכנסת בחוק גיוס חרדים. שקיפות מלאה במקורות המידע ושיטות העבודה.',
  keywords: [
    'מתודולוגיה',
    'שיטת עבודה',
    'מקורות מידע',
    'אמינות',
    'שקיפות',
    'חוק הגיוס',
  ],
  openGraph: {
    title: 'המתודולוגיה שלנו - איך קובעים עמדות',
    description: 'שקיפות מלאה: איך אנחנו קובעים את עמדות חברי הכנסת בחוק הגיוס',
    type: 'website',
  },
}

export default async function MethodologyPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <PageHeader session={session} />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="prose prose-lg max-w-none">
          {/* Main heading with H1 - SEO critical */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              המתודולוגיה שלנו: איך קובעים עמדות חברי כנסת בחוק הגיוס
            </h1>
            <p className="text-xl text-gray-600">
              שקיפות מלאה בשיטות העבודה, מקורות המידע, וקביעת עמדות
            </p>
          </header>

          {/* Position Categories */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              קטגוריות עמדות
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              אנחנו מסווגים את עמדות חברי הכנסת לשלוש קטגוריות ברורות:
            </p>

            <div className="space-y-6">
              <div className="border-r-4 border-green-500 pr-4">
                <h3 className="text-2xl font-semibold text-green-700 mb-2">
                  🟢 תומך
                </h3>
                <p className="text-gray-700">
                  <strong>הגדרה:</strong> חבר כנסת שהביע תמיכה מפורשת בחוק
                  הגיוס או בהרחבת שירות חובה לחרדים.
                </p>
                <p className="text-gray-600 mt-2">
                  <strong>דוגמאות:</strong> הצבעה בעד החוק, תצהירים ציבוריים
                  בעד גיוס חרדים, פעילות חקיקתית לקידום החוק.
                </p>
              </div>

              <div className="border-r-4 border-orange-500 pr-4">
                <h3 className="text-2xl font-semibold text-orange-700 mb-2">
                  🟠 מתנדנד
                </h3>
                <p className="text-gray-700">
                  <strong>הגדרה:</strong> חבר כנסת שלא הביע עמדה ברורה, הביע
                  עמדות סותרות, או נמנע מהצבעה.
                </p>
                <p className="text-gray-600 mt-2">
                  <strong>דוגמאות:</strong> הימנעות מהצבעה, אמירות דו-משמעיות,
                  תלות בתנאים, או שינוי עמדה לאורך זמן.
                </p>
              </div>

              <div className="border-r-4 border-red-500 pr-4">
                <h3 className="text-2xl font-semibold text-red-700 mb-2">
                  🔴 מתנגד
                </h3>
                <p className="text-gray-700">
                  <strong>הגדרה:</strong> חבר כנסת שהביע התנגדות מפורשת לחוק
                  הגיוס או לגיוס חובה של חרדים.
                </p>
                <p className="text-gray-600 mt-2">
                  <strong>דוגמאות:</strong> הצבעה נגד החוק, תצהירים ציבוריים
                  נגד גיוס חרדים, פעילות לסיכול החוק.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              מקורות המידע
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              אנחנו מסתמכים על מקורות מידע מהימנים ומגוונים:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  1. אתר הכנסת הרשמי
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                  <li>פרוטוקולים של ישיבות המליאה וועדות</li>
                  <li>תוצאות הצבעות</li>
                  <li>הצעות חוק והצעות לסדר היום</li>
                  <li>פרופילים של חברי כנסת</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  2. רשתות חברתיות
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                  <li>X/Twitter - פוסטים רשמיים של חברי כנסת</li>
                  <li>Facebook - פוסטים וסרטונים</li>
                  <li>אתרי מפלגות - הצהרות ועמדות רשמיות</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  3. תקשורת
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                  <li>ראיונות בעיתונות, טלוויזיה ורדיו</li>
                  <li>כתבות חדשות מאומתות</li>
                  <li>אתרי חדשות מובילים (ידיעות, וואלה, מעריב, הארץ)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  4. תיעוד היסטורי
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                  <li>ארכיון תצהירים ציבוריים</li>
                  <li>מעקב אחר שינויי עמדות לאורך זמן</li>
                  <li>היסטוריית הצבעות</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Verification Process */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              תהליך האימות
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              כל מידע עובר תהליך אימות קפדני:
            </p>

            <ol className="list-decimal list-inside space-y-4 text-lg text-gray-700">
              <li className="pr-2">
                <strong>איסוף ראשוני:</strong> זיהוי מקור מידע רלוונטי (הצבעה,
                תצהיר, פוסט)
              </li>
              <li className="pr-2">
                <strong>אימות מקור:</strong> בדיקה שהמידע מגיע ממקור מהימן
                ואותנטי
              </li>
              <li className="pr-2">
                <strong>הקשר:</strong> ניתוח ההקשר המלא של האמירה או הפעולה
              </li>
              <li className="pr-2">
                <strong>הצלבה:</strong> בדיקה מול מקורות נוספים לוודא עקביות
              </li>
              <li className="pr-2">
                <strong>סיווג:</strong> קביעת העמדה (תומך/מתנדנד/מתנגד) לפי
                הקריטריונים
              </li>
              <li className="pr-2">
                <strong>תיעוד:</strong> שמירת המקור והקישור למידע המקורי
              </li>
              <li className="pr-2">
                <strong>עדכון:</strong> פרסום העמדה במערכת עם מועד העדכון
              </li>
            </ol>
          </section>

          {/* Update Frequency */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              תדירות עדכונים
            </h2>
            <div className="space-y-4 text-lg text-gray-700">
              <p>
                <strong>עדכונים בזמן אמת:</strong> שינויי עמדות משמעותיים
                מתעדכנים תוך שעות מפרסומם.
              </p>
              <p>
                <strong>סקירה שבועית:</strong> בדיקה שוטפת של רשתות חברתיות
                וכלי תקשורת.
              </p>
              <p>
                <strong>מעקב אחר הצבעות:</strong> תיעוד מיידי של כל הצבעה
                רלוונטית בכנסת.
              </p>
              <p>
                <strong>עדכוני רקע:</strong> השלמת מידע היסטורי ותיעוד תצהירים
                קודמים.
              </p>
            </div>
          </section>

          {/* Quality Standards */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              סטנדרטים של איכות
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  ✅ מה אנחנו כן עושים
                </h3>
                <ul className="list-disc list-inside text-blue-800 space-y-1 mr-4">
                  <li>מציגים מידע עובדתי ומאומת בלבד</li>
                  <li>שומרים על נייטרליות פוליטית</li>
                  <li>מפרסמים מקורות למידע</li>
                  <li>מתעדכנים בזמן אמת</li>
                  <li>מאפשרים דיווח על טעויות</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  ❌ מה אנחנו לא עושים
                </h3>
                <ul className="list-disc list-inside text-red-800 space-y-1 mr-4">
                  <li>לא מפרשים עמדות על בסיס השערות</li>
                  <li>לא מקדמים אג'נדה פוליטית</li>
                  <li>לא מסתמכים על מקורות לא מהימנים</li>
                  <li>לא מפרסמים שמועות</li>
                  <li>לא משנים מידע רטרואקטיבית ללא תיעוד</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Transparency */}
          <section className="mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              שקיפות ואחריות
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              אנחנו מחויבים לשקיפות מלאה. כל עמדה מתועדת עם:
            </p>
            <ul className="list-disc list-inside text-lg text-gray-700 space-y-2 mr-4">
              <li>מקור המידע (קישור למקור המקורי כשאפשרי)</li>
              <li>תאריך העדכון האחרון</li>
              <li>היסטוריה של שינויי עמדות</li>
              <li>תצהירים ציבוריים רלוונטיים</li>
            </ul>
          </section>

          {/* Feedback */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              דיווח על טעויות
            </h2>
            <p className="text-lg text-gray-700">
              מצאת מידע לא מדויק? אנחנו מעודדים את הציבור לדווח על טעויות.
              כל דיווח נבדק בקפדנות ומתוקן במידת הצורך, עם עדכון מלא של
              ההיסטוריה.
            </p>
          </section>

          {/* CTA */}
          <div className="text-center mt-12 space-y-4">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              חזרה לדף הבית
            </Link>
            <div>
              <Link
                href="/about"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                למד עוד אודות הפלטפורמה
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

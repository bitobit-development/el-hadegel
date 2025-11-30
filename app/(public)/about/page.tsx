/**
 * About Page
 * SEO-optimized page explaining the platform's mission and purpose
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { auth } from '@/auth'
import { FAQSchema } from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'אודות אל הדגל - מידע על הפלטפורמה | אל הדגל',
  description:
    'פלטפורמה למעקב אחר עמדות 120 חברי הכנסת בחוק גיוס חרדים. שקיפות, מידע מדויק, ועדכונים בזמן אמת.',
  keywords: ['אודות', 'אל הדגל', 'חוק הגיוס', 'מעקב כנסת', 'שקיפות פוליטית'],
  openGraph: {
    title: 'אודות אל הדגל - מידע על הפלטפורמה',
    description: 'למד עוד על המיזם למעקב אחר עמדות חברי הכנסת בחוק גיוס חרדים',
    type: 'website',
  },
}

export default async function AboutPage() {
  const session = await auth()

  const faqs = [
    {
      question: 'מה זה "אל הדגל"?',
      answer:
        'אל הדגל היא פלטפורמה למעקב אחר עמדות חברי הכנסת בחוק גיוס חרדים. אנחנו מספקים מידע מדויק, עדכני ונגיש על 120 חברי הכנסת ועמדותיהם בנושא.',
    },
    {
      question: 'למה חשוב לעקוב אחר עמדות חברי הכנסת?',
      answer:
        'חוק הגיוס הוא אחד הנושאים המרכזיים והרגישים בחברה הישראלית. מעקב אחר עמדות חברי הכנסת מאפשר לאזרחים לדעת איפה הנבחרים שלהם עומדים, להבין את המפה הפוליטית, ולקבל החלטות מושכלות בבחירות.',
    },
    {
      question: 'מאיפה המידע מגיע?',
      answer:
        'המידע נאסף ממקורות מהימנים כולל תצהירים ציבוריים של חברי כנסת, פעילות ברשתות חברתיות, כתבות חדשות, והצבעות בכנסת.',
    },
    {
      question: 'האם הפלטפורמה משתייכת לצד פוליטי מסוים?',
      answer:
        'לא. אל הדגל היא פלטפורמה עצמאית ונייטרלית המספקת מידע עובדתי בלבד. אנחנו לא מקדמים אג נדה פוליטית ומציגים את העמדות כפי שהן.',
    },
    {
      question: 'איך אני יכול לעזור?',
      answer:
        'תוכל לעזור על ידי שיתוף הפלטפורמה עם חברים ומשפחה, דיווח על מידע לא מדויק, והפצת המודעות לחשיבות המעקב אחר פעילות חברי הכנסת.',
    },
  ]

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <FAQSchema faqs={faqs} />
      <PageHeader session={session} />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="prose prose-lg max-w-none">
          {/* Main heading with H1 - SEO critical */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              אודות אל הדגל - מעקב אחר עמדות חברי הכנסת בחוק הגיוס
            </h1>
            <p className="text-xl text-gray-600">
              פלטפורמה למעקב בזמן אמת אחר עמדות 120 חברי הכנסת בחוק גיוס חרדים
            </p>
          </header>

          {/* Mission section */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">המשימה שלנו</h2>
            <p className="text-lg text-gray-700 mb-4">
              חוק הגיוס הוא אחד הנושאים המרכזיים והמורכבים ביותר בחברה הישראלית.
              הדיון סביבו נוגע בערכי יסוד של המדינה: שוויון בנטל, חופש דת, וחוזקה
              הביטחוני של ישראל.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              <strong>אל הדגל</strong> נוצרה מתוך אמונה בשקיפות פוליטית ובזכות
              הציבור לדעת. אנחנו מאמינים שאזרחים ראויים לדעת איפה הנבחרים שלהם
              עומדים בנושאים חשובים, ושמידע נגיש ומדויק הוא הבסיס לדמוקרטיה בריאה.
            </p>
          </section>

          {/* What we do section */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              מה אנחנו עושים
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  🔍 מעקב מקיף
                </h3>
                <p className="text-gray-700">
                  אנחנו עוקבים אחר 120 חברי הכנסת מכל המפלגות - קואליציה
                  ואופוזיציה. כל עמדה מתועדת ומעודכנת בזמן אמת.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  📊 ניתוח ונתונים
                </h3>
                <p className="text-gray-700">
                  אנחנו מציגים את המידע בצורה ויזואלית וברורה: סטטיסטיקות, גרפים,
                  וסינון מתקדם לפי מפלגה, עמדה, וקואליציה/אופוזיציה.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  📜 היסטוריה ושקיפות
                </h3>
                <p className="text-gray-700">
                  אנחנו שומרים תיעוד של תצהירים ציבוריים, שינויי עמדות, ופעילות
                  ברשתות חברתיות - כדי שהציבור יוכל לעקוב אחר העמדות לאורך זמן.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  ⚡ עדכונים בזמן אמת
                </h3>
                <p className="text-gray-700">
                  כל שינוי בעמדה, כל תצהיר חדש, וכל פוסט רלוונטי מתעדכנים
                  בפלטפורמה מיד לאחר פרסומם.
                </p>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              איך זה עובד
            </h2>
            <ol className="list-decimal list-inside space-y-3 text-lg text-gray-700">
              <li>
                <strong>איסוף מידע:</strong> אנחנו אוספים מידע ממקורות מהימנים
                כולל אתר הכנסת, כתבות חדשות, ורשתות חברתיות.
              </li>
              <li>
                <strong>אימות:</strong> כל מידע עובר בדיקה ואימות כדי להבטיח
                דיוק.
              </li>
              <li>
                <strong>סיווג עמדות:</strong> עמדות מסווגות לשלוש קטגוריות:
                תומך (🟢), מתנדנד (🟠), מתנגד (🔴).
              </li>
              <li>
                <strong>עדכון מתמיד:</strong> המערכת מתעדכנת באופן שוטף עם מידע
                חדש ושינויי עמדות.
              </li>
            </ol>
          </section>

          {/* FAQ Section */}
          <section className="mb-12 bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              שאלות נפוצות
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact/Feedback */}
          <section className="mb-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">צור קשר</h2>
            <p className="text-lg text-gray-700 mb-4">
              יש לך שאלה? מצאת טעות? רוצה להציע שיפור?
            </p>
            <p className="text-lg text-gray-700">
              אנחנו מאמינים בשיתוף פעולה עם הציבור. המשוב שלך חשוב לנו ועוזר לנו
              לשפר את הפלטפורמה.
            </p>
          </section>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}

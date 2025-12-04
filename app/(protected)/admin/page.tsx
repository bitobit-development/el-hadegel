import { getMKs, getPositionStats } from '@/app/actions/mk-actions';
import { AdminMKTable } from '@/components/admin/admin-mk-table';
import { StatsDashboard } from '@/components/stats-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/auth';
import { getHistoricalCommentsStats } from '@/app/actions/admin-historical-comment-actions';
import { getQuestionnaireStats } from '@/app/actions/questionnaire-actions';
import { getVideoStats } from '@/app/actions/video-actions';
import { MessageSquareQuote, ArrowLeft, BarChart3, ClipboardList, Video } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage() {
  const [mks, stats, session, historicalCommentsStats, questionnaireStats, videoStats] = await Promise.all([
    getMKs(),
    getPositionStats(),
    auth(),
    getHistoricalCommentsStats(),
    getQuestionnaireStats(),
    getVideoStats(),
  ]);

  const adminEmail = session?.user?.email || 'unknown';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-right">לוח בקרה</h1>
        <p className="text-muted-foreground text-right">
          נהל את עמדות חברי הכנסת על חוק הגיוס
        </p>
      </div>

      <StatsDashboard stats={stats} />

      {/* Quick Links Section */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <MessageSquareQuote className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-right">ניהול ציטוטים היסטוריים</CardTitle>
              <CardDescription className="text-right">
                צפייה וניהול תגובות של חברי הקואליציה
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {historicalCommentsStats.total} ציטוטים
            </Badge>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {historicalCommentsStats.byVerification.verified} מאומתים
              </Badge>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                {historicalCommentsStats.byVerification.unverified} ממתינים
              </Badge>
            </div>
          </div>
          <Link href="/admin/historical-comments">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
              פתח ניהול ציטוטים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Analytics Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-right">ניתוח תעבורה</CardTitle>
              <CardDescription className="text-right">
                צפייה בסטטיסטיקות מבקרים וצפיות בדפים
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link href="/admin/analytics">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
              פתח ניתוח תעבורה
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Questionnaires Card */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2 rounded-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-right">ניהול שאלונים</CardTitle>
              <CardDescription className="text-right">
                יצירה ועריכה של שאלונים ומעקב אחר תשובות
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className="bg-teal-100 text-teal-800">
              {questionnaireStats.total} שאלונים
            </Badge>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {questionnaireStats.active} פעילים
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {questionnaireStats.totalResponses} תשובות
              </Badge>
            </div>
          </div>
          <Link href="/admin/questionnaires">
            <Button className="w-full bg-teal-600 hover:bg-teal-700 gap-2">
              פתח ניהול שאלונים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Videos Card */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-right">ניהול סרטונים</CardTitle>
              <CardDescription className="text-right">
                העלאה, עריכה ומחיקה של סרטוני וידאו
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {videoStats.total} סרטונים
            </Badge>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {videoStats.published} פורסמו
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {videoStats.totalViews} צפיות
              </Badge>
            </div>
          </div>
          <Link href="/admin/videos">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 gap-2">
              פתח ניהול סרטונים
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <AdminMKTable mks={mks} adminEmail={adminEmail} />
    </div>
  );
}

import {
  getAllHistoricalComments,
  getHistoricalCommentsStats,
  getCoalitionMKsForFilter,
} from '@/app/actions/admin-historical-comment-actions';
import { HistoricalCommentsManager } from '@/components/admin/HistoricalCommentsManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquareQuote,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'ניהול ציטוטים היסטוריים - EL HADEGEL',
  description: 'ניהול וצפייה בציטוטים היסטוריים של חברי הקואליציה',
};

export default async function HistoricalCommentsAdminPage() {
  // Fetch data in parallel
  const [commentsData, stats, coalitionMKs] = await Promise.all([
    getAllHistoricalComments(undefined, { page: 1, limit: 1000 }),
    getHistoricalCommentsStats(),
    getCoalitionMKsForFilter(),
  ]);

  // Calculate platform breakdown for display
  const topPlatforms = Object.entries(stats.byPlatform)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-right flex items-center gap-3">
          <MessageSquareQuote className="h-8 w-8 text-purple-600" />
          ניהול ציטוטים היסטוריים
        </h1>
        <p className="text-muted-foreground text-right">
          צפייה וניהול של כל הציטוטים ההיסטוריים על חוק הגיוס לצה״ל
        </p>
      </div>

      {/* Return to Admin Button */}
      <div className="flex justify-end">
        <Link href="/admin">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזור ללוח הבקרה
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Comments */}
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              סה״כ ציטוטים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <MessageSquareQuote className="h-8 w-8 text-purple-600" aria-hidden="true" />
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
                <div className="text-xs text-muted-foreground">ציטוטים ראשיים</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verified */}
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              ציטוטים מאומתים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {stats.byVerification.verified}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.byVerification.verified / stats.total) * 100)
                    : 0}
                  % אימות
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unverified */}
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              ממתינים לאימות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <XCircle className="h-8 w-8 text-orange-600" aria-hidden="true" />
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.byVerification.unverified}
                </div>
                <div className="text-xs text-muted-foreground">צריכים סקירה</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MKs with Comments */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground text-right">
              חברי כנסת
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalMKsWithComments}
                </div>
                <div className="text-xs text-muted-foreground">עם ציטוטים</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      {topPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              פילוח לפי פלטפורמה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topPlatforms.map(([platform, count]) => (
                <div
                  key={platform}
                  className="bg-muted/30 rounded-lg p-3 text-center space-y-1"
                >
                  <div className="text-2xl font-bold text-purple-600">{count}</div>
                  <div className="text-sm text-muted-foreground">{platform}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manager Component */}
      <HistoricalCommentsManager
        initialComments={commentsData.comments as any}
        totalCount={stats.total}
        coalitionMKs={coalitionMKs}
      />
    </div>
  );
}

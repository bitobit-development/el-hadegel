import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Eye, Users, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAnalyticsStats,
  getPageViewsByDay,
  getTopPages,
  getVisitorTrend,
  type DateRange,
} from '@/app/actions/analytics-actions';
import { AnalyticsChart } from '@/components/admin/analytics/AnalyticsChart';
import { TopPagesTable } from '@/components/admin/analytics/TopPagesTable';
import { DateRangePicker } from '@/components/admin/analytics/DateRangePicker';

type PageProps = {
  searchParams: Promise<{ range?: DateRange }>;
};

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const dateRange: DateRange = params.range || '30d';

  // Fetch all data in parallel
  const [stats, pageViewsData, topPages, trend] = await Promise.all([
    getAnalyticsStats(dateRange),
    getPageViewsByDay(dateRange === '30d' || dateRange === '90d' ? '30d' : '7d'),
    getTopPages(dateRange),
    getVisitorTrend(dateRange),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              חזרה ללוח בקרה
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold">ניתוח תעבורה</h1>
          </div>
          <DateRangePicker currentRange={dateRange} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Page Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">סה״כ צפיות בדפים</CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.totalPageViews.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              ב-{dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} ימים אחרונים
            </p>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">מבקרים ייחודיים</CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.uniqueVisitors.toLocaleString('he-IL')}
            </div>
            {trend.change !== 0 && (
              <div className="flex items-center gap-1 mt-1 justify-end">
                <span className={`text-xs font-medium ${trend.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isIncrease ? '+' : ''}{trend.change}%
                </span>
                <TrendingUp className={`h-3 w-3 ${trend.isIncrease ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">מבקרים היום</CardTitle>
            <div className="p-2 rounded-lg bg-purple-50">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.todayVisitors.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              מתחילת היום
            </p>
          </CardContent>
        </Card>

        {/* This Week's Visitors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">מבקרים השבוע</CardTitle>
            <div className="p-2 rounded-lg bg-orange-50">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.weekVisitors.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              ב-7 ימים אחרונים
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">צפיות בדפים לאורך זמן</CardTitle>
          <CardDescription className="text-right">
            מגמת התעבורה באתר
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsChart data={pageViewsData} />
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">דפים פופולריים</CardTitle>
          <CardDescription className="text-right">
            הדפים הנצפים ביותר באתר
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopPagesTable pages={topPages} />
        </CardContent>
      </Card>
    </div>
  );
}

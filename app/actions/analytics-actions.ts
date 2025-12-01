'use server';

import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';

export type DateRange = '7d' | '30d' | '90d';

// Helper to get date range
function getDateRange(range: DateRange): Date {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Get overall analytics statistics
 */
export async function getAnalyticsStats(dateRange: DateRange = '30d') {
  try {
    const startDate = getDateRange(dateRange);

    // Total page views
    const totalPageViews = await prismaQuestionnaire.pageView.count({
      where: { timestamp: { gte: startDate } },
    });

    // Unique visitors (unique IP addresses)
    const uniqueVisitors = await prismaQuestionnaire.pageView.groupBy({
      by: ['ipAddress'],
      where: {
        timestamp: { gte: startDate },
        ipAddress: { not: null },
      },
    });

    // Today's visitors
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisitors = await prismaQuestionnaire.pageView.groupBy({
      by: ['ipAddress'],
      where: {
        timestamp: { gte: today },
        ipAddress: { not: null },
      },
    });

    // This week's visitors
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    thisWeek.setHours(0, 0, 0, 0);
    const weekVisitors = await prismaQuestionnaire.pageView.groupBy({
      by: ['ipAddress'],
      where: {
        timestamp: { gte: thisWeek },
        ipAddress: { not: null },
      },
    });

    return {
      totalPageViews,
      uniqueVisitors: uniqueVisitors.length,
      todayVisitors: todayVisitors.length,
      weekVisitors: weekVisitors.length,
    };
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return {
      totalPageViews: 0,
      uniqueVisitors: 0,
      todayVisitors: 0,
      weekVisitors: 0,
    };
  }
}

/**
 * Get page views by day for chart
 */
export async function getPageViewsByDay(dateRange: DateRange = '7d') {
  try {
    const startDate = getDateRange(dateRange);

    const pageViews = await prismaQuestionnaire.pageView.findMany({
      where: { timestamp: { gte: startDate } },
      select: { timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    // Group by day
    const viewsByDay = new Map<string, number>();
    pageViews.forEach((view) => {
      const day = view.timestamp.toISOString().split('T')[0];
      viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
    });

    // Convert to array format for charts
    return Array.from(viewsByDay.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching page views by day:', error);
    return [];
  }
}

/**
 * Get top visited pages
 */
export async function getTopPages(dateRange: DateRange = '30d', limit: number = 5) {
  try {
    const startDate = getDateRange(dateRange);

    const topPages = await prismaQuestionnaire.pageView.groupBy({
      by: ['path'],
      where: { timestamp: { gte: startDate } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: limit,
    });

    return topPages.map((page) => ({
      path: page.path,
      views: page._count.path,
    }));
  } catch (error) {
    console.error('Error fetching top pages:', error);
    return [];
  }
}

/**
 * Get visitor count trend (comparison with previous period)
 */
export async function getVisitorTrend(dateRange: DateRange = '30d') {
  try {
    const startDate = getDateRange(dateRange);
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

    // Previous period
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [currentVisitors, previousVisitors] = await Promise.all([
      prismaQuestionnaire.pageView.groupBy({
        by: ['ipAddress'],
        where: {
          timestamp: { gte: startDate },
          ipAddress: { not: null },
        },
      }),
      prismaQuestionnaire.pageView.groupBy({
        by: ['ipAddress'],
        where: {
          timestamp: { gte: previousStartDate, lt: startDate },
          ipAddress: { not: null },
        },
      }),
    ]);

    const current = currentVisitors.length;
    const previous = previousVisitors.length;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      current,
      previous,
      change: Math.round(change),
      isIncrease: change > 0,
    };
  } catch (error) {
    console.error('Error fetching visitor trend:', error);
    return {
      current: 0,
      previous: 0,
      change: 0,
      isIncrease: false,
    };
  }
}

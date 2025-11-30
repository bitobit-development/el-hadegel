'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Filter } from 'lucide-react';
import { PositionStats, POSITION_LABELS, POSITION_COLORS } from '@/types/mk';
import { cn } from '@/lib/utils';

interface StatsDashboardProps {
  stats: PositionStats;
  activeFiltersCount?: number;
}

export function StatsDashboard({ stats, activeFiltersCount = 0 }: StatsDashboardProps) {
  const announcementRef = useRef<HTMLDivElement>(null);
  const prevStatsRef = useRef(stats);

  // Calculate percentages
  const supportPercentage = Math.round((stats.support / stats.total) * 100);
  const neutralPercentage = Math.round((stats.neutral / stats.total) * 100);
  const againstPercentage = Math.round((stats.against / stats.total) * 100);

  // Announce statistics changes to screen readers
  useEffect(() => {
    const prevStats = prevStatsRef.current;

    if (prevStats.total !== stats.total && announcementRef.current) {
      const message =
        stats.total === 120
          ? 'הסטטיסטיקה עודכנה: מציג את כל 120 חברי הכנסת'
          : `הסטטיסטיקה עודכנה: מציג ${stats.total} מתוך 120 חברי כנסת`;

      announcementRef.current.textContent = message;
    }

    prevStatsRef.current = stats;
  }, [stats]);

  const statItems = [
    {
      position: 'SUPPORT' as const,
      count: stats.support,
      percentage: supportPercentage,
    },
    {
      position: 'NEUTRAL' as const,
      count: stats.neutral,
      percentage: neutralPercentage,
    },
    {
      position: 'AGAINST' as const,
      count: stats.against,
      percentage: againstPercentage,
    },
  ];

  return (
    <>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      <section className="space-y-6">
        {/* Header - Outside panel for breathing room */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart className="h-6 w-6 text-gray-600" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-gray-900">סטטיסטיקה</h2>
          </div>

          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <Filter className="h-3 w-3" />
              מסונן ({stats.total} מתוך 120)
            </Badge>
          )}
        </div>

        {/* Stats Panel - Always Visible */}
        <div
          className="p-6 md:p-8 bg-gray-50 border border-gray-200 rounded-lg"
          role="region"
          aria-label="סטטיסטיקת עמדות חברי הכנסת"
        >
          <div className="space-y-8">
            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {statItems.map((item) => {
                const colors = POSITION_COLORS[item.position];
                const label = POSITION_LABELS[item.position];

                return (
                  <Card
                    key={item.position}
                    className={cn(
                      'transition-transform hover:scale-105',
                      colors.bg,
                      'border-2'
                    )}
                  >
                    <CardContent className="p-4 md:p-8">
                      <div className="flex flex-col items-center gap-2 md:gap-3">
                        <div className={cn('text-2xl md:text-4xl font-bold', colors.text)}>
                          {item.count}
                        </div>
                        <Badge
                          className={cn(
                            'text-xs w-fit',
                            colors.bg,
                            colors.text,
                            'hover:opacity-90'
                          )}
                        >
                          {item.percentage}%
                        </Badge>
                        <div className={cn('text-xs md:text-sm font-medium', colors.text)}>
                          {label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-6 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>התפלגות עמדות</span>
                <span className="font-medium">
                  {activeFiltersCount > 0
                    ? `${stats.total} מתוך 120 חברי כנסת`
                    : 'כל 120 חברי הכנסת'}
                </span>
              </div>

              <div
                className="h-8 w-full rounded-full overflow-hidden bg-muted"
                role="progressbar"
                aria-label="התפלגות עמדות"
                aria-valuenow={stats.total}
                aria-valuemin={0}
                aria-valuemax={120}
              >
                <div className="h-full flex transition-all duration-500 ease-out">
                  <div
                    className={cn(
                      POSITION_COLORS.SUPPORT.bg,
                      'transition-all duration-500',
                      supportPercentage > 0 && 'border-l-2 border-white/30'
                    )}
                    style={{ width: `${supportPercentage}%` }}
                    title={`${POSITION_LABELS.SUPPORT}: ${stats.support} (${supportPercentage}%)`}
                  />
                  <div
                    className={cn(
                      POSITION_COLORS.NEUTRAL.bg,
                      'transition-all duration-500',
                      neutralPercentage > 0 && 'border-l-2 border-r-2 border-white/30'
                    )}
                    style={{ width: `${neutralPercentage}%` }}
                    title={`${POSITION_LABELS.NEUTRAL}: ${stats.neutral} (${neutralPercentage}%)`}
                  />
                  <div
                    className={cn(
                      POSITION_COLORS.AGAINST.bg,
                      'transition-all duration-500',
                      againstPercentage > 0 && 'border-r-2 border-white/30'
                    )}
                    style={{ width: `${againstPercentage}%` }}
                    title={`${POSITION_LABELS.AGAINST}: ${stats.against} (${againstPercentage}%)`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

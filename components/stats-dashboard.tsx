'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
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

  // Determine which position has highest count (for leader glow)
  const leaderPosition = useMemo(() => {
    const positions = [
      { type: 'SUPPORT', count: stats.support },
      { type: 'NEUTRAL', count: stats.neutral },
      { type: 'AGAINST', count: stats.against },
    ];
    return positions.reduce((max, pos) => (pos.count > max.count ? pos : max)).type;
  }, [stats]);

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
      glowColor: '239, 68, 68', // red-500 RGB (SUPPORT is red)
    },
    {
      position: 'NEUTRAL' as const,
      count: stats.neutral,
      percentage: neutralPercentage,
      glowColor: '234, 88, 12', // orange-600 RGB (better contrast)
    },
    {
      position: 'AGAINST' as const,
      count: stats.against,
      percentage: againstPercentage,
      glowColor: '34, 197, 94', // green-500 RGB (AGAINST is green)
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

      {/* Main statistics section - NO visible title, NO background panel */}
      <section
        className="space-y-6"
        aria-labelledby="stats-heading"
      >
        {/* Hidden accessibility heading */}
        <h2 id="stats-heading" className="sr-only">
          התפלגות עמדות חברי הכנסת בנושא חוק הגיוס
        </h2>

        {/* Stats Cards Grid - Floating with glow animations */}
        <div
          className="grid grid-cols-3 gap-4 md:gap-6"
          role="group"
          aria-label="כרטיסי סטטיסטיקה"
        >
          {statItems.map((item) => {
            const colors = POSITION_COLORS[item.position];
            const label = POSITION_LABELS[item.position];
            const isLeader = item.position === leaderPosition;

            return (
              <div
                key={item.position}
                className={cn(
                  'stat-card rounded-xl border-2 p-4 md:p-6',
                  `stat-card-${item.position.toLowerCase()}`,
                  isLeader && 'stat-card-leader',
                  colors.bg,
                  colors.border
                )}
                style={{
                  '--glow-color': item.glowColor,
                } as React.CSSProperties}
                role="region"
                aria-label={`${label}: ${item.count} חברי כנסת, ${item.percentage} אחוז`}
              >
                <div className="h-full">
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                      {/* Count - Large and prominent */}
                      <div
                        className={cn(
                          'text-3xl md:text-5xl lg:text-6xl font-bold',
                          colors.text
                        )}
                        aria-hidden="true"
                      >
                        {item.count}
                      </div>

                      {/* Percentage Badge */}
                      <Badge
                        className={cn(
                          'text-xs md:text-sm font-semibold px-3 py-1',
                          colors.bg,
                          colors.text,
                          'hover:opacity-90 transition-opacity'
                        )}
                        aria-hidden="true"
                      >
                        {item.percentage}%
                      </Badge>

                      {/* Position Label */}
                      <div
                        className={cn(
                          'text-sm md:text-base font-medium mt-1',
                          colors.text
                        )}
                        aria-hidden="true"
                      >
                        {label}
                      </div>

                      {/* "חברי כנסת" subtitle */}
                      <div
                        className={cn(
                          'text-xs opacity-80',
                          colors.text
                        )}
                        aria-hidden="true"
                      >
                        חברי כנסת
                      </div>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar - Visual separator */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span className="font-medium">התפלגות עמדות</span>
            <span className="font-medium">
              {activeFiltersCount > 0
                ? `${stats.total} מתוך 120 חברי כנסת`
                : 'כל 120 חברי הכנסת'}
            </span>
          </div>

          <div
            className="h-6 w-full rounded-full overflow-hidden bg-muted shadow-inner"
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
      </section>

      {/* Scoped glow animation styles */}
      <style jsx>{`
        /* Position-specific glow colors */
        .stat-card-support { --glow-color: 239, 68, 68; }
        .stat-card-neutral { --glow-color: 234, 88, 12; }
        .stat-card-against { --glow-color: 34, 197, 94; }

        /* Tier 1: Ambient Glow (all cards) */
        .stat-card {
          animation: ambient-glow 4s ease-in-out infinite;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes ambient-glow {
          0%, 100% {
            box-shadow:
              0 8px 16px -4px rgba(0, 0, 0, 0.1),
              0 0 20px rgba(var(--glow-color), 0.2);
          }
          50% {
            box-shadow:
              0 10px 20px -4px rgba(0, 0, 0, 0.15),
              0 0 30px rgba(var(--glow-color), 0.4);
          }
        }

        /* Tier 2: Hover Enhancement */
        .stat-card:hover {
          box-shadow:
            0 12px 24px -6px rgba(0, 0, 0, 0.2),
            0 0 40px rgba(var(--glow-color), 0.6) !important;
          transform: translateY(-3px);
        }

        /* Tier 3: Leader Glow (highest count) */
        .stat-card-leader {
          animation: leader-glow 3s ease-in-out infinite;
        }

        @keyframes leader-glow {
          0%, 100% {
            box-shadow:
              0 10px 20px -4px rgba(0, 0, 0, 0.15),
              0 0 25px rgba(var(--glow-color), 0.3);
          }
          50% {
            box-shadow:
              0 12px 24px -4px rgba(0, 0, 0, 0.2),
              0 0 40px rgba(var(--glow-color), 0.6);
          }
        }

        /* Accessibility: Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .stat-card,
          .stat-card-leader {
            animation: none !important;
          }
          .stat-card:hover {
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}

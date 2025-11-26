import { Card, CardContent } from '@/components/ui/card';
import { PositionStats, POSITION_LABELS, POSITION_COLORS } from '@/types/mk';

interface StatsDashboardProps {
  stats: PositionStats;
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const statItems = [
    {
      position: 'SUPPORT' as const,
      count: stats.support,
      percentage: (stats.support / stats.total) * 100,
    },
    {
      position: 'NEUTRAL' as const,
      count: stats.neutral,
      percentage: (stats.neutral / stats.total) * 100,
    },
    {
      position: 'AGAINST' as const,
      count: stats.against,
      percentage: (stats.against / stats.total) * 100,
    },
  ];

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-right">סטטיסטיקה</h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {statItems.map((item) => {
            const colors = POSITION_COLORS[item.position];
            const label = POSITION_LABELS[item.position];

            return (
              <div
                key={item.position}
                className={`flex flex-col items-center p-6 rounded-lg shadow-md transition-transform hover:scale-105 ${colors.bg} ${colors.text}`}
              >
                <div className="text-4xl font-bold">
                  {item.count}
                </div>
                <div className="text-sm font-medium mt-2 opacity-95">
                  {label}
                </div>
                <div className="text-xs mt-1 opacity-90">
                  ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="text-sm text-right text-muted-foreground">
            התפלגות עמדות ({stats.total} חברי כנסת)
          </div>
          <div className="flex h-6 rounded-full overflow-hidden border-2 border-gray-300 shadow-sm">
            <div
              className={`${POSITION_COLORS.SUPPORT.bg} transition-all duration-300 border-l-2 border-white/30`}
              style={{ width: `${(stats.support / stats.total) * 100}%` }}
              title={`${POSITION_LABELS.SUPPORT}: ${stats.support} (${((stats.support / stats.total) * 100).toFixed(1)}%)`}
            />
            <div
              className={`${POSITION_COLORS.NEUTRAL.bg} transition-all duration-300 border-l-2 border-r-2 border-white/30`}
              style={{ width: `${(stats.neutral / stats.total) * 100}%` }}
              title={`${POSITION_LABELS.NEUTRAL}: ${stats.neutral} (${((stats.neutral / stats.total) * 100).toFixed(1)}%)`}
            />
            <div
              className={`${POSITION_COLORS.AGAINST.bg} transition-all duration-300 border-r-2 border-white/30`}
              style={{ width: `${(stats.against / stats.total) * 100}%` }}
              title={`${POSITION_LABELS.AGAINST}: ${stats.against} (${((stats.against / stats.total) * 100).toFixed(1)}%)`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

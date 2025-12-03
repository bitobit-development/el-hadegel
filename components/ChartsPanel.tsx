'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartFilters } from '@/components/ChartFilters';
import { getFilteredPositionStats } from '@/app/actions/mk-actions';
import {
  PositionStats,
  FilteredPositionStats,
  MKData,
  POSITION_LABELS,
  POSITION_CHART_COLORS,
} from '@/types/mk';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';

type ChartsPanelProps = {
  initialStats: PositionStats;
  availableFactions: string[];
  allMKs: MKData[];
};

type ChartType = 'pie' | 'bar';

export const ChartsPanel = ({
  initialStats,
  availableFactions,
  allMKs,
}: ChartsPanelProps) => {
  const [selectedFactions, setSelectedFactions] = useState<string[]>([]);
  const [selectedMKIds, setSelectedMKIds] = useState<number[]>([]);
  const [filteredStats, setFilteredStats] = useState<FilteredPositionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('pie');

  // Responsive breakpoints
  const { isMobile, isTablet } = useResponsive();
  const chartHeight = isMobile ? 300 : isTablet ? 350 : 400;

  // Fetch filtered stats with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // If no filters, use initial stats
      if (selectedFactions.length === 0 && selectedMKIds.length === 0) {
        setFilteredStats(null);
        return;
      }

      setIsLoading(true);
      try {
        const stats = await getFilteredPositionStats({
          factions: selectedFactions,
          mkIds: selectedMKIds,
        });
        setFilteredStats(stats);
      } catch (error) {
        console.error('Failed to fetch filtered stats:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedFactions, selectedMKIds]);

  const handleClearFilters = useCallback(() => {
    setSelectedFactions([]);
    setSelectedMKIds([]);
    setFilteredStats(null);
  }, []);

  // Use filtered stats if available, otherwise initial stats
  const displayStats = filteredStats || initialStats;

  // Prepare data for charts
  const pieData = [
    { name: POSITION_LABELS.SUPPORT, value: displayStats.support, color: POSITION_CHART_COLORS.SUPPORT },
    { name: POSITION_LABELS.NEUTRAL, value: displayStats.neutral, color: POSITION_CHART_COLORS.NEUTRAL },
    { name: POSITION_LABELS.AGAINST, value: displayStats.against, color: POSITION_CHART_COLORS.AGAINST },
  ];

  const barData = [
    { position: POSITION_LABELS.SUPPORT, count: displayStats.support, fill: POSITION_CHART_COLORS.SUPPORT },
    { position: POSITION_LABELS.NEUTRAL, count: displayStats.neutral, fill: POSITION_CHART_COLORS.NEUTRAL },
    { position: POSITION_LABELS.AGAINST, count: displayStats.against, fill: POSITION_CHART_COLORS.AGAINST },
  ];

  // Check if we have data to display
  const hasData = displayStats.support + displayStats.neutral + displayStats.against > 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const positionLabel = data.payload?.position || data.name;

      // Map position label to PositionStatus
      let positionStatus: 'SUPPORT' | 'NEUTRAL' | 'AGAINST' = 'SUPPORT';
      if (positionLabel === POSITION_LABELS.NEUTRAL) positionStatus = 'NEUTRAL';
      if (positionLabel === POSITION_LABELS.AGAINST) positionStatus = 'AGAINST';

      // Filter MKs by this position (FIX: use currentPosition not position)
      const mksWithPosition = allMKs.filter(mk => mk.currentPosition === positionStatus);

      // Group by faction and count
      const factionCounts = mksWithPosition.reduce((acc, mk) => {
        acc[mk.faction] = (acc[mk.faction] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Sort by count descending
      const sortedFactions = Object.entries(factionCounts)
        .sort(([, a], [, b]) => b - a);

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 sm:p-4 text-right max-w-[280px] sm:max-w-xs" dir="rtl">
          <p className="font-bold text-sm sm:text-base mb-2 sm:mb-3">{positionLabel}</p>
          <p className="font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2">נתמך על ידי:</p>
          <div className="space-y-1 sm:space-y-1.5">
            {sortedFactions.map(([faction, count]) => (
              <div key={faction} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <span className="font-medium">• {faction}</span>
                <span className="text-muted-foreground">({count} ח״כים)</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-right">תרשימים סטטיסטיים</h2>
      </div>

      {/* Chart Type Toggle */}
      <div className="flex gap-2 justify-end">
        <Button
          variant={chartType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('bar')}
          aria-label="הצג תרשים עמודות"
        >
          עמודות
        </Button>
        <Button
          variant={chartType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setChartType('pie')}
          aria-label="הצג תרשים עוגה"
        >
          עוגה
        </Button>
      </div>

      {/* Vertical Stacked Layout: Charts Top | Filters Bottom */}
      <div className="space-y-6">
        {/* Charts Section */}
        <div className="w-full space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-[300px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">טוען נתונים...</p>
                </div>
              </CardContent>
            </Card>
          ) : !hasData ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[300px] gap-4">
                <p className="text-lg font-semibold text-right">אין נתונים להצגה</p>
                <p className="text-sm text-muted-foreground text-right">
                  הסינון שבחרת לא מחזיר תוצאות
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  נקה סינון
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-right">
                  {chartType === 'pie' ? 'התפלגות עמדות לחוק ההשתמטות' : 'סטטיסטיקת עמדות'}
                </CardTitle>
                {filteredStats && (
                  <p className="text-sm text-muted-foreground text-right">
                    מציג {filteredStats.filteredTotal} מתוך 120 ח״כים
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {chartType === 'pie' ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          if (midAngle === undefined || cx === undefined || cy === undefined || outerRadius === undefined || percent === undefined) return null;
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 40;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#4b5563"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              className="font-semibold text-sm tracking-wide"
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={50}
                        iconType="circle"
                        wrapperStyle={{
                          direction: 'rtl',
                          textAlign: 'right',
                          paddingTop: '20px',
                        }}
                        iconSize={16}
                        formatter={(value: string) => (
                          <span className="text-sm font-medium" style={{
                            marginRight: '8px',
                            textShadow: '0 0 10px rgba(0, 88, 255, 0.3)',
                          }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                      data={barData}
                      margin={{
                        top: isMobile ? 10 : 20,
                        right: isMobile ? 25 : 30,
                        left: isMobile ? 10 : 30,
                        bottom: isMobile ? 50 : 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="position"
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? 'end' : 'middle'}
                        height={isMobile ? 70 : 80}
                        interval={0}
                        dx={isMobile ? 0 : 0}
                        dy={isMobile ? 0 : 0}
                        style={{
                          direction: 'rtl',
                          fontSize: isMobile ? '11px' : '14px',
                        }}
                      />
                      <YAxis
                        width={isMobile ? 40 : 60}
                        style={{
                          fontSize: isMobile ? '11px' : '14px',
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={false} />
                      <Bar dataKey="count" fill="#8884d8" radius={[8, 8, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters Section */}
        <div className="w-full">
          <ChartFilters
            availableFactions={availableFactions}
            allMKs={allMKs}
            selectedFactions={selectedFactions}
            selectedMKIds={selectedMKIds}
            onFactionChange={setSelectedFactions}
            onMKChange={setSelectedMKIds}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>
    </section>
  );
};

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
      const value = data.value || data.payload.count;
      const total = displayStats.support + displayStats.neutral + displayStats.against;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-right">
          <p className="font-semibold">{data.name || data.payload.position}</p>
          <p className="text-sm text-muted-foreground">
            {value} ({percentage}%)
          </p>
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
                  {chartType === 'pie' ? 'התפלגות עמדות' : 'סטטיסטיקת עמדות'}
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
                          if (midAngle === undefined || cx === undefined || cy === undefined || outerRadius === undefined) return null;
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={barData}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="position"
                        style={{ direction: 'rtl', textAnchor: 'end' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8884d8" label={{ position: 'right' }}>
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

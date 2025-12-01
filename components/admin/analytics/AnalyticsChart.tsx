'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type AnalyticsChartProps = {
  data: Array<{ date: string; views: number }>;
};

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        אין נתונים להצגה
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const date = payload[0].payload.date;
      const views = payload[0].value;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-right">
          <p className="text-sm text-muted-foreground">
            {format(new Date(date), 'PPP', { locale: he })}
          </p>
          <p className="font-semibold text-lg text-blue-600">
            {views.toLocaleString('he-IL')} צפיות
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: he })}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend formatter={() => 'צפיות'} />
        <Line
          type="monotone"
          dataKey="views"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

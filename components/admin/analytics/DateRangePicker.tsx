'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { DateRange } from '@/app/actions/analytics-actions';

type DateRangePickerProps = {
  currentRange: DateRange;
};

export function DateRangePicker({ currentRange }: DateRangePickerProps) {
  const router = useRouter();

  const ranges: { value: DateRange; label: string }[] = [
    { value: '7d', label: '7 ימים' },
    { value: '30d', label: '30 ימים' },
    { value: '90d', label: '90 ימים' },
  ];

  const handleRangeChange = (range: DateRange) => {
    router.push(`/admin/analytics?range=${range}`);
  };

  return (
    <div className="flex gap-2">
      {ranges.map(({ value, label }) => (
        <Button
          key={value}
          variant={currentRange === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRangeChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

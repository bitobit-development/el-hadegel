'use client';

import { MessageSquareQuote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HistoricalCommentIconProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export function HistoricalCommentIcon({
  count,
  onClick,
  className,
}: HistoricalCommentIconProps) {
  if (count === 0) return null;

  return (
    <button
      type="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative flex items-center gap-1 rounded-md px-2 py-1',
        'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900',
        'transition-colors duration-200',
        'border border-purple-200 dark:border-purple-800',
        'focus:outline-none focus:ring-2 focus:ring-purple-500',
        className
      )}
      aria-label={`${count} ציטוטים היסטוריים`}
      title={`${count} ציטוטים היסטוריים`}
    >
      <MessageSquareQuote className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
      <Badge
        variant="secondary"
        className="bg-purple-600 text-white dark:bg-purple-500 text-xs px-1.5"
      >
        {count}
      </Badge>
    </button>
  );
}

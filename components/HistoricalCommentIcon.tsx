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
        'relative flex items-center justify-center rounded-lg px-1.5 py-1 sm:px-2.5 sm:py-1.5',
        'bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/25',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        className
      )}
      aria-label={`${count} ציטוטים היסטוריים`}
      title={`${count} ציטוטים היסטוריים`}
    >
      <MessageSquareQuote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" aria-hidden="true" />
      <span className="absolute -top-1 -right-1 flex items-center justify-center bg-purple-500 text-white text-[9px] sm:text-[10px] font-semibold rounded-full min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] px-1 shadow-lg">
        {count}
      </span>
    </button>
  );
}

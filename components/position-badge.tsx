import { Badge } from '@/components/ui/badge';
import { PositionStatus, POSITION_LABELS, POSITION_COLORS } from '@/types/mk';
import { cn } from '@/lib/utils';

interface PositionBadgeProps {
  position: PositionStatus;
  showLabel?: boolean;
  className?: string;
}

export function PositionBadge({ position, showLabel = true, className }: PositionBadgeProps) {
  const colors = POSITION_COLORS[position];
  const label = POSITION_LABELS[position];

  return (
    <Badge
      className={cn(
        colors.bg,
        colors.text,
        'font-semibold border',
        colors.border,
        'hover:opacity-90',
        className
      )}
    >
      {showLabel && label}
    </Badge>
  );
}

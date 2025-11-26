'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TweetIconProps {
  tweetCount: number;
  onClick: () => void;
}

export function TweetIcon({ tweetCount, onClick }: TweetIconProps) {
  if (tweetCount === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="relative gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
      aria-label={`הצג ${tweetCount} הצהרות`}
    >
      <MessageSquare className="h-4 w-4 text-blue-600" />
      <Badge
        variant="secondary"
        className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs px-1.5"
      >
        {tweetCount}
      </Badge>
    </Button>
  );
}

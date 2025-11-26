'use client';

import { TweetCard } from '@/components/TweetCard';
import { TweetData } from '@/types/tweet';
import { MessageSquareOff } from 'lucide-react';

interface TweetsListProps {
  tweets: TweetData[];
  showMKName?: boolean;
  emptyMessage?: string;
}

export function TweetsList({
  tweets,
  showMKName = false,
  emptyMessage = 'אין הצהרות להצגה'
}: TweetsListProps) {
  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquareOff className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-medium text-muted-foreground">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-2">
          הצהרות חדשות יופיעו כאן כשיתווספו למערכת
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto px-1">
      {tweets.map((tweet) => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          showMKName={showMKName}
        />
      ))}
    </div>
  );
}

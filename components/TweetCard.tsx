'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { TweetData } from '@/types/tweet';
import { formatTweetDate, getRelativeTime, getPlatformColor } from '@/lib/tweet-utils';

interface TweetCardProps {
  tweet: TweetData;
  showMKName?: boolean;
}

export function TweetCard({ tweet, showMKName = false }: TweetCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Header: Platform badge and date */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <Badge
          className={`${getPlatformColor(tweet.sourcePlatform)} text-white`}
          variant="default"
        >
          {tweet.sourcePlatform}
        </Badge>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-muted-foreground" title={formatTweetDate(tweet.postedAt)}>
            {getRelativeTime(tweet.postedAt)}
          </span>
          {showMKName && (
            <span className="text-xs font-semibold text-foreground">
              {tweet.mkName}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-right whitespace-pre-wrap">
          {tweet.content}
        </p>

        {/* Source link */}
        {tweet.sourceUrl && (
          <a
            href={tweet.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>צפה במקור</span>
          </a>
        )}
      </div>
    </Card>
  );
}

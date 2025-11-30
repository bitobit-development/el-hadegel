'use client';

import { ExternalLink, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCommentDate, getRelativeCommentTime, getPlatformColor, getSourceTypeLabel } from '@/lib/comment-utils';
import type { HistoricalCommentData } from '@/app/actions/historical-comment-actions';

interface CommentCardProps {
  comment: HistoricalCommentData;
  showDuplicates?: boolean;
}

export function CommentCard({ comment, showDuplicates = true }: CommentCardProps) {
  const hasMultipleSources = comment.duplicates && comment.duplicates.length > 0;

  return (
    <Card className="overflow-hidden border-r-4 border-r-purple-500">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <time dateTime={comment.commentDate.toISOString()}>
                {formatCommentDate(comment.commentDate)}
              </time>
              <span aria-hidden="true">•</span>
              <span>{getRelativeCommentTime(comment.commentDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlatformBadge platform={comment.sourcePlatform} />
            <SourceTypeBadge type={comment.sourceType} />
            {comment.isVerified && (
              <span title="מאומת" aria-label="ציטוט מאומת">
                <CheckCircle
                  className="h-4 w-4 text-green-600"
                  aria-hidden="true"
                />
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-right space-y-2">
          <p className="text-base leading-relaxed">{comment.content}</p>

          {comment.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {comment.keywords.slice(0, 3).map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="text-xs bg-purple-50 border-purple-200"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Primary Source */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <a
            href={comment.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span>{comment.sourceName || 'מקור'}</span>
          </a>
          <CredibilityIndicator score={comment.sourceCredibility} />
        </div>

        {/* Additional Sources */}
        {showDuplicates && hasMultipleSources && (
          <div className="pt-2 border-t space-y-1">
            <div className="text-xs text-muted-foreground font-medium">
              מקורות נוספים ({comment.duplicates!.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {comment.duplicates!.map((dup) => (
                <a
                  key={dup.id}
                  href={dup.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  <span>{dup.sourceName || dup.sourcePlatform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Image */}
        {comment.imageUrl && (
          <div className="pt-2">
            <img
              src={comment.imageUrl}
              alt="תמונת ציטוט"
              className="rounded-md max-h-48 w-auto"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper Components
function PlatformBadge({ platform }: { platform: string }) {
  const colorClasses = getPlatformColor(platform);

  return (
    <Badge
      variant="secondary"
      className={`text-xs ${colorClasses}`}
    >
      {platform}
    </Badge>
  );
}

function SourceTypeBadge({ type }: { type: string }) {
  return type === 'Primary' ? (
    <Badge variant="default" className="text-xs bg-green-600 text-white">
      {getSourceTypeLabel(type)}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs">
      {getSourceTypeLabel(type)}
    </Badge>
  );
}

function CredibilityIndicator({ score }: { score: number }) {
  const color = score >= 8 ? 'text-green-600' : score >= 5 ? 'text-yellow-600' : 'text-orange-600';

  return (
    <div className={`text-xs font-medium ${color}`}>
      <span title={`אמינות: ${score}/10`}>
        {score}/10
      </span>
    </div>
  );
}

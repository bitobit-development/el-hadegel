'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PositionBadge } from '@/components/position-badge';
import { TweetIcon } from '@/components/TweetIcon';
import { TweetsDialog } from '@/components/TweetsDialog';
import { StatusInfoIcon } from '@/components/StatusInfoIcon';
import { HistoricalCommentIcon } from '@/components/HistoricalCommentIcon';
import { HistoricalCommentsDialog } from '@/components/historical-comments/HistoricalCommentsDialog';
import { MKDataWithCounts } from '@/types/mk';
import { ExternalLink, Phone, Mail, MessageSquare, Info } from 'lucide-react';
import { generateMKImageAlt } from '@/lib/seo-utils';

interface MKCardProps {
  mk: MKDataWithCounts;
}

export function MKCard({ mk }: MKCardProps) {
  const [isTweetsDialogOpen, setIsTweetsDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get initials from Hebrew name (first letter of first and last word)
  const getInitials = (name: string): string => {
    const words = name.trim().split(' ');
    if (words.length === 1) return name.substring(0, 2);
    return words[0][0] + words[words.length - 1][0];
  };

  const initials = getInitials(mk.nameHe);

  return (
    <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out group bg-gradient-to-r from-[#001f3f] to-[#002855] border-none transform hover:-translate-y-1 relative">
      {/* Profile Link Button - Top Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.open(mk.profileUrl, '_blank');
        }}
        className="absolute top-3 left-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 cursor-pointer group/btn"
        title={`עבור לעמוד הפרופיל של ${mk.nameHe}`}
        aria-label={`עבור לעמוד הפרופיל של ${mk.nameHe}`}
      >
        <ExternalLink className="h-4 w-4 text-white group-hover/btn:text-blue-200" />
      </button>

      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <Avatar className="h-28 w-28 ring-2 ring-white/20 group-hover:ring-white/50 transition-all duration-300">
            {mk.photoUrl && !imageError && (
              <AvatarImage
                src={mk.photoUrl}
                alt={generateMKImageAlt({
                  name: mk.nameHe,
                  faction: mk.faction,
                  position: mk.currentPosition
                } as any)}
                onError={() => setImageError(true)}
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            )}
            <AvatarFallback className="text-xl font-semibold bg-white/10 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-right leading-tight text-white">
              {mk.nameHe}
            </h3>
            <p className="text-sm text-white/80 text-right">
              {mk.faction}
            </p>
          </div>

          {/* Position Badge */}
          <PositionBadge position={mk.currentPosition} />

          {/* Icons Container - Posts, Historical Comments, and Status Info */}
          <div className="flex gap-3 items-center flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Posts Icon - Always visible */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTweetsDialogOpen(true)}
              className="gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title={
                mk.tweetCount && mk.tweetCount > 0
                  ? `${mk.tweetCount} פוסטים`
                  : 'אין פוסטים זמינים'
              }
              aria-label={
                mk.tweetCount && mk.tweetCount > 0
                  ? `לחץ לצפייה ב-${mk.tweetCount} פוסטים`
                  : 'אין פוסטים זמינים'
              }
            >
              <MessageSquare
                className={`h-4 w-4 ${
                  mk.tweetCount && mk.tweetCount > 0
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  mk.tweetCount && mk.tweetCount > 0
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {mk.tweetCount || 0}
              </span>
            </Button>

            {/* Historical Comments Icon - Only when count > 0 */}
            {mk.historicalCommentCount !== undefined && mk.historicalCommentCount > 0 && (
              <HistoricalCommentIcon
                count={mk.historicalCommentCount}
                onClick={() => setIsCommentsDialogOpen(true)}
              />
            )}

            {/* Status Info Icon - Only when count > 0 */}
            {mk.statusInfoCount !== undefined && mk.statusInfoCount > 0 && (
              <StatusInfoIcon
                mkId={mk.id}
                mkName={mk.nameHe}
                count={mk.statusInfoCount}
              />
            )}
          </div>

          {/* Contact Information */}
          {(mk.phone || mk.email) && (
            <div className="w-full mt-2 pt-4 border-t border-white/20 space-y-2">
              {mk.phone && (
                <a
                  href={`tel:${mk.phone.replace(/[\s-]/g, '')}`}
                  className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
                  dir="ltr"
                  onClick={(e) => e.stopPropagation()}
                  title={`התקשר ל${mk.nameHe}`}
                >
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span className="text-right flex-1">{mk.phone}</span>
                </a>
              )}
              {mk.email && (
                <a
                  href={`mailto:${mk.email}`}
                  className="flex items-center gap-2 text-xs text-white/80 hover:text-white transition-colors"
                  dir="ltr"
                  onClick={(e) => e.stopPropagation()}
                  title={`שלח אימייל ל${mk.nameHe}`}
                >
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="text-right flex-1 truncate">{mk.email}</span>
                </a>
              )}
            </div>
          )}

        </div>
      </CardContent>

      {/* Tweets Dialog */}
      {mk.tweetCount !== undefined && mk.tweetCount > 0 && (
        <TweetsDialog
          mkId={mk.id}
          mkName={mk.nameHe}
          isOpen={isTweetsDialogOpen}
          onClose={() => setIsTweetsDialogOpen(false)}
        />
      )}

      {/* Historical Comments Dialog */}
      {mk.historicalCommentCount !== undefined && mk.historicalCommentCount > 0 && (
        <HistoricalCommentsDialog
          mkId={mk.id}
          mkName={mk.nameHe}
          isOpen={isCommentsDialogOpen}
          onClose={() => setIsCommentsDialogOpen(false)}
        />
      )}
    </Card>
  );
}

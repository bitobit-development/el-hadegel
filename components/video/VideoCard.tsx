'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Play } from 'lucide-react';
import { VideoViewDialog } from './VideoViewDialog';
import type { VideoData } from '@/types/video';

interface VideoCardProps {
  video: VideoData;
}

export function VideoCard({ video }: VideoCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(video.dislikeCount || 0);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(video.userReaction || null);
  const [viewCount, setViewCount] = useState(video.viewCount || 0);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Card
        className="overflow-hidden group relative border border-white/10 hover:border-white/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          <div className="relative aspect-video bg-black">
            {/* Thumbnail or Video Preview */}
            <div className="relative w-full h-full">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <Play className="h-16 w-16 text-white/50" />
                </div>
              )}

              {/* Play Overlay - Visible on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-12 w-12 text-white" fill="white" />
                </div>
              </div>

              {/* Duration Badge */}
              {video.duration && (
                <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 backdrop-blur-sm">
                  {formatDuration(video.duration)}
                </Badge>
              )}

              {/* View Count Badge */}
              <Badge className="absolute top-2 left-2 bg-black/70 text-white border-0 backdrop-blur-sm flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{viewCount}</span>
              </Badge>
            </div>

            {/* Title Overlay with Glassmorphism - Always visible on bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-sm p-4">
              <h3 className="text-white font-semibold text-right line-clamp-2 mb-1">
                {video.title}
              </h3>

              {/* Description (if available) */}
              {video.description && (
                <p className="text-white/70 text-sm text-right line-clamp-1">
                  {video.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <VideoViewDialog
        video={video}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialLikeCount={likeCount}
        initialDislikeCount={dislikeCount}
        initialUserReaction={userReaction}
        initialViewCount={viewCount}
      />
    </>
  );
}

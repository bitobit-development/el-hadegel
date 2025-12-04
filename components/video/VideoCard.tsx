'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { toggleVideoLike, incrementViewCount } from '@/app/actions/video-actions';
import type { VideoData } from '@/types/video';

interface VideoCardProps {
  video: VideoData;
}

export function VideoCard({ video }: VideoCardProps) {
  const [likeCount, setLikeCount] = useState(video.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(video.dislikeCount || 0);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(video.userReaction || null);
  const [viewCount, setViewCount] = useState(video.viewCount || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasIncrementedView = useRef(false);

  const handlePlay = async () => {
    if (!hasIncrementedView.current) {
      try {
        await incrementViewCount(video.id);
        setViewCount(prev => prev + 1);
        hasIncrementedView.current = true;
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }
  };

  const handleReaction = async (isLike: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // In a real application, IP would be captured server-side
      // For now, we'll send a placeholder that the server can replace
      const ipAddress = 'client-ip'; // Server will replace with actual IP
      const result = await toggleVideoLike(video.id, isLike, ipAddress, navigator.userAgent);

      setLikeCount(result.likeCount);
      setDislikeCount(result.dislikeCount);
      setUserReaction(result.userReaction);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden group relative border border-white/10 hover:border-white/30 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={`/api/videos/${video.fileName}`}
            controls
            className="w-full h-full"
            poster={video.thumbnailUrl || undefined}
            onPlay={handlePlay}
            preload="metadata"
          />

          {/* Duration Badge */}
          {video.duration && (
            <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0">
              {formatDuration(video.duration)}
            </Badge>
          )}

          {/* Title Overlay with Glassmorphism - Shows on hover */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white font-semibold text-right line-clamp-2 mb-2">{video.title}</h3>

            {/* Description (if available) */}
            {video.description && (
              <p className="text-white/80 text-sm text-right line-clamp-1 mb-2">
                {video.description}
              </p>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between">
              {/* View Count */}
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <Eye className="h-4 w-4" />
                <span>{viewCount}</span>
              </div>

              {/* Like/Dislike Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(true)}
                  disabled={isProcessing}
                  className={`${
                    userReaction === 'like' ? 'text-green-500' : 'text-white/80'
                  } hover:text-green-500 h-8 px-2 transition-colors`}
                  aria-label="אהבתי"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="mr-1">{likeCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(false)}
                  disabled={isProcessing}
                  className={`${
                    userReaction === 'dislike' ? 'text-red-500' : 'text-white/80'
                  } hover:text-red-500 h-8 px-2 transition-colors`}
                  aria-label="לא אהבתי"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="mr-1">{dislikeCount}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

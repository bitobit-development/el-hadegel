'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThumbsUp, ThumbsDown, Eye, Clock, X, Share2, MessageCircle, Facebook, Twitter, Send, Mail, Copy } from 'lucide-react';
import { toggleVideoLike, incrementViewCount } from '@/app/actions/video-actions';
import { toast } from 'sonner';
import type { VideoData } from '@/types/video';

interface VideoViewDialogProps {
  video: VideoData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLikeCount: number;
  initialDislikeCount: number;
  initialUserReaction: 'like' | 'dislike' | null;
  initialViewCount: number;
}

export function VideoViewDialog({
  video,
  open,
  onOpenChange,
  initialLikeCount,
  initialDislikeCount,
  initialUserReaction,
  initialViewCount,
}: VideoViewDialogProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(initialUserReaction);
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasIncrementedView = useRef(false);

  // Sync with parent state when dialog opens
  useEffect(() => {
    if (open) {
      setLikeCount(initialLikeCount);
      setDislikeCount(initialDislikeCount);
      setUserReaction(initialUserReaction);
      setViewCount(initialViewCount);
      setIsLoading(true);
      hasIncrementedView.current = false;
    }
  }, [open, initialLikeCount, initialDislikeCount, initialUserReaction, initialViewCount]);

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
      const ipAddress = 'client-ip';
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

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  // Share functionality
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/#videos`;
    }
    return '';
  };

  const getShareText = () => {
    return `${video.title} - אל הדגל בפעולה`;
  };

  const copyToClipboard = async () => {
    try {
      const shareUrl = getShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      toast.success('הקישור הועתק ללוח');
      setSharePopoverOpen(false);
    } catch (error) {
      toast.error('שגיאה בהעתקת הקישור');
    }
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();

    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description || shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error('Error sharing:', error);
      }
    }
    // Fallback handled by popover menu
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(getShareText() + ' ' + getShareUrl())}`,
      color: 'hover:bg-green-500/20 hover:text-green-400',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
      color: 'hover:bg-blue-500/20 hover:text-blue-400',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`,
      color: 'hover:bg-sky-500/20 hover:text-sky-400',
    },
    {
      name: 'Telegram',
      icon: Send,
      url: `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`,
      color: 'hover:bg-cyan-500/20 hover:text-cyan-400',
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(getShareText())}&body=${encodeURIComponent(getShareUrl())}`,
      color: 'hover:bg-purple-500/20 hover:text-purple-400',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden bg-gradient-to-br from-[#001f3f] to-[#002855] border-white/20">
        {/* Custom Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 left-4 z-50 h-10 w-10 md:h-12 md:w-12 rounded-full
                     backdrop-blur-sm bg-white/10 hover:bg-white/20
                     border border-white/20 hover:border-white/30
                     flex items-center justify-center
                     transition-all duration-200 hover:scale-110
                     focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-[#001f3f]"
          aria-label="סגור"
          type="button"
        >
          <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </button>

        <div className="relative">
          {/* Video Container */}
          <div className="relative aspect-video bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white text-sm">טוען סרטון...</p>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              src={`/api/videos/${video.fileName}`}
              controls
              autoPlay
              className="w-full h-full"
              poster={video.thumbnailUrl || undefined}
              onPlay={handlePlay}
              onLoadedData={handleLoadedData}
              preload="metadata"
            />
          </div>

          {/* Video Details Section */}
          <div className="p-4 md:p-6 backdrop-blur-sm bg-white/5 border-t border-white/10">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl md:text-2xl text-white text-right">
                {video.title}
              </DialogTitle>
              {video.description && (
                <DialogDescription className="text-white/80 text-right mt-2 leading-relaxed">
                  {video.description}
                </DialogDescription>
              )}
            </DialogHeader>

            {/* Metadata and Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
                {/* View Count */}
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                >
                  <Eye className="h-3.5 w-3.5 ml-1" />
                  <span className="font-medium">{viewCount} צפיות</span>
                </Badge>

                {/* Duration */}
                {video.duration && (
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/15"
                  >
                    <Clock className="h-3.5 w-3.5 ml-1" />
                    <span className="font-medium">{formatDuration(video.duration)}</span>
                  </Badge>
                )}
              </div>

              {/* Like/Dislike/Share Actions */}
              <div className="flex items-center gap-2 md:order-first">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(true)}
                  disabled={isProcessing}
                  className={`${
                    userReaction === 'like'
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'text-white/80 hover:bg-white/10'
                  } border border-white/10 hover:border-white/20 transition-all h-9 px-3`}
                  aria-label="אהבתי"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="mr-2 font-medium">{likeCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(false)}
                  disabled={isProcessing}
                  className={`${
                    userReaction === 'dislike'
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'text-white/80 hover:bg-white/10'
                  } border border-white/10 hover:border-white/20 transition-all h-9 px-3`}
                  aria-label="לא אהבתי"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="mr-2 font-medium">{dislikeCount}</span>
                </Button>

                {/* Share Button */}
                <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      className="text-white/80 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all h-9 px-3"
                      aria-label="שתף"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="mr-2 font-medium">שתף</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-2">
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 text-sm font-semibold text-white border-b border-white/10 mb-2">
                        שתף סרטון
                      </div>
                      {shareOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <a
                            key={option.name}
                            href={option.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/90 transition-all ${option.color} border border-transparent hover:border-white/10`}
                            onClick={() => setSharePopoverOpen(false)}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span>{option.name}</span>
                          </a>
                        );
                      })}
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/90 transition-all hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 w-full text-right"
                      >
                        <Copy className="h-4 w-4 flex-shrink-0" />
                        <span>העתק קישור</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

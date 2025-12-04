'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Video } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { getPublishedVideos } from '@/app/actions/video-actions';
import type { VideoData } from '@/types/video';

const REFRESH_INTERVAL = 60000; // 60 seconds

export function VideoSection() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch videos function
  const fetchVideos = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const data = await getPublishedVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
      if (showLoader) setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchVideos();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVideos();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-[#001f3f] to-[#002855] border-white/20 shadow-xl">
      <CardHeader className="pb-3 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white text-right flex items-center gap-2">
            <Video className="h-6 w-6" />
            סרטוני וידאו
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchVideos(true)}
            disabled={isRefreshing}
            className="gap-2 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>רענן</span>
          </Button>
        </div>
        <p className="text-sm text-white/80 text-right mt-1">
          צפו בסרטונים אחרונים על חוק הגיוס
        </p>
      </CardHeader>
      <CardContent className="backdrop-blur-sm bg-white/5">
        {isLoading ? (
          <div className="text-center py-8 text-white/60">
            טוען סרטונים...
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            אין סרטונים זמינים כרגע
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
            <p className="text-xs text-white/60 text-center mt-4">
              מציג {videos.length} סרטונים • רענון אוטומטי כל 60 שניות
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

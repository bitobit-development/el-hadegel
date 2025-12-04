'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { getPublishedVideos } from '@/app/actions/video-actions';
import type { VideoData } from '@/types/video';

const REFRESH_INTERVAL = 60000; // 60 seconds
const AUTO_ROTATION_INTERVAL = 5000; // 5 seconds
const VIDEOS_PER_PAGE_DESKTOP = 3;
const VIDEOS_PER_PAGE_TABLET = 2;
const VIDEOS_PER_PAGE_MOBILE = 1;

export function VideoSection() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [videosPerPage, setVideosPerPage] = useState(VIDEOS_PER_PAGE_DESKTOP);

  // Fetch videos function
  const fetchVideos = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const data = await getPublishedVideos();
      setVideos(data);
      // Reset to first page when videos update
      setCurrentPage(0);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
      if (showLoader) setIsRefreshing(false);
    }
  };

  // Calculate videos per page based on window width
  useEffect(() => {
    const updateVideosPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setVideosPerPage(VIDEOS_PER_PAGE_MOBILE);
      } else if (width < 1024) {
        setVideosPerPage(VIDEOS_PER_PAGE_TABLET);
      } else {
        setVideosPerPage(VIDEOS_PER_PAGE_DESKTOP);
      }
    };

    updateVideosPerPage();
    window.addEventListener('resize', updateVideosPerPage);
    return () => window.removeEventListener('resize', updateVideosPerPage);
  }, []);

  // Calculate total pages
  const totalPages = Math.ceil(videos.length / videosPerPage);

  // Get current visible videos
  const getCurrentVideos = useCallback(() => {
    const startIndex = currentPage * videosPerPage;
    return videos.slice(startIndex, startIndex + videosPerPage);
  }, [videos, currentPage, videosPerPage]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const handlePrevious = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentPage(index);
  }, []);

  // Auto-rotation effect
  useEffect(() => {
    if (isPaused || totalPages <= 1 || isLoading) return;

    const interval = setInterval(() => {
      handleNext();
    }, AUTO_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isPaused, totalPages, isLoading, handleNext]);

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

  const visibleVideos = getCurrentVideos();
  const showControls = videos.length > videosPerPage;

  return (
    <Card className="bg-gradient-to-r from-[#001f3f] to-[#002855] border-white/20 shadow-xl">
      <CardHeader className="pb-3 backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white text-right flex items-center gap-2">
            <Video className="h-6 w-6" />
            אל הדגל בפעולה
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
          צפו בפעילות התנועה למען גיוס שווה לכולם
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
            {/* Carousel Container */}
            <div
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Navigation Arrows */}
              {showControls && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gradient-to-r from-[#001f3f] to-[#002855] backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 hover:border-white/40 hover:brightness-125"
                    aria-label="סרטון קודם"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gradient-to-r from-[#001f3f] to-[#002855] backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 hover:border-white/40 hover:brightness-125"
                    aria-label="סרטון הבא"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Videos Grid with Animation */}
              <div className="overflow-hidden px-14">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-500 ease-in-out"
                  style={{
                    opacity: 1,
                    transform: 'translateX(0)',
                  }}
                  key={currentPage}
                >
                  {visibleVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className="animate-fadeIn"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <VideoCard video={video} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dots Indicator */}
            {showControls && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentPage
                        ? 'bg-white scale-125 shadow-lg'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`עבור לעמוד ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Info Text */}
            <p className="text-xs text-white/60 text-center mt-4">
              מציג {videos.length} סרטונים
              {showControls && ` • עמוד ${currentPage + 1} מתוך ${totalPages}`}
              {' • '}רענון אוטומטי כל 60 שניות
              {showControls && isPaused && ' • מושהה'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

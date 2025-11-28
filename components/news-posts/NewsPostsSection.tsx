'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import NewsPostsList from './NewsPostsList';
import { NewsPostData } from '@/types/news';
import { getLatestNewsPosts } from '@/app/actions/news-actions';
import { NEWS_POST_CONSTRAINTS } from '@/types/news';

const REFRESH_INTERVAL = 60000; // 60 seconds

export default function NewsPostsSection() {
  const [posts, setPosts] = useState<NewsPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch posts function
  const fetchPosts = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const latestPosts = await getLatestNewsPosts(NEWS_POST_CONSTRAINTS.MAX_POSTS_DISPLAY);
      setPosts(latestPosts);
    } catch (error) {
      console.error('Error fetching news posts:', error);
    } finally {
      setIsLoading(false);
      if (showLoader) setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-right">
            📰 חדשות אחרונות
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPosts(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>רענן</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground text-right mt-1">
          עדכונים אחרונים על חוק הגיוס
        </p>
      </CardHeader>
      <CardContent>
        <NewsPostsList posts={posts} isLoading={isLoading} />
        {posts.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            מציג עד {NEWS_POST_CONSTRAINTS.MAX_POSTS_DISPLAY} חדשות אחרונות • רענון אוטומטי כל 60 שניות
          </p>
        )}
      </CardContent>
    </Card>
  );
}

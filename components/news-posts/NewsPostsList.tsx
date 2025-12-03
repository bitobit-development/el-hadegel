'use client';

import { NewsPostData } from '@/types/news';
import NewsPostCard from './NewsPostCard';
import { Newspaper } from 'lucide-react';

interface NewsPostsListProps {
  posts: NewsPostData[];
  isLoading?: boolean;
}

export default function NewsPostsList({ posts, isLoading }: NewsPostsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground text-sm">טוען חדשות...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
        <Newspaper className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">אין חדשות זמינות כרגע</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden max-h-[800px]">
      {/* Auto-scroll container with duplicated posts for seamless loop */}
      <div className="animate-vertical-scroll space-y-4 px-1">
        {/* Original posts */}
        {posts.map((post) => (
          <NewsPostCard key={post.id} post={post} />
        ))}
        {/* Duplicate posts for infinite loop */}
        {posts.map((post) => (
          <NewsPostCard key={`duplicate-${post.id}`} post={post} />
        ))}
      </div>

      {/* Fade gradients for visual polish - top and bottom */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none z-10" />
    </div>
  );
}

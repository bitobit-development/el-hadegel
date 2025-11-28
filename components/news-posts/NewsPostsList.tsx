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
    <div className="space-y-4 max-h-[800px] overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
      {posts.map((post) => (
        <NewsPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

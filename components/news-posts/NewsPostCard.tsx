'use client';

import { useState } from 'react';
import Image from 'next/image';
import { NewsPostData } from '@/types/news';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { getRelativeNewsTime, truncateNewsContent, getUrlDomain, getPlatformIcon } from '@/lib/news-utils';

interface NewsPostCardProps {
  post: NewsPostData;
  maxContentLength?: number;
}

export default function NewsPostCard({ post, maxContentLength = 200 }: NewsPostCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasPreview = post.previewImage && !imageError;

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-r-4 border-r-blue-500">
      <CardContent className="p-4">
        {/* Horizontal Layout: Image on Left, Content on Right */}
        <div className="flex gap-3 sm:gap-4 items-start">
          {/* Preview Image (Passport Photo Size - Left Side) */}
          {hasPreview && (
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted border">
                <Image
                  src={post.previewImage!}
                  alt={post.previewTitle || 'Preview'}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized={!post.previewImage!.startsWith('/')}
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Content Area (Right Side) */}
          <div className="flex-1 min-w-0 space-y-2 overflow-hidden pr-1 sm:pr-0">
            {/* Preview Title (if available) */}
            {post.previewTitle && (
              <h3 className="text-base font-bold text-right leading-tight text-foreground">
                {post.previewTitle}
              </h3>
            )}

            {/* User Content */}
            <p className="text-sm text-right leading-relaxed text-foreground">
              {truncateNewsContent(post.content, maxContentLength)}
            </p>

            {/* Preview Description (optional) */}
            {post.previewDescription && (
              <p className="text-xs text-muted-foreground text-right leading-relaxed">
                {truncateNewsContent(post.previewDescription, 150)}
              </p>
            )}

            {/* Footer: Source and Time */}
            <div className="flex items-center justify-between pt-2 border-t text-xs">
              <div className="flex items-center gap-2">
                {post.sourceName && (
                  <Badge variant="secondary" className="text-xs">
                    {post.sourceName}
                  </Badge>
                )}
                {post.previewSiteName && !post.sourceName && (
                  <Badge variant="outline" className="text-xs">
                    {post.previewSiteName}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {getRelativeNewsTime(post.postedAt)}
                </span>
              </div>

              {/* Source Link */}
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <span className="text-xs">{getPlatformIcon(post.sourceUrl)}</span>
                <span className="text-xs">{getUrlDomain(post.sourceUrl)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

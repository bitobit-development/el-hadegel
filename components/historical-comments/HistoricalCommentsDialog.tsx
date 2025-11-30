'use client';

import { useState, useEffect } from 'react';
import { MessageSquareQuote, Loader2, Calendar, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommentCard } from './CommentCard';
import { getMKHistoricalComments } from '@/app/actions/historical-comment-actions';
import type { HistoricalCommentData } from '@/app/actions/historical-comment-actions';

interface HistoricalCommentsDialogProps {
  mkId: number;
  mkName: string;
  isOpen: boolean;
  onClose: () => void;
}

type PlatformFilter = 'all' | 'News' | 'Twitter' | 'Facebook' | 'YouTube' | 'Knesset' | 'Interview';
type SortOption = 'date-desc' | 'date-asc' | 'credibility';

export function HistoricalCommentsDialog({
  mkId,
  mkName,
  isOpen,
  onClose,
}: HistoricalCommentsDialogProps) {
  const [comments, setComments] = useState<HistoricalCommentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments();
    }
  }, [isOpen]);

  async function loadComments() {
    setIsLoading(true);
    try {
      const data = await getMKHistoricalComments(mkId, 100);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredComments = comments
    .filter((c) => platformFilter === 'all' || c.sourcePlatform === platformFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.commentDate).getTime() - new Date(a.commentDate).getTime();
        case 'date-asc':
          return new Date(a.commentDate).getTime() - new Date(b.commentDate).getTime();
        case 'credibility':
          return b.sourceCredibility - a.sourceCredibility;
        default:
          return 0;
      }
    });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0" dir="rtl">
        <DialogHeader className="p-6 pb-3 border-b">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-purple-600" aria-hidden="true" />
            <DialogTitle className="text-xl text-right">
              ציטוטים היסטוריים - {mkName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-right">
            כל האמירות והתגובות על חוק הגיוס לצה״ל
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select
                value={platformFilter}
                onValueChange={(v) => setPlatformFilter(v as PlatformFilter)}
              >
                <SelectTrigger className="w-[150px]" aria-label="סינון לפי מקור">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המקורות</SelectItem>
                  <SelectItem value="News">חדשות</SelectItem>
                  <SelectItem value="Twitter">X (Twitter)</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="Knesset">כנסת</SelectItem>
                  <SelectItem value="Interview">ראיונות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="w-[150px]" aria-label="מיון">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">חדש לישן</SelectItem>
                  <SelectItem value="date-asc">ישן לחדש</SelectItem>
                  <SelectItem value="credibility">אמינות גבוהה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mr-auto text-sm text-muted-foreground">
              {filteredComments.length} ציטוטים
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">טוען ציטוטים...</p>
              </div>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquareQuote className="h-12 w-12 text-muted-foreground mb-3" aria-hidden="true" />
              <p className="text-muted-foreground">
                {platformFilter === 'all'
                  ? 'אין ציטוטים היסטוריים'
                  : `אין ציטוטים ממקור ${platformFilter}`}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {filteredComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

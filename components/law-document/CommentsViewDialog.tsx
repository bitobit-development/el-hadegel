'use client';

import { useState, useEffect } from 'react';
import { getParagraphComments } from '@/app/actions/law-comment-actions';
import type { ApprovedComment } from '@/types/law-comment';
import { CommentCard } from './CommentCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentsViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paragraphId: number;
  paragraphOrderIndex: number;
  paragraphSectionTitle?: string | null;
}

export function CommentsViewDialog({
  open,
  onOpenChange,
  paragraphId,
  paragraphOrderIndex,
  paragraphSectionTitle
}: CommentsViewDialogProps) {
  const [comments, setComments] = useState<ApprovedComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy load comments when dialog opens
  useEffect(() => {
    if (!open) {
      // Clear state when dialog closes (memory management)
      setComments([]);
      setError(null);
      return;
    }

    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getParagraphComments(paragraphId, 50);
        setComments(data);
      } catch (err) {
        console.error('Error loading comments:', err);
        setError('שגיאה בטעינת התגובות. נסה שוב מאוחר יותר.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [open, paragraphId]);

  // Build title based on section title availability
  const dialogTitle = paragraphSectionTitle
    ? `תגובות על סעיף ${paragraphOrderIndex}: ${paragraphSectionTitle}`
    : `תגובות על סעיף ${paragraphOrderIndex}`;

  // Add comment count to title if comments are loaded
  const titleWithCount = !isLoading && comments.length > 0
    ? `${dialogTitle} (${comments.length} תגובות)`
    : dialogTitle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        aria-labelledby="comments-dialog-title"
        aria-describedby="comments-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="comments-dialog-title" className="text-right">
            {titleWithCount}
          </DialogTitle>
          <DialogDescription id="comments-dialog-description" className="text-right">
            תגובות מאושרות על פסקה זו
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-1"
          role="region"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-32 animate-pulse"
                  aria-hidden="true"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 text-lg mb-4">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  // Trigger re-fetch by toggling dialog
                  onOpenChange(false);
                  setTimeout(() => onOpenChange(true), 100);
                }}
              >
                נסה שוב
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && comments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                אין תגובות מאושרות עדיין
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                היה/י הראשון/נה להגיב!
              </p>
            </div>
          )}

          {/* Comments List */}
          {!isLoading && !error && comments.length > 0 && (
            <div
              className="space-y-4 py-4"
              role="list"
              aria-label={`${comments.length} תגובות מאושרות`}
            >
              {comments.map((comment) => (
                <div key={comment.id} role="listitem">
                  <CommentCard comment={comment} />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            {/* Comment count in footer for better visibility */}
            {!isLoading && !error && comments.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                סה״כ {comments.length} תגובות
              </span>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              className={cn(
                "min-w-[100px]",
                (!isLoading && !error && comments.length > 0) ? "" : "mr-auto"
              )}
              autoFocus={!isLoading}
            >
              סגור
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
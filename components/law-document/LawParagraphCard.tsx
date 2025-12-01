'use client';

import { LawParagraphWithCount } from '@/types/law-comment';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CommentsViewDialog } from './CommentsViewDialog';
import { CommentSubmissionDialog } from './CommentSubmissionDialog';

interface Props {
  paragraph: LawParagraphWithCount;
}

export function LawParagraphCard({ paragraph }: Props) {
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  const handleViewComments = () => {
    setShowCommentsDialog(true);
  };

  const handleAddComment = () => {
    setShowSubmissionDialog(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <article
      id={`paragraph-${paragraph.orderIndex}`}
      className="mb-8 pb-8 border-b border-gray-200 last:border-0 relative group"
      onMouseEnter={() => setShowCommentButton(true)}
      onMouseLeave={() => setShowCommentButton(false)}
    >
      {/* Section Title (if exists) */}
      {paragraph.sectionTitle && (
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 leading-tight">
          {paragraph.orderIndex}. {paragraph.sectionTitle}
        </h2>
      )}

      {/* Paragraph Content */}
      <div className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
        {paragraph.content}
      </div>

      {/* Comment Badge (top-right corner in RTL = top-left in CSS) */}
      {paragraph.commentCount > 0 && (
        <button
          onClick={handleViewComments}
          onKeyDown={(e) => handleKeyDown(e, handleViewComments)}
          className={cn(
            'absolute top-0 left-0 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold',
            'hover:bg-blue-700 transition-colors',
            'flex items-center gap-1.5',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'no-print'
          )}
          aria-label={`${paragraph.commentCount} תגובות מאושרות לפסקה ${paragraph.orderIndex}`}
          tabIndex={0}
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          <span>{paragraph.commentCount}</span>
        </button>
      )}

      {/* Add Comment Button (appears on hover, center-bottom) */}
      <button
        onClick={handleAddComment}
        onKeyDown={(e) => handleKeyDown(e, handleAddComment)}
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2',
          'bg-gray-900 text-white px-4 py-2 rounded-lg text-sm',
          'hover:bg-gray-800 transition-all',
          'opacity-0 group-hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
          'focus:opacity-100',
          'no-print'
        )}
        aria-label={`הוסף תגובה לפסקה ${paragraph.orderIndex}`}
        tabIndex={0}
      >
        הוסף תגובה
      </button>

      {/* Comments View Dialog */}
      <CommentsViewDialog
        open={showCommentsDialog}
        onOpenChange={setShowCommentsDialog}
        paragraphId={paragraph.id}
        paragraphOrderIndex={paragraph.orderIndex}
        paragraphSectionTitle={paragraph.sectionTitle}
      />

      {/* Comment Submission Dialog */}
      <CommentSubmissionDialog
        open={showSubmissionDialog}
        onOpenChange={setShowSubmissionDialog}
        paragraphId={paragraph.id}
        paragraphOrderIndex={paragraph.orderIndex}
        paragraphSectionTitle={paragraph.sectionTitle}
      />
    </article>
  );
}

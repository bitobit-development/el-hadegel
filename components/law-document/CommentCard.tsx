import { ApprovedComment } from '@/types/law-comment';
import { getRelativeCommentTime } from '@/lib/law-comment-utils';
import { cn } from '@/lib/utils';

interface Props {
  comment: ApprovedComment;
  className?: string;
}

export function CommentCard({ comment, className }: Props) {
  return (
    <div className={cn('bg-gray-50 rounded-lg p-4 border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-gray-900">
          {comment.firstName} {comment.lastName}
        </div>
        <div className="text-sm text-gray-500">
          {getRelativeCommentTime(comment.submittedAt)}
        </div>
      </div>

      {/* Comment Content */}
      <div className="text-gray-700 whitespace-pre-wrap break-words mb-3 leading-relaxed">
        {comment.commentContent}
      </div>

      {/* Suggested Edit (if exists) */}
      {comment.suggestedEdit && (
        <div className="bg-blue-50 border-r-4 border-blue-500 p-3 rounded">
          <div className="text-xs font-semibold text-blue-700 mb-1">
            הצעת עריכה:
          </div>
          <div className="text-sm text-blue-900 whitespace-pre-wrap break-words leading-relaxed">
            {comment.suggestedEdit}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  approveComment,
  rejectComment,
  markCommentAsSpam,
  deleteComment,
} from '@/app/actions/law-comment-actions';
import type { LawCommentData } from '@/types/law-comment';
import { COMMENT_STATUS_LABELS, COMMENT_STATUS_COLORS } from '@/types/law-comment';
import {
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  Edit3,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommentDetailDialogProps {
  comment: LawCommentData;
  adminId: number;
  onClose: () => void;
  onAction: () => void;
}

export function CommentDetailDialog({
  comment,
  adminId,
  onClose,
  onAction,
}: CommentDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveComment(comment.id, adminId);
      if (result.success) {
        toast.success(result.message || 'התגובה אושרה');
        onAction();
      } else {
        toast.error(result.error || 'שגיאה באישור התגובה');
      }
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('שגיאה באישור התגובה');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const result = await rejectComment(comment.id, adminId, rejectionReason || undefined);
      if (result.success) {
        toast.success(result.message || 'התגובה נדחתה');
        onAction();
      } else {
        toast.error(result.error || 'שגיאה בדחיית התגובה');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('שגיאה בדחיית התגובה');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSpam = async () => {
    if (!confirm('האם לסמן תגובה זו כספאם?')) return;

    setLoading(true);
    try {
      const result = await markCommentAsSpam(comment.id, adminId);
      if (result.success) {
        toast.success(result.message || 'התגובה סומנה כספאם');
        onAction();
      } else {
        toast.error(result.error || 'שגיאה בסימון התגובה');
      }
    } catch (error) {
      console.error('Error marking as spam:', error);
      toast.error('שגיאה בסימון התגובה כספאם');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם למחוק תגובה זו לצמיתות? פעולה זו לא ניתנת לביטול!')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteComment(comment.id);
      if (result.success) {
        toast.success(result.message || 'התגובה נמחקה');
        onAction();
      } else {
        toast.error(result.error || 'שגיאה במחיקת התגובה');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('שגיאה במחיקת התגובה');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>פרטי תגובה #{comment.id}</span>
            <Badge variant="outline" className={COMMENT_STATUS_COLORS[comment.status]}>
              {COMMENT_STATUS_LABELS[comment.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pl-4">
          <div className="space-y-6">
            {/* Paragraph Context */}
            {comment.paragraph && (
              <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-900 font-medium">
                  <FileText className="h-4 w-4" />
                  {comment.paragraph.sectionTitle ||
                    `סעיף ${comment.paragraph.orderIndex + 1}`}
                </div>
                <div className="text-sm text-blue-800 pr-6">
                  {comment.paragraph.content.substring(0, 200)}
                  {comment.paragraph.content.length > 200 && '...'}
                </div>
                {comment.paragraph.document && (
                  <div className="text-xs text-blue-600 pr-6">
                    {comment.paragraph.document.title} (גרסה {comment.paragraph.document.version})
                  </div>
                )}
              </div>
            )}

            {/* Commenter Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                פרטי המגיב
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">שם מלא</Label>
                  <div className="text-sm font-medium">
                    {comment.firstName} {comment.lastName}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    אימייל
                  </Label>
                  <div className="text-sm">
                    <a
                      href={`mailto:${comment.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {comment.email}
                    </a>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    טלפון
                  </Label>
                  <div className="text-sm" dir="ltr">
                    {comment.phoneNumber}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    תאריך שליחה
                  </Label>
                  <div className="text-sm">{formatDate(comment.submittedAt)}</div>
                </div>
              </div>
            </div>

            {/* Comment Content */}
            <div className="space-y-2">
              <Label className="font-semibold text-gray-900">תוכן התגובה</Label>
              <div className="p-4 bg-gray-50 border rounded-lg text-sm whitespace-pre-wrap">
                {comment.commentContent}
              </div>
            </div>

            {/* Suggested Edit */}
            {comment.suggestedEdit && (
              <div className="space-y-2">
                <Label className="font-semibold text-gray-900 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  הצעה לתיקון
                </Label>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm whitespace-pre-wrap">
                  {comment.suggestedEdit}
                </div>
              </div>
            )}

            {/* Moderation Info */}
            {comment.moderatedBy && comment.moderatedAt && comment.moderator && (
              <div className="space-y-2 p-4 bg-gray-50 border rounded-lg">
                <Label className="font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  פרטי אישור/דחייה
                </Label>
                <div className="space-y-1 text-sm pr-6">
                  <div>
                    <span className="text-gray-600">מנהל:</span>{' '}
                    <span className="font-medium">{comment.moderator.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">תאריך:</span>{' '}
                    {formatDate(comment.moderatedAt)}
                  </div>
                  {comment.moderationNote && (
                    <div>
                      <span className="text-gray-600">הערה:</span>{' '}
                      {comment.moderationNote}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Info */}
            <div className="space-y-2 p-4 bg-gray-50 border rounded-lg">
              <Label className="font-semibold text-gray-900">מידע טכני</Label>
              <div className="space-y-1 text-xs text-gray-600 pr-6">
                {comment.ipAddress && (
                  <div>
                    <span>IP:</span> <code className="bg-white px-1">{comment.ipAddress}</code>
                  </div>
                )}
                {comment.userAgent && (
                  <div>
                    <span>User Agent:</span>{' '}
                    <code className="bg-white px-1 break-all">{comment.userAgent}</code>
                  </div>
                )}
                <div>
                  <span>תאריך עדכון אחרון:</span> {formatDate(comment.updatedAt)}
                </div>
              </div>
            </div>

            {/* Rejection Reason Input (if showing) */}
            {showRejectionInput && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">סיבת דחייה (אופציונלי)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="הזן סיבה לדחייה..."
                  className="text-right"
                  rows={3}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <div className="flex gap-2 w-full justify-between">
            {/* Action Buttons (Left Side) */}
            <div className="flex gap-2">
              {comment.status === 'PENDING' && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 ml-2" />
                    אשר תגובה
                  </Button>
                  {!showRejectionInput ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectionInput(true)}
                      disabled={loading}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      דחה תגובה
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReject}
                      disabled={loading}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      אשר דחייה
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsSpam}
                disabled={loading}
                className="text-gray-600 hover:bg-gray-50"
              >
                <AlertTriangle className="h-4 w-4 ml-2" />
                סמן ספאם
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                מחק
              </Button>
            </div>

            {/* Close Button (Right Side) */}
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              סגור
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

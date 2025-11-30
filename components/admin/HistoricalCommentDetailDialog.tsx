'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquareQuote,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
  Calendar,
  User,
  Building2,
  Link2,
  Image as ImageIcon,
  Video,
  AlertTriangle,
} from 'lucide-react';
import {
  formatCommentDate,
  getRelativeCommentTime,
  getPlatformColor,
  getSourceTypeLabel,
  getCredibilityInfo,
} from '@/lib/comment-utils';
import {
  verifyHistoricalCommentAdmin,
  getHistoricalCommentDetails,
} from '@/app/actions/admin-historical-comment-actions';
import { deleteHistoricalComment } from '@/app/actions/historical-comment-actions';
import { useRouter } from 'next/navigation';
import type { HistoricalCommentData } from '@/app/actions/historical-comment-actions';

interface HistoricalCommentDetailDialogProps {
  comment: HistoricalCommentData & { mkName?: string; mkFaction?: string };
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function HistoricalCommentDetailDialog({
  comment: initialComment,
  isOpen,
  onClose,
  onUpdate,
}: HistoricalCommentDetailDialogProps) {
  const router = useRouter();
  const [comment, setComment] = useState(initialComment);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const credibilityInfo = getCredibilityInfo(comment.sourceCredibility);

  const handleVerify = async (verified: boolean) => {
    setIsVerifying(true);
    try {
      const success = await verifyHistoricalCommentAdmin(comment.id, verified);
      if (success) {
        setComment({ ...comment, isVerified: verified });
        onUpdate?.();
        router.refresh();
      } else {
        alert('אירעה שגיאה בעדכון סטטוס האימות');
      }
    } catch (error) {
      console.error('Error verifying comment:', error);
      alert('אירעה שגיאה בעדכון סטטוס האימות');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteHistoricalComment(comment.id);
      if (success) {
        onUpdate?.();
        router.refresh();
        onClose();
      } else {
        alert('אירעה שגיאה במחיקת הציטוט');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('אירעה שגיאה במחיקת הציטוט');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir="rtl">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-l from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <MessageSquareQuote className="h-6 w-6 text-purple-600" aria-hidden="true" />
            <div className="flex-1">
              <DialogTitle className="text-xl text-right">
                פרטי ציטוט מלאים
              </DialogTitle>
              <DialogDescription className="text-right">
                מידע מפורט על הציטוט ההיסטורי
              </DialogDescription>
            </div>
            {comment.isVerified ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6 py-6">
            {/* MK Information */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium">חבר כנסת</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{comment.mkName}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" aria-hidden="true" />
                  <span>{comment.mkFaction}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">תוכן הציטוט:</div>
              <div className="bg-white border rounded-lg p-4 text-right leading-relaxed">
                {comment.content}
              </div>
            </div>

            {/* Keywords */}
            {comment.keywords.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">מילות מפתח:</div>
                <div className="flex flex-wrap gap-2">
                  {comment.keywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="outline"
                      className="bg-purple-50 border-purple-200 text-purple-800"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Source Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">פלטפורמה:</div>
                <Badge variant="secondary" className={getPlatformColor(comment.sourcePlatform)}>
                  {comment.sourcePlatform}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">סוג מקור:</div>
                <Badge
                  variant={comment.sourceType === 'Primary' ? 'default' : 'outline'}
                  className={comment.sourceType === 'Primary' ? 'bg-green-600' : ''}
                >
                  {getSourceTypeLabel(comment.sourceType)}
                </Badge>
              </div>
            </div>

            {/* Source URL and Name */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">מקור:</div>
              <a
                href={comment.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span>{comment.sourceName || comment.sourceUrl}</span>
              </a>
            </div>

            {/* Credibility */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">רמת אמינות:</div>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${credibilityInfo.color}`}>
                    {comment.sourceCredibility}/10
                  </div>
                  <Badge variant="outline" className={credibilityInfo.color}>
                    {credibilityInfo.label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">סטטוס אימות:</div>
                <div className="flex items-center gap-2">
                  {comment.isVerified ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-medium">מאומת</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-600 font-medium">ממתין לאימות</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  תאריך הציטוט:
                </div>
                <div className="text-sm">
                  <div className="font-medium">{formatCommentDate(comment.commentDate)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getRelativeCommentTime(comment.commentDate)}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  תאריך פרסום:
                </div>
                <div className="text-sm">
                  <div className="font-medium">{formatCommentDate(comment.publishedAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getRelativeCommentTime(comment.publishedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Media */}
            {(comment.imageUrl || comment.videoUrl) && (
              <div className="space-y-3">
                {comment.imageUrl && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      תמונה:
                    </div>
                    <a
                      href={comment.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {comment.imageUrl}
                    </a>
                  </div>
                )}
                {comment.videoUrl && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      וידאו:
                    </div>
                    <a
                      href={comment.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {comment.videoUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Duplicates Information */}
            {comment.duplicateOf && (comment as any).primaryComment && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>ציטוט כפול</span>
                </div>
                <div className="text-sm text-amber-700">
                  ציטוט זה סומן כשכפול של ציטוט ראשי אחר:
                </div>
                <a
                  href={(comment as any).primaryComment.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Link2 className="h-3 w-3" />
                  {(comment as any).primaryComment.sourceName || 'ציטוט ראשי'}
                </a>
              </div>
            )}

            {comment.duplicates && comment.duplicates.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <Link2 className="h-4 w-4" />
                  <span>מקורות נוספים ({comment.duplicates.length})</span>
                </div>
                <div className="text-sm text-blue-700 mb-2">
                  ציטוט זה נמצא גם במקורות הבאים:
                </div>
                <div className="space-y-2">
                  {comment.duplicates.map((dup) => (
                    <a
                      key={dup.id}
                      href={dup.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{dup.sourceName || dup.sourcePlatform}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatCommentDate(dup.publishedAt)})
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/30">
          <div className="flex gap-2 w-full justify-between">
            <div className="flex gap-2">
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  מחק
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    {isDeleting ? 'מוחק...' : 'אישור מחיקה'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    ביטול
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {comment.isVerified ? (
                <Button
                  variant="outline"
                  onClick={() => handleVerify(false)}
                  disabled={isVerifying}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isVerifying ? 'מעדכן...' : 'בטל אימות'}
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => handleVerify(true)}
                  disabled={isVerifying}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isVerifying ? 'מעדכן...' : 'אמת ציטוט'}
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                סגור
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

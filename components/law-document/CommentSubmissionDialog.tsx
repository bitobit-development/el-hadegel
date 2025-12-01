'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitLawComment } from '@/app/actions/law-comment-actions';
import { commentSubmissionSchema } from '@/lib/validation/law-comment-validation';
import type { CommentSubmissionData } from '@/types/law-comment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommentSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paragraphId: number;
  paragraphOrderIndex: number;
  paragraphSectionTitle?: string | null;
}

export function CommentSubmissionDialog({
  open,
  onOpenChange,
  paragraphId,
  paragraphOrderIndex,
  paragraphSectionTitle,
}: CommentSubmissionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
    setFocus,
  } = useForm<CommentSubmissionData>({
    resolver: zodResolver(commentSubmissionSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      commentContent: '',
      suggestedEdit: '',
      paragraphId,
    },
  });

  // Watch character counts for textareas
  const commentContent = watch('commentContent', '');
  const suggestedEdit = watch('suggestedEdit', '');

  // Focus first field when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        setFocus('firstName');
      }, 100);
      // Clear server error when dialog opens
      setServerError(null);
    }
  }, [open, setFocus]);

  const onSubmit = async (data: CommentSubmissionData) => {
    try {
      setServerError(null);

      // Include paragraphId in the submission
      const submissionData = {
        ...data,
        paragraphId,
      };

      const result = await submitLawComment(submissionData);

      if (result.success) {
        // Show success toast
        toast.success('התגובה נשלחה בהצלחה! היא תופיע לאחר אישור המנהל', {
          duration: 3000,
        });

        // Reset form
        reset();

        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        // Handle different error types
        setServerError(result.error || 'אירעה שגיאה בשליחת התגובה');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setServerError('אירעה שגיאה בשליחת התגובה. נא לנסות שוב.');
    }
  };

  const getCharacterCountColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-gray-500';
  };

  // Dialog title
  const dialogTitle = paragraphSectionTitle
    ? `תגובה על סעיף ${paragraphOrderIndex}: ${paragraphSectionTitle}`
    : `תגובה על סעיף ${paragraphOrderIndex}`;

  return (
    <Dialog open={open} onOpenChange={(open) => !isSubmitting && onOpenChange(open)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-right">
            התגובה תופיע באתר לאחר אישור המנהל
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Server error alert */}
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">שם פרטי</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              disabled={isSubmitting}
              className={cn(errors.firstName && 'border-red-500')}
              dir="rtl"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600" aria-live="polite">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">שם משפחה</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              disabled={isSubmitting}
              className={cn(errors.lastName && 'border-red-500')}
              dir="rtl"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600" aria-live="polite">
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">כתובת אימייל</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              disabled={isSubmitting}
              className={cn(errors.email && 'border-red-500')}
              dir="ltr"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600" aria-live="polite">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">מספר טלפון</Label>
            <Input
              id="phoneNumber"
              {...register('phoneNumber')}
              disabled={isSubmitting}
              className={cn(errors.phoneNumber && 'border-red-500')}
              dir="ltr"
              placeholder="050-1234567"
            />
            <p className="text-xs text-gray-500">
              פורמטים מקובלים: 050-1234567, 0501234567, +972-50-1234567
            </p>
            {errors.phoneNumber && (
              <p className="text-sm text-red-600" aria-live="polite">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Comment Content */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="commentContent">תוכן התגובה *</Label>
              <span
                className={cn(
                  'text-xs',
                  getCharacterCountColor(commentContent.length, 5000)
                )}
              >
                {commentContent.length}/5000 תווים
              </span>
            </div>
            <Textarea
              id="commentContent"
              {...register('commentContent')}
              disabled={isSubmitting}
              className={cn(
                'min-h-[120px] resize-none',
                errors.commentContent && 'border-red-500'
              )}
              dir="rtl"
              placeholder="כתוב את התגובה שלך כאן..."
            />
            {errors.commentContent && (
              <p className="text-sm text-red-600" aria-live="polite">
                {errors.commentContent.message}
              </p>
            )}
          </div>

          {/* Suggested Edit (Optional) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="suggestedEdit">הצעת עריכה (אופציונלי)</Label>
              <span
                className={cn(
                  'text-xs',
                  getCharacterCountColor(suggestedEdit?.length || 0, 5000)
                )}
              >
                {suggestedEdit?.length || 0}/5000 תווים
              </span>
            </div>
            <Textarea
              id="suggestedEdit"
              {...register('suggestedEdit')}
              disabled={isSubmitting}
              className={cn(
                'min-h-[100px] resize-none',
                errors.suggestedEdit && 'border-red-500'
              )}
              dir="rtl"
              placeholder="אם יש לך הצעה לנוסח חלופי, כתוב אותה כאן..."
            />
            {errors.suggestedEdit && (
              <p className="text-sm text-red-600" aria-live="polite">
                {errors.suggestedEdit.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  שולח תגובה...
                </>
              ) : (
                'שלח תגובה'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
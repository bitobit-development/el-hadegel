'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createQuestionnaire, updateQuestionnaire } from '@/app/actions/questionnaire-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateSlug } from '@/lib/slug-utils';

interface Questionnaire {
  id: number;
  title: string;
  description: string | null;
  slug?: string;
}

interface QuestionnaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaire?: Questionnaire;
  onSuccess?: () => void;
}

export function QuestionnaireDialog({
  open,
  onOpenChange,
  questionnaire,
  onSuccess,
}: QuestionnaireDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(questionnaire?.title || '');
  const [description, setDescription] = useState(questionnaire?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!questionnaire;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form
        setTitle('');
        setDescription('');
        setErrors({});
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'כותרת השאלון היא שדה חובה';
    } else if (title.length < 5) {
      newErrors.title = 'כותרת השאלון חייבת להכיל לפחות 5 תווים';
    } else if (title.length > 500) {
      newErrors.title = 'כותרת השאלון לא יכולה לעלות על 500 תווים';
    }

    if (description && description.length > 2000) {
      newErrors.description = 'תיאור השאלון לא יכול לעלות על 2000 תווים';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit) {
        await updateQuestionnaire(questionnaire.id, {
          title: title.trim(),
          description: description.trim() || null,
        });
        toast.success('השאלון עודכן בהצלחה');
      } else {
        await createQuestionnaire({
          title: title.trim(),
          description: description.trim() || null,
        });
        toast.success('השאלון נוצר בהצלחה');
      }

      onSuccess?.();
      handleOpenChange(false);
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת השאלון');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">
            {isEdit ? 'עריכת שאלון' : 'יצירת שאלון חדש'}
          </DialogTitle>
          <DialogDescription className="text-right">
            {isEdit
              ? 'ערוך את פרטי השאלון. לא ניתן לשנות את סטטוס ההפעלה כאן.'
              : 'צור שאלון חדש. תוכל להוסיף שאלות לאחר היצירה.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-right font-medium">
              כותרת השאלון
              <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.title;
                    return newErrors;
                  });
                }
              }}
              placeholder="לדוגמה: שאלון איסוף דעות על חוק הגיוס"
              className={cn('text-right', errors.title && 'border-red-500')}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'error-title' : undefined}
            />
            {errors.title && (
              <p id="error-title" className="text-sm font-medium text-red-600 text-right" role="alert">
                {errors.title}
              </p>
            )}
            <p className="text-sm text-gray-500 text-right">
              {title.length} / 500 תווים
            </p>
            {/* Slug Preview */}
            {!isEdit && title.trim() && (
              <div className="mt-2 rounded-md bg-blue-50 p-3 text-right">
                <p className="text-xs font-medium text-blue-900 mb-1">כתובת URL שתיווצר:</p>
                <code className="text-sm text-blue-700 break-all">
                  {window.location.origin}/q/{generateSlug(title).substring(0, 50)}
                  {generateSlug(title).length > 50 && '...'}
                </code>
              </div>
            )}
            {isEdit && questionnaire?.slug && (
              <div className="mt-2 rounded-md bg-gray-50 p-3 text-right">
                <p className="text-xs font-medium text-gray-700 mb-1">כתובת URL נוכחית:</p>
                <code className="text-sm text-gray-600 break-all">
                  {window.location.origin}/q/{questionnaire.slug}
                </code>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-right font-medium">
              תיאור (אופציונלי)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.description;
                    return newErrors;
                  });
                }
              }}
              rows={4}
              placeholder="תיאור קצר על מטרת השאלון והשימוש שייעשה בנתונים"
              className={cn('resize-none text-right', errors.description && 'border-red-500')}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'error-description' : undefined}
            />
            {errors.description && (
              <p
                id="error-description"
                className="text-sm font-medium text-red-600 text-right"
                role="alert"
              >
                {errors.description}
              </p>
            )}
            <p className="text-sm text-gray-500 text-right">
              {description.length} / 2000 תווים
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  {isEdit ? 'מעדכן...' : 'יוצר...'}
                </>
              ) : (
                isEdit ? 'עדכן שאלון' : 'צור שאלון'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createQuestion, updateQuestion } from '@/app/actions/question-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getQuestionTypeLabel } from '@/lib/questionnaire-utils';

interface Question {
  id: number;
  questionText: string;
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  isRequired: boolean;
  maxLength: number | null;
  allowTextExplanation?: boolean;
  explanationMaxLength?: number;
  explanationLabel?: string | null;
}

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaireId: number;
  question?: Question;
  onSuccess?: () => void;
}

export function QuestionDialog({
  open,
  onOpenChange,
  questionnaireId,
  question,
  onSuccess,
}: QuestionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'YES_NO' | 'TEXT' | 'LONG_TEXT'>('YES_NO');
  const [isRequired, setIsRequired] = useState(true);
  const [maxLength, setMaxLength] = useState<number>(500);
  const [allowTextExplanation, setAllowTextExplanation] = useState(false);
  const [explanationMaxLength, setExplanationMaxLength] = useState(500);
  const [explanationLabel, setExplanationLabel] = useState('הוסף הסבר (אופציונלי)');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!question;

  // Load question data when dialog opens
  useEffect(() => {
    if (question) {
      setQuestionText(question.questionText);
      setQuestionType(question.questionType);
      setIsRequired(question.isRequired);
      setMaxLength(question.maxLength || (question.questionType === 'TEXT' ? 500 : 2000));
      setAllowTextExplanation(question.allowTextExplanation || false);
      setExplanationMaxLength(question.explanationMaxLength || 500);
      setExplanationLabel(question.explanationLabel || 'הוסף הסבר (אופציונלי)');
    } else {
      // Reset for new question
      setQuestionText('');
      setQuestionType('YES_NO');
      setIsRequired(true);
      setMaxLength(500);
      setAllowTextExplanation(false);
      setExplanationMaxLength(500);
      setExplanationLabel('הוסף הסבר (אופציונלי)');
      setErrors({});
    }
  }, [question, open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form
        setQuestionText('');
        setQuestionType('YES_NO');
        setIsRequired(true);
        setMaxLength(500);
        setAllowTextExplanation(false);
        setExplanationMaxLength(500);
        setExplanationLabel('הוסף הסבר (אופציונלי)');
        setErrors({});
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!questionText.trim()) {
      newErrors.questionText = 'נוסח השאלה הוא שדה חובה';
    } else if (questionText.length < 10) {
      newErrors.questionText = 'נוסח השאלה חייב להכיל לפחות 10 תווים';
    } else if (questionText.length > 1000) {
      newErrors.questionText = 'נוסח השאלה לא יכול לעלות על 1000 תווים';
    }

    if (questionType !== 'YES_NO') {
      if (!maxLength || maxLength < 1) {
        newErrors.maxLength = 'אורך מקסימלי חייב להיות לפחות 1';
      } else if (maxLength > 5000) {
        newErrors.maxLength = 'אורך מקסימלי לא יכול לעלות על 5000 תווים';
      }
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
        await updateQuestion(question.id, {
          questionText: questionText.trim(),
          questionType,
          isRequired,
          maxLength: questionType === 'YES_NO' ? null : maxLength,
          allowTextExplanation: questionType === 'YES_NO' ? allowTextExplanation : false,
          explanationMaxLength: questionType === 'YES_NO' && allowTextExplanation ? explanationMaxLength : null,
          explanationLabel: questionType === 'YES_NO' && allowTextExplanation ? explanationLabel : null,
        });
        toast.success('השאלה עודכנה בהצלחה');
      } else {
        await createQuestion({
          questionnaireId,
          questionText: questionText.trim(),
          questionType,
          isRequired,
          maxLength: questionType === 'YES_NO' ? null : maxLength,
          allowTextExplanation: questionType === 'YES_NO' ? allowTextExplanation : false,
          explanationMaxLength: questionType === 'YES_NO' && allowTextExplanation ? explanationMaxLength : null,
          explanationLabel: questionType === 'YES_NO' && allowTextExplanation ? explanationLabel : null,
        });
        toast.success('השאלה נוצרה בהצלחה');
      }

      onSuccess?.();
      handleOpenChange(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בשמירת השאלה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">
            {isEdit ? 'עריכת שאלה' : 'הוספת שאלה חדשה'}
          </DialogTitle>
          <DialogDescription className="text-right">
            {isEdit
              ? 'ערוך את פרטי השאלה. לא ניתן לשנות את מיקום השאלה כאן.'
              : 'הוסף שאלה חדשה לשאלון. השאלה תתווסף בסוף הרשימה.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="questionText" className="text-right font-medium">
              נוסח השאלה
              <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
            </Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                if (errors.questionText) {
                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.questionText;
                    return newErrors;
                  });
                }
              }}
              rows={3}
              placeholder="לדוגמה: האם אתה תומך בחוק הגיוס?"
              className={cn('resize-none text-right', errors.questionText && 'border-red-500')}
              aria-invalid={!!errors.questionText}
              aria-describedby={errors.questionText ? 'error-questionText' : undefined}
            />
            {errors.questionText && (
              <p
                id="error-questionText"
                className="text-sm font-medium text-red-600 text-right"
                role="alert"
              >
                {errors.questionText}
              </p>
            )}
            <p className="text-sm text-gray-500 text-right">
              {questionText.length} / 1000 תווים
            </p>
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <Label htmlFor="questionType" className="text-right font-medium">
              סוג שאלה
              <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
            </Label>
            <Select value={questionType} onValueChange={(value: any) => setQuestionType(value)}>
              <SelectTrigger id="questionType" className="text-right">
                <SelectValue placeholder="בחר סוג שאלה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES_NO">{getQuestionTypeLabel('YES_NO')}</SelectItem>
                <SelectItem value="TEXT">{getQuestionTypeLabel('TEXT')}</SelectItem>
                <SelectItem value="LONG_TEXT">{getQuestionTypeLabel('LONG_TEXT')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Length (for text questions) */}
          {questionType !== 'YES_NO' && (
            <div className="space-y-2">
              <Label htmlFor="maxLength" className="text-right font-medium">
                אורך מקסימלי (תווים)
              </Label>
              <Input
                id="maxLength"
                type="number"
                value={maxLength}
                onChange={(e) => {
                  setMaxLength(parseInt(e.target.value) || 0);
                  if (errors.maxLength) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.maxLength;
                      return newErrors;
                    });
                  }
                }}
                min={1}
                max={5000}
                className={cn('text-right', errors.maxLength && 'border-red-500')}
                aria-invalid={!!errors.maxLength}
                aria-describedby={errors.maxLength ? 'error-maxLength' : undefined}
              />
              {errors.maxLength && (
                <p
                  id="error-maxLength"
                  className="text-sm font-medium text-red-600 text-right"
                  role="alert"
                >
                  {errors.maxLength}
                </p>
              )}
              <p className="text-sm text-gray-500 text-right">
                מומלץ: {questionType === 'TEXT' ? '500' : '2000'} תווים
              </p>
            </div>
          )}

          {/* Is Required */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
            />
            <Label htmlFor="isRequired" className="cursor-pointer font-medium">
              שאלת חובה
            </Label>
          </div>

          {/* Explanation Settings (only for YES_NO questions) */}
          {questionType === 'YES_NO' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-sm text-right">הגדרות הסבר טקסט</h3>

              {/* Enable explanation checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allowTextExplanation"
                  checked={allowTextExplanation}
                  onCheckedChange={(checked) => setAllowTextExplanation(!!checked)}
                />
                <Label htmlFor="allowTextExplanation" className="text-sm cursor-pointer">
                  אפשר הוספת הסבר טקסט (אופציונלי)
                </Label>
              </div>

              {/* Conditional fields */}
              {allowTextExplanation && (
                <div className="space-y-4 pr-6">
                  {/* Explanation label */}
                  <div className="space-y-2">
                    <Label htmlFor="explanationLabel" className="text-right">
                      תווית שדה ההסבר
                    </Label>
                    <Input
                      id="explanationLabel"
                      value={explanationLabel}
                      onChange={(e) => setExplanationLabel(e.target.value)}
                      placeholder="הוסף הסבר (אופציונלי)"
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Max length */}
                  <div className="space-y-2">
                    <Label htmlFor="explanationMaxLength" className="text-right">
                      אורך מקסימלי (תווים)
                    </Label>
                    <Input
                      id="explanationMaxLength"
                      type="number"
                      value={explanationMaxLength}
                      onChange={(e) => setExplanationMaxLength(parseInt(e.target.value) || 500)}
                      min={50}
                      max={2000}
                      className="text-right"
                    />
                    <p className="text-sm text-gray-500 text-right">
                      מומלץ: 500 תווים
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                  {isEdit ? 'מעדכן...' : 'מוסיף...'}
                </>
              ) : (
                isEdit ? 'עדכן שאלה' : 'הוסף שאלה'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

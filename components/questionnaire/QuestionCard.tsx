'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCharacterCount } from '@/lib/questionnaire-utils';
import { Check, X } from 'lucide-react';

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

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  value: {
    answer?: boolean;
    textAnswer?: string;
    explanationText?: string;
  };
  onChange: (value: { answer?: boolean; textAnswer?: string; explanationText?: string }) => void;
  error?: string;
}

export function QuestionCard({
  question,
  questionNumber,
  value,
  onChange,
  error,
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(
    question.allowTextExplanation && value?.answer !== null && value?.answer !== undefined
  );

  const maxLength =
    question.questionType === 'TEXT'
      ? question.maxLength || 500
      : question.questionType === 'LONG_TEXT'
        ? question.maxLength || 2000
        : 0;

  const charCount = question.questionType !== 'YES_NO'
    ? getCharacterCount(value.textAnswer || '', maxLength)
    : null;

  return (
    <div className={cn(
      'question-card rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg transition-all',
      error && 'border-red-500 bg-red-50/50 error-shake'
    )}>
      {/* Question Header */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
            {questionNumber}
          </span>
          <div className="flex-1">
            <Label className="text-base font-medium text-gray-900">
              {question.questionText}
              {question.isRequired && (
                <span className="mr-1 text-red-500" aria-label="שדה חובה">*</span>
              )}
            </Label>
          </div>
        </div>
      </div>

      {/* Question Input Based on Type */}
      {question.questionType === 'YES_NO' && (
        <div className="space-y-4">
          {/* YES/NO buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant={value.answer === true ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                onChange({ ...value, answer: true });
                if (question.allowTextExplanation) {
                  setShowExplanation(true);
                }
              }}
              className={cn(
                'flex-1 text-lg font-semibold',
                value.answer === true
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'border-green-600 text-green-600 hover:bg-green-50'
              )}
              aria-pressed={value.answer === true}
            >
              <Check className="ml-2 h-5 w-5" aria-hidden="true" />
              כן
            </Button>
            <Button
              type="button"
              variant={value.answer === false ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                onChange({ ...value, answer: false });
                if (question.allowTextExplanation) {
                  setShowExplanation(true);
                }
              }}
              className={cn(
                'flex-1 text-lg font-semibold',
                value.answer === false
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              )}
              aria-pressed={value.answer === false}
            >
              <X className="ml-2 h-5 w-5" aria-hidden="true" />
              לא
            </Button>
          </div>

          {/* Explanation textarea (conditional) */}
          {question.allowTextExplanation && showExplanation && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`explanation-${question.id}`}
                  className="text-sm text-gray-600"
                >
                  {question.explanationLabel || 'הוסף הסבר (אופציונלי)'}
                </Label>
                {value?.explanationText && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({ ...value, explanationText: '' })}
                    className="h-6 px-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Textarea
                id={`explanation-${question.id}`}
                value={value?.explanationText || ''}
                onChange={(e) => onChange({ ...value, explanationText: e.target.value })}
                placeholder="הוסף הסבר או פרט נוסף (אופציונלי)"
                maxLength={question.explanationMaxLength || 500}
                rows={3}
                className="resize-none text-right"
                dir="rtl"
              />

              {/* Character counter */}
              <div className="flex justify-end">
                <span className={cn(
                  'text-xs',
                  (value?.explanationText?.length || 0) > (question.explanationMaxLength || 500) * 0.9
                    ? 'text-orange-500 font-medium'
                    : 'text-gray-500'
                )}>
                  {value?.explanationText?.length || 0}/{question.explanationMaxLength || 500}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {question.questionType === 'TEXT' && (
        <div className="space-y-2">
          <Input
            type="text"
            value={value.textAnswer || ''}
            onChange={(e) => onChange({ textAnswer: e.target.value })}
            maxLength={maxLength}
            placeholder="הקלד את תשובתך כאן..."
            className={cn(
              'text-right input-focus-glow',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `error-${question.id}` : undefined}
          />
          {charCount && (
            <div className={cn(
              'text-left text-sm',
              charCount.isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'
            )}>
              {charCount.current} / {maxLength} תווים
            </div>
          )}
        </div>
      )}

      {question.questionType === 'LONG_TEXT' && (
        <div className="space-y-2">
          <Textarea
            value={value.textAnswer || ''}
            onChange={(e) => onChange({ textAnswer: e.target.value })}
            maxLength={maxLength}
            rows={6}
            placeholder="הקלד את תשובתך המפורטת כאן..."
            className={cn(
              'resize-none text-right',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `error-${question.id}` : undefined}
          />
          {charCount && (
            <div className={cn(
              'text-left text-sm',
              charCount.isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'
            )}>
              {charCount.current} / {maxLength} תווים
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          id={`error-${question.id}`}
          className="mt-2 text-sm font-medium text-red-600 text-right"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

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
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  value: {
    answer?: boolean;
    textAnswer?: string;
  };
  onChange: (value: { answer?: boolean; textAnswer?: string }) => void;
  error?: string;
}

export function QuestionCard({
  question,
  questionNumber,
  value,
  onChange,
  error,
}: QuestionCardProps) {
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
      'rounded-lg border bg-white p-6 shadow-sm transition-all',
      error && 'border-red-500 bg-red-50/50'
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
        <div className="flex gap-3">
          <Button
            type="button"
            variant={value.answer === true ? 'default' : 'outline'}
            size="lg"
            onClick={() => onChange({ answer: true })}
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
            onClick={() => onChange({ answer: false })}
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
              'text-right',
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

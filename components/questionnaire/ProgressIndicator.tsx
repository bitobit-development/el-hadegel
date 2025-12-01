'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  totalQuestions: number;
  answeredQuestions: number;
  isComplete: boolean;
}

export function ProgressIndicator({
  totalQuestions,
  answeredQuestions,
  isComplete,
}: ProgressIndicatorProps) {
  const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-md rounded-b-lg">
      <div className="container mx-auto max-w-4xl px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="text-right flex-1">
            <p className="text-sm font-medium text-gray-700">
              {isComplete ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  כל השאלות נענו!
                </span>
              ) : (
                <span>
                  {answeredQuestions} מתוך {totalQuestions} שאלות
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 bg-gray-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={answeredQuestions}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-label={`${answeredQuestions} מתוך ${totalQuestions} שאלות נענו`}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              isComplete
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

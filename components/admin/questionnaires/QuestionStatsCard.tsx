'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  getQuestionTypeLabel,
  getQuestionTypeColor,
  truncateText,
  formatPercentage,
  getPercentageColor,
} from '@/lib/questionnaire-utils';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface QuestionStat {
  questionId: number;
  questionText: string;
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  totalAnswers: number;
  yesCount?: number;
  noCount?: number;
  yesPercentage?: number;
  noPercentage?: number;
  answeredCount?: number;
  unansweredCount?: number;
  answerRate?: number;
}

interface QuestionStatsCardProps {
  stat: QuestionStat;
  totalResponses: number;
}

export function QuestionStatsCard({ stat, totalResponses }: QuestionStatsCardProps) {
  const answerRate = totalResponses > 0 ? (stat.totalAnswers / totalResponses) * 100 : 0;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* Question Header */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-right">
            <p className="font-medium text-gray-900">
              {truncateText(stat.questionText, 120)}
            </p>
            <Badge className={cn('mt-2', getQuestionTypeColor(stat.questionType))}>
              {getQuestionTypeLabel(stat.questionType)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="space-y-3">
        {/* Answer Rate */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className={cn(
              'font-medium',
              answerRate >= 80 ? 'text-green-600' : answerRate >= 50 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {formatPercentage(answerRate)}
            </span>
            <span className="text-gray-600">
              {stat.totalAnswers} / {totalResponses} תשובות
            </span>
          </div>
          <Progress
            value={answerRate}
            className="h-2"
          />
        </div>

        {/* YES/NO Breakdown */}
        {stat.questionType === 'YES_NO' && stat.yesPercentage !== undefined && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">כן</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {formatPercentage(stat.yesPercentage)}
              </div>
              <div className="mt-1 text-xs text-green-700">
                {stat.yesCount} תשובות
              </div>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-red-800">
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">לא</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-red-600">
                {formatPercentage(stat.noPercentage || 0)}
              </div>
              <div className="mt-1 text-xs text-red-700">
                {stat.noCount} תשובות
              </div>
            </div>
          </div>
        )}

        {/* Text Answer Stats */}
        {(stat.questionType === 'TEXT' || stat.questionType === 'LONG_TEXT') && (
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-sm text-gray-600">תשובות טקסטואליות</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {stat.answeredCount || 0}
            </div>
            {stat.unansweredCount !== undefined && stat.unansweredCount > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {stat.unansweredCount} לא ענו
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

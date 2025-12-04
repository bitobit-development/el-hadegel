'use client';

import { useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { updateResponseAnswer } from '@/app/actions/questionnaire-response-actions';
import { toast } from 'sonner';

interface Question {
  id: number;
  questionText: string;
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  isRequired: boolean;
}

interface Answer {
  answer: boolean | null;
  textAnswer: string | null;
}

interface EditableQuestionCellProps {
  responseId: number;
  question: Question;
  currentAnswer: Answer | undefined;
}

/**
 * Editable table cell for question answers
 *
 * Supports three question types:
 * - YES_NO: Select dropdown (כן/לא/ריק)
 * - TEXT: Short text input (max 500 chars)
 * - LONG_TEXT: Textarea (max 2000 chars)
 *
 * Each cell has its own save button for individual updates.
 */
export function EditableQuestionCell({
  responseId,
  question,
  currentAnswer,
}: EditableQuestionCellProps) {
  // Extract current value based on question type
  const initialValue =
    question.questionType === 'YES_NO'
      ? currentAnswer?.answer === null
        ? 'null'
        : currentAnswer?.answer
        ? 'true'
        : 'false'
      : currentAnswer?.textAnswer || '';

  const [value, setValue] = useState<string>(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Convert value based on question type
      let parsedValue: boolean | string | null;

      if (question.questionType === 'YES_NO') {
        if (value === 'null') {
          parsedValue = null;
        } else {
          parsedValue = value === 'true';
        }
      } else {
        // TEXT or LONG_TEXT
        const trimmed = value.trim();
        parsedValue = trimmed.length > 0 ? trimmed : null;
      }

      // Call server action
      const result = await updateResponseAnswer(responseId, question.id, parsedValue);

      if (result.success) {
        toast.success('התשובה נשמרה בהצלחה');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('שגיאה בשמירת התשובה');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if value has changed from initial
  const hasChanged = value !== initialValue;

  return (
    <TableCell className="min-w-[200px] max-w-[300px] p-2">
      <div className="flex flex-col gap-2">
        {/* Input field based on question type */}
        {question.questionType === 'YES_NO' ? (
          <Select value={value} onValueChange={setValue} disabled={isSaving}>
            <SelectTrigger
              className={`h-9 text-sm ${
                question.isRequired && value === 'null'
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              dir="rtl"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">כן</SelectItem>
              <SelectItem value="false">לא</SelectItem>
              <SelectItem value="null">ריק</SelectItem>
            </SelectContent>
          </Select>
        ) : question.questionType === 'TEXT' ? (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            dir="rtl"
            maxLength={500}
            placeholder={question.isRequired ? 'שדה חובה' : 'הזן תשובה...'}
            className={`h-9 text-sm ${
              question.isRequired && value.trim().length === 0
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
          />
        ) : (
          // LONG_TEXT
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            dir="rtl"
            rows={3}
            maxLength={2000}
            placeholder={question.isRequired ? 'שדה חובה' : 'הזן תשובה...'}
            className={`text-sm resize-none ${
              question.isRequired && value.trim().length === 0
                ? 'border-red-300 focus-visible:ring-red-500'
                : 'border-gray-300 focus-visible:ring-blue-500'
            }`}
          />
        )}

        {/* Character count for text fields */}
        {question.questionType !== 'YES_NO' && value.length > 0 && (
          <div className="text-xs text-gray-500 text-left">
            {value.length} / {question.questionType === 'TEXT' ? 500 : 2000}
          </div>
        )}

        {/* Save button - only show if value changed */}
        {hasChanged && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                שומר...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 ml-1" />
                שמור
              </>
            )}
          </Button>
        )}
      </div>
    </TableCell>
  );
}

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, X } from 'lucide-react';
import { updateResponseSchema, type UpdateResponseData } from '@/lib/validation/questionnaire-validation';
import { formatQuestionnaireDate, getRelativeTime } from '@/lib/questionnaire-utils';

interface Answer {
  id: number;
  answer: boolean | null;
  textAnswer: string | null;
  question: {
    id: number;
    questionText: string;
    questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  };
}

interface Response {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  submittedAt: Date | string;
  answers: Answer[];
}

interface EditableResponseRowProps {
  response: Response;
  onSave: (data: UpdateResponseData) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function EditableResponseRow({
  response,
  onSave,
  onCancel,
  isSaving,
}: EditableResponseRowProps) {
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isValid },
  } = useForm<UpdateResponseData>({
    resolver: zodResolver(updateResponseSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: response.fullName,
      phoneNumber: response.phoneNumber,
      email: response.email,
    },
  });

  // Auto-focus first input on mount using react-hook-form's setFocus
  useEffect(() => {
    setFocus('fullName');
  }, [setFocus]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const onSubmit = async (data: UpdateResponseData) => {
    if (!isSaving) {
      await onSave(data);
    }
  };

  return (
    <TableRow className="bg-blue-50/50">
      <TableCell className="py-2">
        <form onSubmit={handleSubmit(onSubmit)} id={`edit-form-${response.id}`}>
          <div className="space-y-1">
            <Input
              {...register('fullName')}
              type="text"
              dir="rtl"
              disabled={isSaving}
              className={`h-9 text-sm ${
                errors.fullName
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-blue-300 focus-visible:ring-blue-500'
              }`}
              placeholder="שם מלא"
              autoComplete="off"
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 text-right">{errors.fullName.message}</p>
            )}
          </div>
        </form>
      </TableCell>

      <TableCell className="py-2">
        <div className="space-y-1">
          <Input
            {...register('phoneNumber')}
            type="tel"
            dir="ltr"
            disabled={isSaving}
            className={`h-9 text-sm font-mono text-center ${
              errors.phoneNumber
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-blue-300 focus-visible:ring-blue-500'
            }`}
            placeholder="05XXXXXXXX"
            autoComplete="off"
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-600 text-center">{errors.phoneNumber.message}</p>
          )}
        </div>
      </TableCell>

      <TableCell className="py-2">
        <div className="space-y-1">
          <Input
            {...register('email')}
            type="email"
            dir="ltr"
            disabled={isSaving}
            className={`h-9 text-sm text-center ${
              errors.email
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-blue-300 focus-visible:ring-blue-500'
            }`}
            placeholder="email@example.com"
            autoComplete="off"
          />
          {errors.email && (
            <p className="text-xs text-red-600 text-center">{errors.email.message}</p>
          )}
        </div>
      </TableCell>

      <TableCell className="text-center text-sm text-gray-600">
        <div>{getRelativeTime(response.submittedAt)}</div>
        <div className="text-xs text-gray-500">{formatQuestionnaireDate(response.submittedAt)}</div>
      </TableCell>

      <TableCell className="text-center">
        <span className="font-semibold text-blue-600">{response.answers.length}</span>
      </TableCell>

      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Button
            type="submit"
            form={`edit-form-${response.id}`}
            size="sm"
            disabled={!isValid || isSaving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            title="שמור שינויים"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 ml-1" />
                שמור
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="border-gray-300 hover:bg-gray-100"
            title="בטל שינויים"
          >
            <X className="h-4 w-4 ml-1" />
            ביטול
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

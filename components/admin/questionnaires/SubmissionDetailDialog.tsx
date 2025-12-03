'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getQuestionTypeLabel,
  getQuestionTypeColor,
  formatQuestionnaireDate,
  formatPhoneNumber,
  formatAnswerSummary,
} from '@/lib/questionnaire-utils';
import { cn } from '@/lib/utils';
import { Check, X, Mail, Phone, Calendar } from 'lucide-react';
import { CustomFieldEditor } from './CustomFieldEditor';
import {
  getResponseCustomFieldValues,
  getCustomFieldDefinitions
} from '@/app/actions/custom-field-actions';
import { extractFieldValue } from '@/lib/validation/custom-field-validation';

interface Answer {
  id: number;
  answer: boolean | null;
  textAnswer: string | null;
  explanationText?: string | null;
  question: {
    id: number;
    questionText: string;
    questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
    explanationLabel?: string | null;
  };
}

interface Response {
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string;
  submittedAt: Date | string;
  answers: Answer[];
  questionnaire?: {
    id: number;
    title: string;
  };
  customFieldValues?: Array<{
    id: number;
    fieldId: number;
    stringValue?: string | null;
    numberValue?: number | null;
    booleanValue?: boolean | null;
    dateValue?: Date | string | null;
    field: {
      id: number;
      fieldName: string;
      fieldType: string;
    };
  }>;
}

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: Response | null;
}

export function SubmissionDetailDialog({
  open,
  onOpenChange,
  response,
}: SubmissionDetailDialogProps) {
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});
  const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(false);

  useEffect(() => {
    const loadCustomFields = async () => {
      if (!response || !open) return;

      // We need questionnaire ID from the response
      const questionnaireId = response.questionnaire?.id;
      if (!questionnaireId) {
        // If no questionnaire ID, custom fields can't be loaded
        console.log('No questionnaire ID available for custom fields');
        return;
      }

      setIsLoadingCustomFields(true);
      try {
        const [fields, values] = await Promise.all([
          getCustomFieldDefinitions(questionnaireId),
          getResponseCustomFieldValues(response.id),
        ]);

        setCustomFields(fields);

        // Convert values to Record<fieldId, value>
        const valuesMap: Record<number, any> = {};
        values.forEach((val) => {
          // Find the field definition to get the type
          const field = fields.find(f => f.id === val.fieldId);
          if (field) {
            valuesMap[val.fieldId] = extractFieldValue(field.fieldType, {
              textValue: val.textValue,
              numberValue: val.numberValue,
              dateValue: val.dateValue,
            });
          }
        });

        setCustomFieldValues(valuesMap);
      } catch (error) {
        console.error('Error loading custom fields:', error);
      } finally {
        setIsLoadingCustomFields(false);
      }
    };

    loadCustomFields();
  }, [response, open]);

  if (!response) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-xl">פרטי תשובה</DialogTitle>
          <DialogDescription className="text-right">
            תשובה שהוגשה ב-{formatQuestionnaireDate(response.submittedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 text-right">
              פרטי יצירת קשר
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">שם מלא</div>
                <div className="mt-1 font-medium text-gray-900">{response.fullName}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">טלפון</div>
                <a
                  href={`tel:${response.phoneNumber}`}
                  className="mt-1 flex items-center justify-end gap-2 font-medium text-blue-600 hover:text-blue-700"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhoneNumber(response.phoneNumber)}
                </a>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">אימייל</div>
                <a
                  href={`mailto:${response.email}`}
                  className="mt-1 flex items-center justify-end gap-2 font-medium text-blue-600 hover:text-blue-700"
                >
                  <Mail className="h-4 w-4" />
                  {response.email}
                </a>
              </div>
            </div>
          </div>

          {/* Answers */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 text-right">
              תשובות ({response.answers.length})
            </h3>
            <div className="space-y-4">
              {response.answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="rounded-lg border bg-white p-4 shadow-sm"
                >
                  {/* Question */}
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-right font-medium text-gray-900">
                        {answer.question.questionText}
                      </p>
                      <Badge className={cn('mt-2', getQuestionTypeColor(answer.question.questionType))}>
                        {getQuestionTypeLabel(answer.question.questionType)}
                      </Badge>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="mr-10 text-right">
                    {answer.question.questionType === 'YES_NO' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-end gap-2">
                          {answer.answer === true ? (
                            <div className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-800">
                              <Check className="h-5 w-5" />
                              <span className="font-semibold">כן</span>
                            </div>
                          ) : answer.answer === false ? (
                            <div className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-red-800">
                              <X className="h-5 w-5" />
                              <span className="font-semibold">לא</span>
                            </div>
                          ) : (
                            <div className="text-gray-500">לא נענה</div>
                          )}
                        </div>

                        {/* Display explanation text if exists */}
                        {answer.explanationText && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                              {answer.question.explanationLabel || 'הסבר'}:
                            </p>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap text-right">
                              {answer.explanationText}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-900">
                        {answer.textAnswer || (
                          <span className="text-gray-500">לא נענה</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Fields Section */}
          {!isLoadingCustomFields && customFields.length > 0 && (
            <div className="border-t pt-6 mt-6">
              <CustomFieldEditor
                responseId={response.id}
                fields={customFields}
                values={customFieldValues}
                onUpdate={async () => {
                  // Reload custom field values after update
                  const values = await getResponseCustomFieldValues(response.id);
                  const valuesMap: Record<number, any> = {};
                  values.forEach((val) => {
                    // Find the field definition to get the type
                    const field = customFields.find(f => f.id === val.fieldId);
                    if (field) {
                      valuesMap[val.fieldId] = extractFieldValue(field.fieldType, {
                        textValue: val.textValue,
                        numberValue: val.numberValue,
                        dateValue: val.dateValue,
                      });
                    }
                  });
                  setCustomFieldValues(valuesMap);
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getQuestionTypeLabel,
  getQuestionTypeColor,
  formatQuestionnaireDate,
  formatPhoneNumber,
  formatAnswerSummary,
} from '@/lib/questionnaire-utils';
import { cn } from '@/lib/utils';
import { Mail, Phone, Calendar, User, MessageSquare, Settings2, Loader2 } from 'lucide-react';
import { CustomFieldEditor } from './CustomFieldEditor';
import { EditableQuestionCell } from './EditableQuestionCell';
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
    isRequired: boolean;
    orderIndex: number;
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

  const hasCustomFields = !isLoadingCustomFields && customFields.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh] flex-col">
          {/* Header with gradient */}
          <DialogHeader className="relative overflow-hidden border-b bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6 pb-5 pt-8">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-20" />
            <div className="relative space-y-1.5 pr-8">
              <DialogTitle className="flex items-center justify-start gap-2 text-left text-2xl font-bold">
                <User className="h-6 w-6 text-blue-600" />
                <span className="bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  פרטי תשובה
                </span>
              </DialogTitle>
              <DialogDescription className="flex items-center justify-start gap-2 text-left text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{formatQuestionnaireDate(response.submittedAt)}</span>
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Tabs Content */}
          <Tabs defaultValue="contact" className="flex-1 overflow-hidden" dir="rtl">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted/50 p-0">
              <TabsTrigger
                value="contact"
                className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <User className="ml-2 h-4 w-4" />
                פרטי קשר
              </TabsTrigger>
              <TabsTrigger
                value="answers"
                className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <MessageSquare className="ml-2 h-4 w-4" />
                תשובות ({response.answers.length})
              </TabsTrigger>
              {hasCustomFields && (
                <TabsTrigger
                  value="custom"
                  className="rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Settings2 className="ml-2 h-4 w-4" />
                  שדות מותאמים ({customFields.length})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Contact Info Tab */}
            <TabsContent value="contact" className="m-0 flex-1 overflow-auto p-6">
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 pb-4">
                  <CardTitle className="text-right text-lg">פרטי יצירת קשר</CardTitle>
                  <CardDescription className="text-right">מידע ליצירת קשר עם המשיב</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Full Name */}
                  <div className="group">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                      <span>שם מלא</span>
                      <User className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-right">
                      <div className="inline-flex items-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-2.5 text-lg font-semibold text-gray-900 shadow-sm ring-1 ring-blue-200/50 transition-all group-hover:shadow-md">
                        {response.fullName}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Phone Number */}
                  <div className="group">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                      <span>מספר טלפון</span>
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-right">
                      <a
                        href={`tel:${response.phoneNumber}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-lg font-semibold text-green-700 shadow-sm ring-1 ring-green-200/50 transition-all hover:bg-green-100 hover:shadow-md"
                      >
                        <span dir="ltr">{formatPhoneNumber(response.phoneNumber)}</span>
                        <Phone className="h-5 w-5" />
                      </a>
                    </div>
                  </div>

                  <Separator />

                  {/* Email */}
                  <div className="group">
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                      <span>כתובת אימייל</span>
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-right">
                      <a
                        href={`mailto:${response.email}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2.5 font-semibold text-purple-700 shadow-sm ring-1 ring-purple-200/50 transition-all hover:bg-purple-100 hover:shadow-md"
                      >
                        <span dir="ltr" className="break-all text-base">{response.email}</span>
                        <Mail className="h-5 w-5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <Separator />

                  {/* Submission Date */}
                  <div>
                    <div className="flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground">
                      <span>תאריך הגשה</span>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-right">
                      <div className="inline-flex items-center rounded-lg bg-gray-50 px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm ring-1 ring-gray-200/50">
                        {formatQuestionnaireDate(response.submittedAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Answers Tab */}
            <TabsContent value="answers" className="m-0 flex-1 overflow-auto">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-6">
                  {response.answers.map((answer, index) => (
                    <Card
                      key={answer.id}
                      className="overflow-hidden border-2 shadow-md transition-all hover:shadow-lg"
                    >
                      <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shadow-md">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <CardTitle className="text-right text-base leading-relaxed">
                              {answer.question.questionText}
                            </CardTitle>
                            <div className="flex justify-end">
                              <Badge className={cn(
                                'shadow-sm',
                                getQuestionTypeColor(answer.question.questionType)
                              )}>
                                {getQuestionTypeLabel(answer.question.questionType)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {/* Editable Answer - Wrapped in table for EditableQuestionCell */}
                        <div className="rounded-lg bg-gradient-to-br from-blue-50/30 to-indigo-50/30 p-4">
                          <table className="w-full">
                            <tbody>
                              <tr>
                                <EditableQuestionCell
                                  responseId={response.id}
                                  question={answer.question}
                                  currentAnswer={{
                                    answer: answer.answer,
                                    textAnswer: answer.textAnswer,
                                  }}
                                />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Custom Fields Tab */}
            {hasCustomFields && (
              <TabsContent value="custom" className="m-0 flex-1 overflow-auto">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <Card className="border-2 shadow-lg">
                      <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardTitle className="text-right">שדות מותאמים אישית</CardTitle>
                        <CardDescription className="text-right">
                          מידע נוסף והגדרות מותאמות אישית
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
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
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Loading State for Custom Fields */}
            {isLoadingCustomFields && (
              <TabsContent value="custom" className="m-0 flex-1">
                <div className="flex h-full items-center justify-center p-6">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>טוען שדות מותאמים...</span>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { QuestionDialog } from './QuestionDialog';
import {
  deleteQuestion,
  moveQuestionUp,
  moveQuestionDown,
} from '@/app/actions/question-actions';
import { toast } from 'sonner';
import {
  getQuestionTypeLabel,
  getQuestionTypeColor,
  truncateText,
} from '@/lib/questionnaire-utils';
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface Question {
  id: number;
  questionText: string;
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  isRequired: boolean;
  maxLength: number | null;
  orderIndex: number;
  _count?: {
    answers: number;
  };
}

interface QuestionListProps {
  questionnaireId: number;
  questions: Question[];
  onUpdate: () => void;
}

export function QuestionList({ questionnaireId, questions: initialQuestions, onUpdate }: QuestionListProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;

    setProcessingId(deletingId);

    try {
      const result = await deleteQuestion(deletingId);
      toast.success('השאלה נמחקה בהצלחה', {
        description: result.deletedAnswers > 0 ? `נמחקו ${result.deletedAnswers} תשובות` : undefined,
      });

      setQuestions((prev) => prev.filter((q) => q.id !== deletingId));
      setDeletingId(null);
      onUpdate();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת השאלה');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMoveUp = async (id: number) => {
    setProcessingId(id);

    try {
      await moveQuestionUp(id);
      toast.success('השאלה הועברה למעלה');
      onUpdate();
    } catch (error) {
      console.error('Error moving question up:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בהזזת השאלה');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMoveDown = async (id: number) => {
    setProcessingId(id);

    try {
      await moveQuestionDown(id);
      toast.success('השאלה הועברה למטה');
      onUpdate();
    } catch (error) {
      console.error('Error moving question down:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בהזזת השאלה');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="flex items-start gap-4 rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            {/* Question Number */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
              {index + 1}
            </div>

            {/* Question Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-right font-medium text-gray-900">
                  {question.questionText}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getQuestionTypeColor(question.questionType)}>
                  {getQuestionTypeLabel(question.questionType)}
                </Badge>

                {question.isRequired && (
                  <Badge className="bg-red-100 text-red-800">
                    <CheckCircle2 className="ml-1 h-3 w-3" />
                    חובה
                  </Badge>
                )}

                {question.questionType !== 'YES_NO' && question.maxLength && (
                  <Badge variant="outline">
                    מקסימום {question.maxLength} תווים
                  </Badge>
                )}

                {question._count && question._count.answers > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {question._count.answers} תשובות
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-1">
              {/* Move Up */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMoveUp(question.id)}
                disabled={index === 0 || processingId === question.id}
                title="הזז למעלה"
              >
                {processingId === question.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>

              {/* Move Down */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMoveDown(question.id)}
                disabled={index === questions.length - 1 || processingId === question.id}
                title="הזז למטה"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex shrink-0 gap-1">
              {/* Edit */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingQuestion(question)}
                disabled={processingId === question.id}
                title="עריכה"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>

              {/* Delete */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeletingId(question.id)}
                disabled={processingId === question.id}
                title="מחיקה"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingQuestion && (
        <QuestionDialog
          open={!!editingQuestion}
          onOpenChange={(open) => !open && setEditingQuestion(null)}
          questionnaireId={questionnaireId}
          question={editingQuestion}
          onSuccess={() => {
            setEditingQuestion(null);
            onUpdate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את השאלה לצמיתות, כולל כל התשובות שנשמרו עבורה. לא ניתן לשחזר את הנתונים.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId === deletingId}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={processingId === deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingId === deletingId ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                'מחק שאלה'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { QuestionnaireDialog } from './QuestionnaireDialog';
import {
  deleteQuestionnaire,
  activateQuestionnaire,
  deactivateQuestionnaire,
} from '@/app/actions/questionnaire-actions';
import { toast } from 'sonner';
import {
  getQuestionnaireStatusLabel,
  getQuestionnaireStatusColor,
  formatQuestionnaireDate,
} from '@/lib/questionnaire-utils';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  FileQuestion,
  Users,
  Loader2,
} from 'lucide-react';

interface Questionnaire {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  _count: {
    questions: number;
    responses: number;
  };
}

interface QuestionnaireTableProps {
  questionnaires: Questionnaire[];
}

export function QuestionnaireTable({ questionnaires: initialQuestionnaires }: QuestionnaireTableProps) {
  const router = useRouter();
  const [questionnaires, setQuestionnaires] = useState(initialQuestionnaires);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;

    setProcessingId(deletingId);

    try {
      const result = await deleteQuestionnaire(deletingId);
      toast.success('השאלון נמחק בהצלחה', {
        description: `נמחקו ${result.deletedQuestions} שאלות ו-${result.deletedResponses} תשובות`,
      });

      // Remove from local state
      setQuestionnaires((prev) => prev.filter((q) => q.id !== deletingId));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת השאלון');
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async () => {
    if (!activatingId) return;

    setProcessingId(activatingId);

    try {
      await activateQuestionnaire(activatingId);
      toast.success('השאלון הופעל בהצלחה');

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) => ({
          ...q,
          isActive: q.id === activatingId,
        }))
      );

      setActivatingId(null);
      router.refresh();
    } catch (error) {
      console.error('Error activating questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בהפעלת השאלון');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (id: number) => {
    setProcessingId(id);

    try {
      await deactivateQuestionnaire(id);
      toast.success('השאלון הופסק בהצלחה');

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, isActive: false } : q
        )
      );

      router.refresh();
    } catch (error) {
      console.error('Error deactivating questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בביטול הפעלת השאלון');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right font-semibold">כותרת</TableHead>
              <TableHead className="text-center font-semibold">סטטוס</TableHead>
              <TableHead className="text-center font-semibold">שאלות</TableHead>
              <TableHead className="text-center font-semibold">תשובות</TableHead>
              <TableHead className="text-center font-semibold">נוצר בתאריך</TableHead>
              <TableHead className="text-center font-semibold">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questionnaires.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <FileQuestion className="h-12 w-12" />
                    <p>אין שאלונים במערכת</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              questionnaires.map((questionnaire) => (
                <TableRow key={questionnaire.id}>
                  {/* Title */}
                  <TableCell className="max-w-md text-right font-medium">
                    <div className="truncate">{questionnaire.title}</div>
                    {questionnaire.description && (
                      <div className="mt-1 truncate text-sm text-gray-500">
                        {questionnaire.description}
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    <Badge className={getQuestionnaireStatusColor(questionnaire.isActive)}>
                      {getQuestionnaireStatusLabel(questionnaire.isActive)}
                    </Badge>
                  </TableCell>

                  {/* Questions Count */}
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600">
                      {questionnaire._count.questions}
                    </span>
                  </TableCell>

                  {/* Responses Count */}
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">
                      {questionnaire._count.responses}
                    </span>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-center text-sm text-gray-600">
                    {formatQuestionnaireDate(questionnaire.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Edit */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingQuestionnaire(questionnaire)}
                        disabled={processingId === questionnaire.id}
                        title="עריכה"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Activate/Deactivate */}
                      {questionnaire.isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeactivate(questionnaire.id)}
                          disabled={processingId === questionnaire.id}
                          title="ביטול הפעלה"
                        >
                          {processingId === questionnaire.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-orange-600" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActivatingId(questionnaire.id)}
                          disabled={processingId === questionnaire.id}
                          title="הפעלה"
                        >
                          <Power className="h-4 w-4 text-green-600" />
                        </Button>
                      )}

                      {/* View Questions */}
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        title="ניהול שאלות"
                      >
                        <Link href={`/admin/questionnaires/${questionnaire.id}/questions`}>
                          <FileQuestion className="h-4 w-4 text-blue-600" />
                        </Link>
                      </Button>

                      {/* View Submissions */}
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        title="צפייה בתשובות"
                      >
                        <Link href={`/admin/questionnaires/${questionnaire.id}/submissions`}>
                          <Users className="h-4 w-4 text-purple-600" />
                        </Link>
                      </Button>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(questionnaire.id)}
                        disabled={processingId === questionnaire.id}
                        title="מחיקה"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingQuestionnaire && (
        <QuestionnaireDialog
          open={!!editingQuestionnaire}
          onOpenChange={(open) => !open && setEditingQuestionnaire(null)}
          questionnaire={editingQuestionnaire}
          onSuccess={() => {
            router.refresh();
            setEditingQuestionnaire(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את השאלון לצמיתות, כולל כל השאלות והתשובות שנשמרו. לא ניתן לשחזר את הנתונים.
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
                'מחק שאלון'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation */}
      <AlertDialog open={!!activatingId} onOpenChange={(open) => !open && setActivatingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">הפעלת שאלון</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              הפעלת שאלון זה תבטל את השאלון הפעיל הנוכחי (אם קיים). רק שאלון אחד יכול להיות פעיל בכל זמן נתון.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId === activatingId}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={processingId === activatingId}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId === activatingId ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מפעיל...
                </>
              ) : (
                'הפעל שאלון'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
  publishQuestionnaire,
  unpublishQuestionnaire,
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
  Star,
  Eye,
  EyeOff,
  FileQuestion,
  Users,
  Loader2,
  Clipboard,
} from 'lucide-react';

interface Questionnaire {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  isActive: boolean;
  isPublished: boolean;
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
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<number | null>(null);
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
      toast.success('השאלון סומן כמומלץ בהצלחה');

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
      toast.error(error instanceof Error ? error.message : 'שגיאה בסימון כמומלץ');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async (id: number) => {
    setProcessingId(id);

    try {
      await deactivateQuestionnaire(id);
      toast.success('הסימון כמומלץ בוטל בהצלחה');

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, isActive: false } : q
        )
      );

      router.refresh();
    } catch (error) {
      console.error('Error deactivating questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בביטול סימון כמומלץ');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublish = async () => {
    if (!publishingId) return;

    setProcessingId(publishingId);

    try {
      await publishQuestionnaire(publishingId);
      toast.success('השאלון פורסם בהצלחה');

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === publishingId ? { ...q, isPublished: true } : q
        )
      );

      setPublishingId(null);
      router.refresh();
    } catch (error) {
      console.error('Error publishing questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בפרסום השאלון');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnpublish = async () => {
    if (!unpublishingId) return;

    setProcessingId(unpublishingId);

    try {
      await unpublishQuestionnaire(unpublishingId);
      toast.success('פרסום השאלון בוטל בהצלחה');

      // Update local state
      setQuestionnaires((prev) =>
        prev.map((q) =>
          q.id === unpublishingId ? { ...q, isPublished: false } : q
        )
      );

      setUnpublishingId(null);
      router.refresh();
    } catch (error) {
      console.error('Error unpublishing questionnaire:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה בביטול פרסום השאלון');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/questionnaire/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('הקישור הועתק ללוח');
  };

  return (
    <>
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right font-semibold">כותרת</TableHead>
              <TableHead className="text-center font-semibold">קישור לשאלון</TableHead>
              <TableHead className="text-center font-semibold">מפורסם</TableHead>
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
                <TableCell colSpan={8} className="h-32 text-center">
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

                  {/* Link */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/questionnaire/${questionnaire.slug}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        questionnaire/{questionnaire.slug}
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyLink(questionnaire.slug)}
                        title="העתק קישור"
                        className="h-6 w-6 p-0"
                      >
                        <Clipboard className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Published Status */}
                  <TableCell className="text-center">
                    <Badge className={questionnaire.isPublished ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                      {questionnaire.isPublished ? 'מפורסם ✅' : 'לא מפורסם ❌'}
                    </Badge>
                  </TableCell>

                  {/* Featured Status */}
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

                      {/* Publish/Unpublish */}
                      {questionnaire.isPublished ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setUnpublishingId(questionnaire.id)}
                          disabled={processingId === questionnaire.id}
                          title="ביטול פרסום"
                        >
                          {processingId === questionnaire.id && unpublishingId === questionnaire.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-orange-600" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPublishingId(questionnaire.id)}
                          disabled={processingId === questionnaire.id}
                          title="פרסום"
                        >
                          <Eye className="h-4 w-4 text-green-600" />
                        </Button>
                      )}

                      {/* Featured/Unfeatured */}
                      {questionnaire.isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeactivate(questionnaire.id)}
                          disabled={processingId === questionnaire.id}
                          title="ביטול סימון כמומלץ"
                        >
                          {processingId === questionnaire.id && !publishingId && !unpublishingId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActivatingId(questionnaire.id)}
                          disabled={processingId === questionnaire.id}
                          title="סימון כמומלץ"
                        >
                          <Star className="h-4 w-4 text-gray-400" />
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

      {/* Featured Confirmation */}
      <AlertDialog open={!!activatingId} onOpenChange={(open) => !open && setActivatingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">סימון שאלון כמומלץ</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              סימון שאלון זה כמומלץ יבטל את הסימון של השאלון המומלץ הנוכחי (אם קיים). רק שאלון אחד יכול להיות מומלץ בכל זמן נתון.
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
                  מסמן...
                </>
              ) : (
                'סמן כמומלץ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation */}
      <AlertDialog open={!!publishingId} onOpenChange={(open) => !open && setPublishingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">פרסום שאלון</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {publishingId && (
                <>
                  השאלון יהיה זמין לציבור בכתובת:{' '}
                  <span className="font-semibold">
                    {window.location.origin}/questionnaire/{questionnaires.find(q => q.id === publishingId)?.slug}
                  </span>
                  <br />
                  האם להמשיך?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId === publishingId}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublish}
              disabled={processingId === publishingId}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId === publishingId ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מפרסם...
                </>
              ) : (
                'פרסם שאלון'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Confirmation */}
      <AlertDialog open={!!unpublishingId} onOpenChange={(open) => !open && setUnpublishingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">ביטול פרסום שאלון</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              השאלון לא יהיה זמין יותר לציבור. האם להמשיך?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId === unpublishingId}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              disabled={processingId === unpublishingId}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processingId === unpublishingId ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מבטל פרסום...
                </>
              ) : (
                'בטל פרסום'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { EditableResponseRow } from './EditableResponseRow';
import { ReadOnlyResponseRow } from './ReadOnlyResponseRow';
import { SubmissionDetailDialog } from './SubmissionDetailDialog';
import { deleteResponse, updateQuestionnaireResponse } from '@/app/actions/response-actions';
import { toast } from 'sonner';
import type { UpdateResponseData } from '@/lib/validation/questionnaire-validation';
import { Search, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface CustomFieldValue {
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
  customFieldValues?: CustomFieldValue[];
}

interface ResponsesTableProps {
  responses: Response[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onDelete: () => void;
  onResponsesChange: (responses: Response[]) => void;
}

export function ResponsesTable({
  responses: initialResponses,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  onDelete,
  onResponsesChange,
}: ResponsesTableProps) {
  const [responses, setResponses] = useState(initialResponses);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());
  const [optimisticData, setOptimisticData] = useState<Map<number, Response>>(new Map());
  const [viewingResponse, setViewingResponse] = useState<Response | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(totalCount / pageSize);

  // Update local state when parent changes responses
  useState(() => {
    setResponses(initialResponses);
  });

  const handleEdit = (responseId: number) => {
    // Only one row editable at a time
    if (editingRowId !== null && editingRowId !== responseId) {
      // Don't allow editing another row while one is already being edited
      toast.warning('נא לשמור או לבטל את השינויים הנוכחיים לפני עריכת שורה אחרת');
      return;
    }
    setEditingRowId(responseId);
  };

  const handleCancel = () => {
    setEditingRowId(null);
  };

  const handleSave = async (responseId: number, data: UpdateResponseData) => {
    // Store original data for rollback
    const originalResponse = responses.find((r) => r.id === responseId);
    if (!originalResponse) return;

    setOptimisticData((prev) => new Map(prev).set(responseId, originalResponse));

    // Update local state immediately (optimistic update)
    const updatedResponses = responses.map((r) =>
      r.id === responseId
        ? {
            ...r,
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            email: data.email,
          }
        : r
    );
    setResponses(updatedResponses);
    onResponsesChange(updatedResponses);

    // Exit edit mode immediately
    setEditingRowId(null);

    // Mark as saving
    setSavingRows((prev) => new Set(prev).add(responseId));

    try {
      // Call server action
      const result = await updateQuestionnaireResponse(responseId, data);

      if (result.success) {
        toast.success('השינויים נשמרו בהצלחה');
        // Remove from optimistic data (no need to rollback)
        setOptimisticData((prev) => {
          const newMap = new Map(prev);
          newMap.delete(responseId);
          return newMap;
        });
      } else {
        // Server error - rollback
        toast.error(result.error || 'שגיאה בשמירת השינויים');
        const rolledBackResponses = responses.map((r) =>
          r.id === responseId ? originalResponse : r
        );
        setResponses(rolledBackResponses);
        onResponsesChange(rolledBackResponses);
        // Re-open edit mode for retry
        setEditingRowId(responseId);
      }
    } catch (error) {
      // Network error - rollback
      console.error('Error updating response:', error);
      toast.error('שגיאה בשמירת השינויים. נסה שוב.');
      const rolledBackResponses = responses.map((r) =>
        r.id === responseId ? originalResponse : r
      );
      setResponses(rolledBackResponses);
      onResponsesChange(rolledBackResponses);
      // Re-open edit mode for retry
      setEditingRowId(responseId);
    } finally {
      // Remove from saving set
      setSavingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(responseId);
        return newSet;
      });
    }
  };

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    setProcessingId(deletingId);

    try {
      const result = await deleteResponse(deletingId);
      toast.success('התשובה נמחקה בהצלחה', {
        description: result.deletedAnswers > 0 ? `נמחקו ${result.deletedAnswers} תשובות` : undefined,
      });

      const updatedResponses = responses.filter((r) => r.id !== deletingId);
      setResponses(updatedResponses);
      onResponsesChange(updatedResponses);
      setDeletingId(null);
      onDelete();
    } catch (error) {
      console.error('Error deleting response:', error);
      toast.error(error instanceof Error ? error.message : 'שגיאה במחיקת התשובה');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="search" className="text-right">
              חיפוש
            </Label>
            <div className="relative">
              <Input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="חפש לפי שם, אימייל או טלפון..."
                className="pr-10 text-right"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
            חיפוש
          </Button>
          {searchQuery && (
            <Button onClick={handleClearSearch} variant="outline">
              <X className="ml-2 h-4 w-4" />
              נקה
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Contact Info Columns */}
              <TableHead className="text-right font-semibold">שם</TableHead>
              <TableHead className="text-center font-semibold">טלפון</TableHead>
              <TableHead className="text-center font-semibold">אימייל</TableHead>
              <TableHead className="text-center font-semibold">תאריך הגשה</TableHead>
              <TableHead className="text-center font-semibold">תשובות</TableHead>

              {/* Actions Column */}
              <TableHead className="text-center font-semibold">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <p>
                      {searchQuery ? 'לא נמצאו תוצאות מתאימות לחיפוש' : 'אין תשובות עדיין'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              responses.map((response) =>
                editingRowId === response.id ? (
                  <EditableResponseRow
                    key={response.id}
                    response={response}
                    onSave={(data) => handleSave(response.id, data)}
                    onCancel={handleCancel}
                    isSaving={savingRows.has(response.id)}
                  />
                ) : (
                  <ReadOnlyResponseRow
                    key={response.id}
                    response={response}
                    onEdit={() => handleEdit(response.id)}
                    onDelete={() => setDeletingId(response.id)}
                    onViewDetails={() => setViewingResponse(response)}
                    isSaving={savingRows.has(response.id)}
                  />
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">
            עמוד {currentPage} מתוך {totalPages} ({totalCount} תשובות)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
              הקודם
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              הבא
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <SubmissionDetailDialog
        open={!!viewingResponse}
        onOpenChange={(open) => !open && setViewingResponse(null)}
        response={viewingResponse}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את התשובה לצמיתות, כולל כל התשובות לשאלות. לא ניתן לשחזר את הנתונים.
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
                'מחק תשובה'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
import { SubmissionDetailDialog } from './SubmissionDetailDialog';
import { deleteResponse } from '@/app/actions/response-actions';
import { toast } from 'sonner';
import {
  formatQuestionnaireDate,
  formatPhoneNumber,
  getRelativeTime,
  formatAnswerSummary,
} from '@/lib/questionnaire-utils';
import {
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

interface SubmissionsTableProps {
  responses: Response[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onDelete: () => void;
}

export function SubmissionsTable({
  responses: initialResponses,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  onDelete,
}: SubmissionsTableProps) {
  const [responses, setResponses] = useState(initialResponses);
  const [viewingResponse, setViewingResponse] = useState<Response | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalPages = Math.ceil(totalCount / pageSize);

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

      setResponses((prev) => prev.filter((r) => r.id !== deletingId));
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
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right font-semibold">שם</TableHead>
              <TableHead className="text-center font-semibold">טלפון</TableHead>
              <TableHead className="text-center font-semibold">אימייל</TableHead>
              <TableHead className="text-center font-semibold">תאריך הגשה</TableHead>
              <TableHead className="text-center font-semibold">תשובות</TableHead>
              <TableHead className="text-center font-semibold">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <p>
                      {searchQuery ? 'לא נמצאו תוצאות מתאימות לחיפוש' : 'אין תשובות עדיין'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              responses.map((response) => (
                <TableRow key={response.id}>
                  {/* Name */}
                  <TableCell className="text-right font-medium">
                    {response.fullName}
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="text-center text-sm">
                    {formatPhoneNumber(response.phoneNumber)}
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-center text-sm">
                    {response.email}
                  </TableCell>

                  {/* Submitted At */}
                  <TableCell className="text-center text-sm text-gray-600">
                    <div>{getRelativeTime(response.submittedAt)}</div>
                    <div className="text-xs text-gray-500">
                      {formatQuestionnaireDate(response.submittedAt)}
                    </div>
                  </TableCell>

                  {/* Answers Summary */}
                  <TableCell className="text-center">
                    <span className="font-semibold text-blue-600">
                      {response.answers.length}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* View Details */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewingResponse(response)}
                        title="הצג פרטים"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(response.id)}
                        disabled={processingId === response.id}
                        title="מחיקה"
                      >
                        {processingId === response.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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

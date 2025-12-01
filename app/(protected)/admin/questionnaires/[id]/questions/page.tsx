'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QuestionList } from '@/components/admin/questionnaires/QuestionList';
import { QuestionDialog } from '@/components/admin/questionnaires/QuestionDialog';
import { getQuestionnaireById } from '@/app/actions/questionnaire-actions';
import { getQuestionnaireQuestions } from '@/app/actions/question-actions';
import { Plus, ArrowLeft, Loader2, FileQuestion } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function QuestionManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const questionnaireId = parseInt(id);

  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [questionnaireData, questionsData] = await Promise.all([
        getQuestionnaireById(questionnaireId),
        getQuestionnaireQuestions(questionnaireId),
      ]);
      setQuestionnaire(questionnaireData);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [questionnaireId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/questionnaires">
                <ArrowLeft className="ml-2 h-4 w-4" />
                חזרה לשאלונים
              </Link>
            </Button>
          </div>

          {questionnaire && (
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">{questionnaire.title}</h1>
              {questionnaire.description && (
                <p className="mt-2 text-gray-600">{questionnaire.description}</p>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={() => setAddDialogOpen(true)}
          className="shrink-0 bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          <Plus className="ml-2 h-5 w-5" aria-hidden="true" />
          הוסף שאלה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">סך שאלות</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {isLoading ? '...' : questions.length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">שאלות חובה</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {isLoading ? '...' : questions.filter((q) => q.isRequired).length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">סך תשובות</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {isLoading
              ? '...'
              : questions.reduce((sum, q) => sum + (q._count?.answers || 0), 0)}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-right">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border bg-white p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && questions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-12 text-center">
          <FileQuestion className="h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">אין שאלות בשאלון</h3>
          <p className="mt-2 text-gray-600">התחל על ידי הוספת שאלה ראשונה</p>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="mt-6 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="ml-2 h-5 w-5" />
            הוסף שאלה ראשונה
          </Button>
        </div>
      )}

      {/* Question List */}
      {!isLoading && !error && questions.length > 0 && (
        <QuestionList
          questionnaireId={questionnaireId}
          questions={questions}
          onUpdate={loadData}
        />
      )}

      {/* Add Dialog */}
      <QuestionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        questionnaireId={questionnaireId}
        onSuccess={loadData}
      />
    </div>
  );
}

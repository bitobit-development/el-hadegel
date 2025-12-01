'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QuestionnaireTable } from '@/components/admin/questionnaires/QuestionnaireTable';
import { QuestionnaireDialog } from '@/components/admin/questionnaires/QuestionnaireDialog';
import { getAllQuestionnaires } from '@/app/actions/questionnaire-actions';
import { Plus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadQuestionnaires = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllQuestionnaires();
      setQuestionnaires(data);
    } catch (err) {
      console.error('Error loading questionnaires:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת השאלונים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">ניהול שאלונים</h1>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="ml-2 h-5 w-5" aria-hidden="true" />
          שאלון חדש
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">סך הכל שאלונים</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {isLoading ? '...' : questionnaires.length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">שאלונים פעילים</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {isLoading ? '...' : questionnaires.filter((q) => q.isActive).length}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">סך תשובות</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">
            {isLoading
              ? '...'
              : questionnaires.reduce((sum, q) => sum + q._count.responses, 0)}
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

      {/* Table */}
      {!isLoading && !error && <QuestionnaireTable questionnaires={questionnaires} />}

      {/* Create Dialog */}
      <QuestionnaireDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadQuestionnaires}
      />
    </div>
  );
}

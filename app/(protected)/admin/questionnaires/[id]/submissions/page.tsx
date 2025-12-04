'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ResponsesTable } from '@/components/admin/questionnaires/ResponsesTable';
import { QuestionStatsCard } from '@/components/admin/questionnaires/QuestionStatsCard';
import { getQuestionnaireById } from '@/app/actions/questionnaire-actions';
import {
  getQuestionnaireResponses,
  getResponseStatistics,
  getResponsesForExport,
} from '@/app/actions/response-actions';
import { getCustomFieldDefinitions } from '@/app/actions/custom-field-actions';
import { ArrowLeft, Loader2, Download, TrendingUp, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRelativeTime, generateExcelFilename } from '@/lib/questionnaire-utils';
import { exportResponsesToExcel } from '@/lib/excel-export';
import { toast } from 'sonner';

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const questionnaireId = parseInt(id);

  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const pageSize = 20;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [questionnaireData, responsesData, customFieldsData, statsData] = await Promise.all([
        getQuestionnaireById(questionnaireId),
        getQuestionnaireResponses(
          questionnaireId,
          searchQuery ? { search: searchQuery } : undefined,
          { limit: pageSize, offset: (currentPage - 1) * pageSize }
        ),
        getCustomFieldDefinitions(questionnaireId),
        getResponseStatistics(questionnaireId),
      ]);

      setQuestionnaire(questionnaireData);
      setResponses(responsesData.responses);
      setCustomFields(customFieldsData);
      setTotalCount(responsesData.totalCount);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [questionnaireId, currentPage, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1); // Reset to first page
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch all responses (no pagination) with custom fields
      const exportData = await getResponsesForExport(questionnaireId);

      // Generate Excel blob
      const blob = await exportResponsesToExcel(exportData.questionnaireTitle, {
        questions: exportData.questions,
        data: exportData.data,
      });

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateExcelFilename(exportData.questionnaireTitle);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`ייצוא הושלם בהצלחה - ${exportData.data.length} תשובות`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('שגיאה בייצוא לאקסל');
    } finally {
      setIsExporting(false);
    }
  };

  const averageAnswerRate =
    statistics && statistics.totalResponses > 0 && statistics.totalQuestions > 0
      ? (statistics.questionStats.reduce(
          (sum: number, stat: any) => sum + stat.totalAnswers,
          0
        ) /
          (statistics.totalResponses * statistics.totalQuestions)) *
        100
      : 0;

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

        <div className="flex shrink-0 gap-2">
          <Link href={`/admin/questionnaires/${questionnaireId}/custom-fields`}>
            <Button variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
              <Settings className="ml-2 h-5 w-5" />
              נהל שדות מותאמים
            </Button>
          </Link>
          <Button
            onClick={handleExport}
            disabled={isExporting || responses.length === 0}
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-100"
          >
            {isExporting ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                מייצא...
              </>
            ) : (
              <>
                <Download className="ml-2 h-5 w-5" />
                ייצא לאקסל
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            <TrendingUp className="ml-2 h-5 w-5" />
            {showStats ? 'הסתר סטטיסטיקות' : 'הצג סטטיסטיקות'}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">סך תשובות</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {isLoading ? '...' : statistics?.totalResponses || 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">אחוז תשובה ממוצע</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {isLoading ? '...' : `${Math.round(averageAnswerRate)}%`}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">תשובה אחרונה</div>
          <div className="mt-2 text-lg font-bold text-purple-600">
            {isLoading
              ? '...'
              : statistics?.recentResponses?.[0]
                ? getRelativeTime(statistics.recentResponses[0].submittedAt)
                : 'אין'}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600">שאלות בשאלון</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {isLoading ? '...' : statistics?.totalQuestions || 0}
          </div>
        </div>
      </div>

      {/* Question Statistics */}
      {showStats && statistics && statistics.questionStats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 text-right">
            סטטיסטיקות שאלות
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statistics.questionStats.map((stat: any) => (
              <QuestionStatsCard
                key={stat.questionId}
                stat={stat}
                totalResponses={statistics.totalResponses}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Submissions Table */}
      {!isLoading && !error && questionnaire && (
        <ResponsesTable
          responses={responses}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onDelete={loadData}
          onResponsesChange={setResponses}
        />
      )}
    </div>
  );
}

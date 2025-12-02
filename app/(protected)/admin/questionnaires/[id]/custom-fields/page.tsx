import { getQuestionnaireById } from '@/app/actions/questionnaire-actions';
import { getCustomFieldDefinitions } from '@/app/actions/custom-field-actions';
import { CustomFieldManager } from '@/components/admin/questionnaires/CustomFieldManager';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function CustomFieldsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const questionnaireId = parseInt(id);

  const [questionnaire, customFields] = await Promise.all([
    getQuestionnaireById(questionnaireId),
    getCustomFieldDefinitions(questionnaireId),
  ]);

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-right">
            שדות מותאמים אישית
          </h1>
          <p className="mt-2 text-gray-600 text-right">
            שאלון: {questionnaire.title}
          </p>
        </div>
        <Link href={`/admin/questionnaires/${questionnaireId}/submissions`}>
          <Button variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            חזרה לתשובות
          </Button>
        </Link>
      </div>

      {/* Custom Field Manager */}
      <CustomFieldManager
        questionnaireId={questionnaireId}
        fields={customFields}
      />
    </div>
  );
}
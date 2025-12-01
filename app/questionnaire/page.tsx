import { getActiveQuestionnaire } from '@/app/actions/questionnaire-actions';
import { QuestionnaireForm } from '@/components/questionnaire/QuestionnaireForm';
import { QuestionnaireHeader } from '@/components/questionnaire/QuestionnaireHeader';
import { AlertCircle, FileQuestion } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import '@/components/questionnaire/questionnaire-animations.css';

export const metadata = {
  title: 'שאלון | EL HADEGEL',
  description: 'מלא את השאלון והשמע את קולך',
};

export default async function QuestionnairePage() {
  try {
    const questionnaire = await getActiveQuestionnaire();

    if (!questionnaire) {
      return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Alert className="border-yellow-200 bg-yellow-50">
            <FileQuestion className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-right text-yellow-900">
              אין שאלון פעיל כרגע
            </AlertTitle>
            <AlertDescription className="text-right text-yellow-800">
              אנחנו עובדים על שאלון חדש. אנא בדוק שוב מאוחר יותר.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="questionnaire-container min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <QuestionnaireHeader
          title={questionnaire.title}
          description={questionnaire.description}
        />
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <QuestionnaireForm questionnaire={questionnaire} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading questionnaire:', error);

    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-right">שגיאה בטעינת השאלון</AlertTitle>
          <AlertDescription className="text-right">
            {error instanceof Error ? error.message : 'אירעה שגיאה בלתי צפויה. אנא נסה שוב מאוחר יותר.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}

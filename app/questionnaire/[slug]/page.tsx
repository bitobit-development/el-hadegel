import { getQuestionnaireBySlug } from '@/app/actions/questionnaire-actions';
import { QuestionnaireForm } from '@/components/questionnaire/QuestionnaireForm';
import { QuestionnaireHeader } from '@/components/questionnaire/QuestionnaireHeader';
import { notFound } from 'next/navigation';
import '@/components/questionnaire/questionnaire-animations.css';

interface QuestionnairePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: QuestionnairePageProps) {
  const questionnaire = await getQuestionnaireBySlug(params.slug);

  if (!questionnaire) {
    return {
      title: 'שאלון לא נמצא | EL HADEGEL',
      description: 'השאלון שביקשת אינו זמין',
    };
  }

  return {
    title: `${questionnaire.title} | EL HADEGEL`,
    description: questionnaire.description || 'מלא את השאלון והשמע את קולך',
  };
}

export default async function QuestionnairePage({ params }: QuestionnairePageProps) {
  const questionnaire = await getQuestionnaireBySlug(params.slug);

  // Return 404 if not found or not published
  if (!questionnaire) {
    notFound();
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
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContactFields } from './ContactFields';
import { QuestionCard } from './QuestionCard';
import { submitQuestionnaireResponse } from '@/app/actions/response-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { QuestionnaireResponseInput } from '@/lib/validation/questionnaire-validation';

interface Question {
  id: number;
  questionText: string;
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT';
  isRequired: boolean;
  maxLength: number | null;
  orderIndex: number;
}

interface Questionnaire {
  id: number;
  title: string;
  description: string | null;
  questions: Question[];
}

interface QuestionnaireFormProps {
  questionnaire: Questionnaire;
}

export function QuestionnaireForm({ questionnaire }: QuestionnaireFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
  });
  const [answers, setAnswers] = useState<Record<number, { answer?: boolean; textAnswer?: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContactChange = (field: string, value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAnswerChange = (questionId: number, value: { answer?: boolean; textAnswer?: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error when user answers
    if (errors[`question-${questionId}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`question-${questionId}`];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate contact info
    if (!contactInfo.fullName.trim()) {
      newErrors.fullName = 'שם מלא הוא שדה חובה';
    } else if (contactInfo.fullName.length < 2) {
      newErrors.fullName = 'שם מלא חייב להכיל לפחות 2 תווים';
    }

    if (!contactInfo.phoneNumber.trim()) {
      newErrors.phoneNumber = 'מספר טלפון הוא שדה חובה';
    } else if (!/^(\+972|0)?[-\s]?5[0-9][-\s]?\d{3}[-\s]?\d{4}$/.test(contactInfo.phoneNumber)) {
      newErrors.phoneNumber = 'מספר טלפון לא תקין';
    }

    if (!contactInfo.email.trim()) {
      newErrors.email = 'כתובת אימייל היא שדה חובה';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    // Validate required questions
    questionnaire.questions.forEach((question) => {
      if (question.isRequired) {
        const answer = answers[question.id];

        if (question.questionType === 'YES_NO') {
          if (answer?.answer === undefined || answer?.answer === null) {
            newErrors[`question-${question.id}`] = 'יש לבחור כן או לא';
          }
        } else if (question.questionType === 'TEXT' || question.questionType === 'LONG_TEXT') {
          if (!answer?.textAnswer || answer.textAnswer.trim() === '') {
            newErrors[`question-${question.id}`] = 'שדה זה הוא שדה חובה';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('אנא תקן את השגיאות בטופס');
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const element = document.getElementById(firstError);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare answers array
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        answer: value.answer !== undefined ? value.answer : null,
        textAnswer: value.textAnswer || null,
      }));

      // Submit response
      await submitQuestionnaireResponse({
        questionnaireId: questionnaire.id,
        fullName: contactInfo.fullName,
        phoneNumber: contactInfo.phoneNumber,
        email: contactInfo.email,
        answers: answersArray,
      });

      toast.success('התשובות נשלחו בהצלחה!', {
        description: 'תודה שמילאת את השאלון. נציגינו ייצרו איתך קשר בהקדם.',
      });

      // Reset form
      setContactInfo({ fullName: '', phoneNumber: '', email: '' });
      setAnswers({});
      setErrors({});

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      toast.error(
        error instanceof Error ? error.message : 'שגיאה בשליחת התשובות. אנא נסה שוב.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Questionnaire Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          {questionnaire.title}
        </h1>
        {questionnaire.description && (
          <p className="mt-4 text-lg text-gray-600">
            {questionnaire.description}
          </p>
        )}
      </div>

      {/* Contact Information */}
      <ContactFields
        fullName={contactInfo.fullName}
        phoneNumber={contactInfo.phoneNumber}
        email={contactInfo.email}
        errors={{
          fullName: errors.fullName,
          phoneNumber: errors.phoneNumber,
          email: errors.email,
        }}
        onChange={handleContactChange}
      />

      {/* Questions */}
      <div className="space-y-6">
        {questionnaire.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={index + 1}
            value={answers[question.id] || {}}
            onChange={(value) => handleAnswerChange(question.id, value)}
            error={errors[`question-${question.id}`]}
          />
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-lg font-semibold hover:bg-blue-700 sm:w-auto sm:px-12"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" aria-hidden="true" />
              שולח...
            </>
          ) : (
            'שלח תשובות'
          )}
        </Button>
      </div>
    </form>
  );
}

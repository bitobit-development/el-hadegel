/**
 * Validation Schemas for Questionnaire System
 * Uses Zod for type-safe validation with Hebrew error messages
 */

import { z } from 'zod';

// Question Types
export const QuestionTypeSchema = z.enum(['YES_NO', 'TEXT', 'LONG_TEXT'], {
  message: 'סוג שאלה לא תקין',
});

// Israeli Phone Number Regex
// Supports formats: 05XXXXXXXX, 050-1234567, 050-123-4567, +972-50-1234567, +97250-1234567
const ISRAELI_PHONE_REGEX = /^(\+972|0)?[-\s]?5[0-9][-\s]?\d{3}[-\s]?\d{4}$/;

/**
 * Questionnaire Schema
 * For creating/updating questionnaires
 */
export const questionnaireSchema = z.object({
  title: z
    .string()
    .min(5, 'כותרת השאלון חייבת להכיל לפחות 5 תווים')
    .max(500, 'כותרת השאלון לא יכולה לעלות על 500 תווים'),
  description: z
    .string()
    .max(2000, 'תיאור השאלון לא יכול לעלות על 2000 תווים')
    .optional()
    .nullable(),
});

export type QuestionnaireInput = z.infer<typeof questionnaireSchema>;

/**
 * Question Schema
 * For creating/updating individual questions
 */
export const questionSchema = z.object({
  questionnaireId: z
    .number()
    .int('מזהה שאלון חייב להיות מספר שלם')
    .positive('מזהה שאלון חייב להיות חיובי'),
  questionText: z
    .string()
    .min(10, 'נוסח השאלה חייב להכיל לפחות 10 תווים')
    .max(1000, 'נוסח השאלה לא יכול לעלות על 1000 תווים'),
  questionType: QuestionTypeSchema.default('YES_NO'),
  isRequired: z.boolean().default(true),
  maxLength: z
    .number()
    .int('אורך מקסימלי חייב להיות מספר שלם')
    .positive('אורך מקסימלי חייב להיות חיובי')
    .max(5000, 'אורך מקסימלי לא יכול לעלות על 5000 תווים')
    .optional()
    .nullable(),
  allowTextExplanation: z.boolean().default(false),
  explanationMaxLength: z
    .number()
    .int('אורך מקסימלי להסבר חייב להיות מספר שלם')
    .positive('אורך מקסימלי להסבר חייב להיות חיובי')
    .max(2000, 'אורך מקסימלי להסבר לא יכול לעלות על 2000 תווים')
    .default(500)
    .optional()
    .nullable(),
  explanationLabel: z
    .string()
    .max(200, 'תווית הסבר לא יכולה לעלות על 200 תווים')
    .optional()
    .nullable(),
  orderIndex: z
    .number()
    .int('מספר סידורי חייב להיות מספר שלם')
    .nonnegative('מספר סידורי חייב להיות אפס או חיובי'),
});

export type QuestionInput = z.infer<typeof questionSchema>;

/**
 * Question Update Schema (without questionnaireId and orderIndex)
 * For updating existing questions
 */
export const questionUpdateSchema = questionSchema
  .omit({ questionnaireId: true, orderIndex: true })
  .partial();

export type QuestionUpdate = z.infer<typeof questionUpdateSchema>;

/**
 * Response Answer Schema
 * For individual answers to questions
 */
export const responseAnswerSchema = z.object({
  questionId: z
    .number()
    .int('מזהה שאלה חייב להיות מספר שלם')
    .positive('מזהה שאלה חייב להיות חיובי'),
  // For YES_NO questions
  answer: z.boolean().optional().nullable(),
  // For TEXT/LONG_TEXT questions
  textAnswer: z
    .string()
    .max(5000, 'תשובה טקסטואלית לא יכולה לעלות על 5000 תווים')
    .optional()
    .nullable(),
  // Optional explanation text for YES_NO questions
  explanationText: z
    .string()
    .max(2000, 'הסבר לא יכול לעלות על 2000 תווים')
    .optional()
    .nullable(),
});

export type ResponseAnswerInput = z.infer<typeof responseAnswerSchema>;

/**
 * Questionnaire Response Schema
 * For submitting responses to questionnaires
 */
export const questionnaireResponseSchema = z.object({
  questionnaireId: z
    .number()
    .int('מזהה שאלון חייב להיות מספר שלם')
    .positive('מזהה שאלון חייב להיות חיובי'),
  fullName: z
    .string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(200, 'שם מלא לא יכול לעלות על 200 תווים')
    .regex(/^[\u0590-\u05FF\s\-a-zA-Z]+$/, 'שם מלא יכול להכיל רק אותיות, רווחים ומקפים'),
  phoneNumber: z
    .string()
    .regex(
      ISRAELI_PHONE_REGEX,
      'מספר טלפון לא תקין. פורמט תקין: 05XXXXXXXX, 050-1234567, או +972-50-1234567'
    ),
  email: z
    .string()
    .email('כתובת אימייל לא תקינה')
    .max(320, 'כתובת אימייל לא יכולה לעלות על 320 תווים'),
  answers: z
    .array(responseAnswerSchema)
    .min(1, 'יש לענות לפחות על שאלה אחת')
    .max(100, 'לא ניתן לענות על יותר מ-100 שאלות'),
});

export type QuestionnaireResponseInput = z.infer<typeof questionnaireResponseSchema>;

/**
 * Reorder Questions Schema
 * For updating question order in bulk
 */
export const reorderQuestionsSchema = z.object({
  questionnaireId: z
    .number()
    .int('מזהה שאלון חייב להיות מספר שלם')
    .positive('מזהה שאלון חייב להיות חיובי'),
  questionIds: z
    .array(
      z.number().int('מזהה שאלה חייב להיות מספר שלם').positive('מזהה שאלה חייב להיות חיובי')
    )
    .min(1, 'יש לספק לפחות שאלה אחת')
    .max(100, 'לא ניתן לסדר יותר מ-100 שאלות בבת אחת'),
});

export type ReorderQuestionsInput = z.infer<typeof reorderQuestionsSchema>;

/**
 * Validation Functions
 */

/**
 * Normalize Israeli phone number to standard format (05XXXXXXXX)
 * Removes spaces, dashes, and +972 prefix
 */
export function normalizeIsraeliPhone(phone: string): string {
  // Remove all spaces and dashes
  let normalized = phone.replace(/[\s\-]/g, '');

  // Remove +972 prefix and add leading 0
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.slice(4);
  }

  // Remove leading 0 if double (e.g., 0050 -> 050)
  if (normalized.startsWith('00')) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

/**
 * Validate answer based on question type
 * Returns true if answer is valid for question type
 */
export function validateAnswerForQuestionType(
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT',
  answer: ResponseAnswerInput
): { valid: boolean; error?: string } {
  if (questionType === 'YES_NO') {
    if (answer.answer === null || answer.answer === undefined) {
      return { valid: false, error: 'יש לבחור כן או לא' };
    }
    return { valid: true };
  }

  if (questionType === 'TEXT' || questionType === 'LONG_TEXT') {
    if (!answer.textAnswer || answer.textAnswer.trim() === '') {
      return { valid: false, error: 'יש למלא תשובה טקסטואלית' };
    }

    const maxLength = questionType === 'TEXT' ? 500 : 2000;
    if (answer.textAnswer.length > maxLength) {
      return { valid: false, error: `תשובה לא יכולה לעלות על ${maxLength} תווים` };
    }

    return { valid: true };
  }

  return { valid: false, error: 'סוג שאלה לא ידוע' };
}

/**
 * Validate that all required questions have answers
 * Returns list of missing question IDs
 */
export function validateRequiredQuestions(
  requiredQuestionIds: number[],
  providedAnswers: ResponseAnswerInput[]
): number[] {
  const answeredIds = new Set(providedAnswers.map((a) => a.questionId));
  return requiredQuestionIds.filter((id) => !answeredIds.has(id));
}

/**
 * Validate explanation text for YES_NO questions
 * Returns validation result with Hebrew error message
 */
export function validateExplanationText(
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT',
  allowTextExplanation: boolean,
  explanationText: string | null | undefined,
  maxLength: number = 500
): { valid: boolean; error?: string } {
  // Only validate for YES_NO questions with feature enabled
  if (questionType !== 'YES_NO' || !allowTextExplanation) {
    return { valid: true };
  }

  // Explanation is always optional
  if (!explanationText || explanationText.trim() === '') {
    return { valid: true };
  }

  // Check length
  if (explanationText.length > maxLength) {
    return {
      valid: false,
      error: `הסבר לא יכול לעלות על ${maxLength} תווים`
    };
  }

  return { valid: true };
}

/**
 * Update Response Schema
 * For inline editing of questionnaire responses in admin
 * Only allows editing: fullName, phoneNumber, email
 */
export const updateResponseSchema = z.object({
  fullName: z
    .string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(100, 'שם מלא לא יכול לעלות על 100 תווים')
    .trim()
    .regex(/^[\u0590-\u05FF\s\-a-zA-Z]+$/, 'שם מלא יכול להכיל רק אותיות, רווחים ומקפים'),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^05\d{8}$/, 'מספר טלפון לא תקין (פורמט נדרש: 05XXXXXXXX)'),
  email: z
    .string()
    .email('כתובת אימייל לא תקינה')
    .max(255, 'כתובת אימייל לא יכולה לעלות על 255 תווים')
    .trim()
    .toLowerCase(),
});

export type UpdateResponseData = z.infer<typeof updateResponseSchema>;

'use server';

import { auth } from '@/auth';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import { revalidatePath } from 'next/cache';

/**
 * Update a question answer for a specific response
 *
 * Supports YES_NO (boolean), TEXT (string), and LONG_TEXT (string) question types.
 * Uses upsert logic to update existing answers or create new ones.
 *
 * @param responseId - The ID of the questionnaire response
 * @param questionId - The ID of the question being answered
 * @param value - The answer value (boolean for YES_NO, string for TEXT/LONG_TEXT, null for empty)
 * @returns Success object or error object with Hebrew error message
 *
 * @example
 * // Update YES_NO answer
 * await updateResponseAnswer(1, 8, true);
 *
 * // Update TEXT answer
 * await updateResponseAnswer(1, 9, 'תשובה בעברית');
 *
 * // Clear answer
 * await updateResponseAnswer(1, 10, null);
 */
export async function updateResponseAnswer(
  responseId: number,
  questionId: number,
  value: boolean | string | null
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    // Authentication check
    const session = await auth();
    if (!session) {
      return { success: false, error: 'אין הרשאה לבצע פעולה זו' };
    }

    // Verify response exists
    const response = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id: responseId },
      select: { id: true },
    });

    if (!response) {
      return { success: false, error: 'התשובה לא נמצאה' };
    }

    // Fetch question to determine type and validation rules
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        questionType: true,
        isRequired: true,
        questionText: true,
      },
    });

    if (!question) {
      return { success: false, error: 'השאלה לא נמצאה' };
    }

    // Type-specific validation
    if (question.questionType === 'YES_NO') {
      // YES_NO: Must be boolean or null
      if (value !== null && typeof value !== 'boolean') {
        return { success: false, error: 'ערך חייב להיות כן/לא או ריק' };
      }

      // Required check for YES_NO
      if (question.isRequired && value === null) {
        return { success: false, error: 'שדה זה הוא חובה' };
      }
    } else if (question.questionType === 'TEXT') {
      // TEXT: Must be string or null
      if (value !== null && typeof value !== 'string') {
        return { success: false, error: 'ערך חייב להיות טקסט' };
      }

      // Trim whitespace
      const textValue = typeof value === 'string' ? value.trim() : null;

      // Required check for TEXT
      if (question.isRequired && (!textValue || textValue.length === 0)) {
        return { success: false, error: 'שדה זה הוא חובה' };
      }

      // Length validation for TEXT (max 500 chars)
      if (textValue && textValue.length > 500) {
        return { success: false, error: 'טקסט לא יכול לעלות על 500 תווים' };
      }

      // Update value to trimmed version
      value = textValue;
    } else if (question.questionType === 'LONG_TEXT') {
      // LONG_TEXT: Must be string or null
      if (value !== null && typeof value !== 'string') {
        return { success: false, error: 'ערך חייב להיות טקסט' };
      }

      // Trim whitespace
      const textValue = typeof value === 'string' ? value.trim() : null;

      // Required check for LONG_TEXT
      if (question.isRequired && (!textValue || textValue.length === 0)) {
        return { success: false, error: 'שדה זה הוא חובה' };
      }

      // Length validation for LONG_TEXT (max 2000 chars)
      if (textValue && textValue.length > 2000) {
        return { success: false, error: 'טקסט לא יכול לעלות על 2000 תווים' };
      }

      // Update value to trimmed version
      value = textValue;
    } else {
      return { success: false, error: 'סוג שאלה לא נתמך' };
    }

    // Prepare data for upsert
    const updateData: {
      answer: boolean | null;
      textAnswer: string | null;
    } = {
      answer: null,
      textAnswer: null,
    };

    if (question.questionType === 'YES_NO') {
      updateData.answer = value as boolean | null;
    } else {
      // TEXT or LONG_TEXT
      updateData.textAnswer = value as string | null;
    }

    // Upsert answer (update if exists, create if not)
    await prismaQuestionnaire.responseAnswer.upsert({
      where: {
        responseId_questionId: {
          responseId,
          questionId,
        },
      },
      update: updateData,
      create: {
        responseId,
        questionId,
        ...updateData,
      },
    });

    // Revalidate admin pages to reflect changes
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${question.id}/submissions`);

    return { success: true };
  } catch (error) {
    console.error('Error updating response answer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בעדכון התשובה',
    };
  }
}

/**
 * Get all data needed for editing a specific response
 *
 * Includes response details, all answers with question info, and custom field values.
 * Useful for loading data into edit dialogs or detail views.
 *
 * @param responseId - The ID of the questionnaire response
 * @returns Response data with answers and custom fields, or null if not found
 */
export async function getEditableResponseData(responseId: number) {
  try {
    const session = await auth();
    if (!session) {
      throw new Error('Unauthorized');
    }

    const response = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id: responseId },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                isRequired: true,
                orderIndex: true,
              },
            },
          },
          orderBy: {
            question: {
              orderIndex: 'asc',
            },
          },
        },
        customFieldValues: {
          include: {
            field: {
              select: {
                id: true,
                fieldName: true,
                fieldType: true,
                fieldOptions: true,
                isRequired: true,
                orderIndex: true,
              },
            },
          },
          orderBy: {
            field: {
              orderIndex: 'asc',
            },
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error fetching editable response data:', error);
    return null;
  }
}

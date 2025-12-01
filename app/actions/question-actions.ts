/**
 * Server Actions for Question Management
 * Handles CRUD operations for questions within questionnaires
 *
 * IMPORTANT: This uses a separate database (prismaQuestionnaire)
 * completely isolated from the main database (prisma).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import {
  questionSchema,
  questionUpdateSchema,
  reorderQuestionsSchema,
  type QuestionInput,
  type QuestionUpdate,
  type ReorderQuestionsInput,
} from '@/lib/validation/questionnaire-validation';
import { readExcelFile, importQuestions } from '@/scripts/import-questions-from-excel';

/**
 * Get all questions for a questionnaire
 * Ordered by orderIndex
 */
export async function getQuestionnaireQuestions(questionnaireId: number) {
  try {
    const questions = await prismaQuestionnaire.question.findMany({
      where: { questionnaireId },
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { answers: true },
        },
      },
    });

    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error('שגיאה בטעינת השאלות');
  }
}

/**
 * Get single question by ID
 */
export async function getQuestionById(id: number) {
  try {
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id },
      include: {
        questionnaire: {
          select: { id: true, title: true },
        },
      },
    });

    if (!question) {
      throw new Error('שאלה לא נמצאה');
    }

    return question;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בטעינת השאלה');
  }
}

/**
 * Create new question
 * Automatically assigns next available orderIndex
 */
export async function createQuestion(data: Omit<QuestionInput, 'orderIndex'>) {
  try {
    // Check questionnaire exists
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id: data.questionnaireId },
      include: {
        questions: {
          select: { orderIndex: true },
          orderBy: { orderIndex: 'desc' },
          take: 1,
        },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Get next order index
    const maxOrderIndex = questionnaire.questions[0]?.orderIndex ?? -1;
    const nextOrderIndex = maxOrderIndex + 1;

    // Validate input with orderIndex
    const validated = questionSchema.parse({
      ...data,
      orderIndex: nextOrderIndex,
    });

    // Create question
    const question = await prismaQuestionnaire.question.create({
      data: {
        questionnaireId: validated.questionnaireId,
        questionText: validated.questionText,
        questionType: validated.questionType,
        isRequired: validated.isRequired,
        maxLength: validated.maxLength || null,
        orderIndex: validated.orderIndex,
      },
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${data.questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${data.questionnaireId}/questions`);

    return question;
  } catch (error) {
    console.error('Error creating question:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים');
    }
    throw new Error(error instanceof Error ? error.message : 'שגיאה ביצירת השאלה');
  }
}

/**
 * Update question
 * Can update all fields except questionnaireId and orderIndex
 */
export async function updateQuestion(id: number, data: QuestionUpdate) {
  try {
    // Check question exists
    const existing = await prismaQuestionnaire.question.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('שאלה לא נמצאה');
    }

    // Validate input
    const validated = questionUpdateSchema.parse(data);

    // Update question
    const updated = await prismaQuestionnaire.question.update({
      where: { id },
      data: validated,
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${existing.questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${existing.questionnaireId}/questions`);

    return updated;
  } catch (error) {
    console.error('Error updating question:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים');
    }
    throw new Error(error instanceof Error ? error.message : 'שגיאה בעדכון השאלה');
  }
}

/**
 * Delete question
 * Cascades to answers
 */
export async function deleteQuestion(id: number) {
  try {
    // Check question exists
    const existing = await prismaQuestionnaire.question.findUnique({
      where: { id },
      include: {
        _count: { select: { answers: true } },
      },
    });

    if (!existing) {
      throw new Error('שאלה לא נמצאה');
    }

    const questionnaireId = existing.questionnaireId;

    // Delete question (cascades to answers)
    await prismaQuestionnaire.question.delete({
      where: { id },
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${questionnaireId}/questions`);

    return {
      success: true,
      deletedAnswers: existing._count.answers,
    };
  } catch (error) {
    console.error('Error deleting question:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה במחיקת השאלה');
  }
}

/**
 * Reorder questions
 * Updates orderIndex for all provided questions
 * Expects questionIds in desired order (0, 1, 2, ...)
 */
export async function reorderQuestions(data: ReorderQuestionsInput) {
  try {
    // Validate input
    const validated = reorderQuestionsSchema.parse(data);

    // Check questionnaire exists
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id: validated.questionnaireId },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Update orderIndex for all questions in transaction
    await prismaQuestionnaire.$transaction(
      validated.questionIds.map((questionId, index) =>
        prismaQuestionnaire.question.update({
          where: { id: questionId },
          data: { orderIndex: index },
        })
      )
    );

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${validated.questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${validated.questionnaireId}/questions`);

    return { success: true };
  } catch (error) {
    console.error('Error reordering questions:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים');
    }
    throw new Error('שגיאה בשינוי סדר השאלות');
  }
}

/**
 * Move question up (decrease orderIndex)
 */
export async function moveQuestionUp(id: number) {
  try {
    // Get question
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new Error('שאלה לא נמצאה');
    }

    if (question.orderIndex === 0) {
      throw new Error('השאלה כבר במקום הראשון');
    }

    // Get question above (orderIndex - 1)
    const questionAbove = await prismaQuestionnaire.question.findFirst({
      where: {
        questionnaireId: question.questionnaireId,
        orderIndex: question.orderIndex - 1,
      },
    });

    if (!questionAbove) {
      throw new Error('לא נמצאה שאלה מעל');
    }

    // Swap orderIndex in transaction
    await prismaQuestionnaire.$transaction([
      prismaQuestionnaire.question.update({
        where: { id: question.id },
        data: { orderIndex: question.orderIndex - 1 },
      }),
      prismaQuestionnaire.question.update({
        where: { id: questionAbove.id },
        data: { orderIndex: questionAbove.orderIndex + 1 },
      }),
    ]);

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${question.questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${question.questionnaireId}/questions`);

    return { success: true };
  } catch (error) {
    console.error('Error moving question up:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בהזזת השאלה למעלה');
  }
}

/**
 * Move question down (increase orderIndex)
 */
export async function moveQuestionDown(id: number) {
  try {
    // Get question
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id },
    });

    if (!question) {
      throw new Error('שאלה לא נמצאה');
    }

    // Get question below (orderIndex + 1)
    const questionBelow = await prismaQuestionnaire.question.findFirst({
      where: {
        questionnaireId: question.questionnaireId,
        orderIndex: question.orderIndex + 1,
      },
    });

    if (!questionBelow) {
      throw new Error('השאלה כבר במקום האחרון');
    }

    // Swap orderIndex in transaction
    await prismaQuestionnaire.$transaction([
      prismaQuestionnaire.question.update({
        where: { id: question.id },
        data: { orderIndex: question.orderIndex + 1 },
      }),
      prismaQuestionnaire.question.update({
        where: { id: questionBelow.id },
        data: { orderIndex: questionBelow.orderIndex - 1 },
      }),
    ]);

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${question.questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${question.questionnaireId}/questions`);

    return { success: true };
  } catch (error) {
    console.error('Error moving question down:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בהזזת השאלה למטה');
  }
}

/**
 * Import questions from Excel file
 * Server action wrapper for the Excel import script
 */
export async function importQuestionsFromExcel(questionnaireId: number, filePath: string) {
  try {
    // Read and parse Excel file
    const questions = readExcelFile(filePath);

    // Import to database
    const imported = await importQuestions(questionnaireId, questions);

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${questionnaireId}`);
    revalidatePath(`/admin/questionnaires/${questionnaireId}/questions`);

    return {
      success: true,
      imported: imported.length,
      questions: imported,
    };
  } catch (error) {
    console.error('Error importing questions from Excel:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בייבוא שאלות מאקסל');
  }
}

/**
 * Get question statistics
 * Returns answer distribution for a question
 */
export async function getQuestionStatistics(id: number) {
  try {
    const question = await prismaQuestionnaire.question.findUnique({
      where: { id },
      include: {
        _count: { select: { answers: true } },
        answers: {
          select: {
            answer: true,
            textAnswer: true,
          },
        },
      },
    });

    if (!question) {
      throw new Error('שאלה לא נמצאה');
    }

    // Calculate statistics based on question type
    if (question.questionType === 'YES_NO') {
      const yesCount = question.answers.filter((a) => a.answer === true).length;
      const noCount = question.answers.filter((a) => a.answer === false).length;

      return {
        questionType: 'YES_NO',
        totalAnswers: question._count.answers,
        yesCount,
        noCount,
        yesPercentage: question._count.answers > 0 ? (yesCount / question._count.answers) * 100 : 0,
        noPercentage: question._count.answers > 0 ? (noCount / question._count.answers) * 100 : 0,
      };
    }

    if (question.questionType === 'TEXT' || question.questionType === 'LONG_TEXT') {
      const textAnswers = question.answers
        .filter((a) => a.textAnswer)
        .map((a) => a.textAnswer as string);

      return {
        questionType: question.questionType,
        totalAnswers: question._count.answers,
        answeredCount: textAnswers.length,
        unansweredCount: question._count.answers - textAnswers.length,
        averageLength:
          textAnswers.length > 0
            ? Math.round(textAnswers.reduce((sum, ans) => sum + ans.length, 0) / textAnswers.length)
            : 0,
      };
    }

    return {
      questionType: question.questionType,
      totalAnswers: question._count.answers,
    };
  } catch (error) {
    console.error('Error fetching question statistics:', error);
    throw new Error('שגיאה בטעינת סטטיסטיקות השאלה');
  }
}

/**
 * Server Actions for Questionnaire Management
 * Handles CRUD operations for questionnaires
 *
 * IMPORTANT: This uses a separate database (prismaQuestionnaire)
 * completely isolated from the main database (prisma).
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import {
  questionnaireSchema,
  type QuestionnaireInput,
} from '@/lib/validation/questionnaire-validation';

/**
 * Get active questionnaire with all questions
 * Used by public questionnaire page
 */
export async function getActiveQuestionnaire() {
  try {
    const questionnaire = await prismaQuestionnaire.questionnaire.findFirst({
      where: { isActive: true },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            orderIndex: true,
            isRequired: true,
            maxLength: true,
            allowTextExplanation: true,
            explanationMaxLength: true,
            explanationLabel: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    return questionnaire;
  } catch (error) {
    console.error('Error fetching active questionnaire:', error);
    throw new Error('שגיאה בטעינת השאלון הפעיל');
  }
}

/**
 * Get all questionnaires
 * Used by admin dashboard
 */
export async function getAllQuestionnaires() {
  try {
    const questionnaires = await prismaQuestionnaire.questionnaire.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
    });

    return questionnaires;
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    throw new Error('שגיאה בטעינת השאלונים');
  }
}

/**
 * Get single questionnaire by ID
 * Used by admin detail pages
 */
export async function getQuestionnaireById(id: number) {
  try {
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            orderIndex: true,
            isRequired: true,
            maxLength: true,
            allowTextExplanation: true,
            explanationMaxLength: true,
            explanationLabel: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    return questionnaire;
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בטעינת השאלון');
  }
}

/**
 * Create new questionnaire
 * Returns created questionnaire
 */
export async function createQuestionnaire(data: QuestionnaireInput) {
  try {
    // Validate input
    const validated = questionnaireSchema.parse(data);

    // Create questionnaire (isActive defaults to false)
    const questionnaire = await prismaQuestionnaire.questionnaire.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        isActive: false,
      },
    });

    // Revalidate admin pages
    revalidatePath('/admin/questionnaires');

    return questionnaire;
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים');
    }
    throw new Error('שגיאה ביצירת השאלון');
  }
}

/**
 * Update questionnaire
 * Can update title and description only (not isActive)
 */
export async function updateQuestionnaire(id: number, data: QuestionnaireInput) {
  try {
    // Validate input
    const validated = questionnaireSchema.parse(data);

    // Check questionnaire exists
    const existing = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('שאלון לא נמצא');
    }

    // Update questionnaire
    const updated = await prismaQuestionnaire.questionnaire.update({
      where: { id },
      data: {
        title: validated.title,
        description: validated.description || null,
      },
    });

    // Revalidate admin pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${id}`);

    return updated;
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים');
    }
    throw new Error(error instanceof Error ? error.message : 'שגיאה בעדכון השאלון');
  }
}

/**
 * Delete questionnaire
 * Cascades to questions and responses
 */
export async function deleteQuestionnaire(id: number) {
  try {
    // Check questionnaire exists
    const existing = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('שאלון לא נמצא');
    }

    // Delete questionnaire (cascades to questions and responses)
    await prismaQuestionnaire.questionnaire.delete({
      where: { id },
    });

    // Revalidate admin pages
    revalidatePath('/admin/questionnaires');

    return {
      success: true,
      deletedQuestions: existing._count.questions,
      deletedResponses: existing._count.responses,
    };
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה במחיקת השאלון');
  }
}

/**
 * Activate questionnaire
 * Deactivates all other questionnaires (only one active at a time)
 */
export async function activateQuestionnaire(id: number) {
  try {
    // Check questionnaire exists
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Check has questions
    if (questionnaire._count.questions === 0) {
      throw new Error('לא ניתן להפעיל שאלון ללא שאלות');
    }

    // Deactivate all questionnaires and activate this one in transaction
    await prismaQuestionnaire.$transaction(async (tx) => {
      // Deactivate all
      await tx.questionnaire.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Activate this one
      await tx.questionnaire.update({
        where: { id },
        data: { isActive: true },
      });
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${id}`);
    revalidatePath('/questionnaire'); // Public page

    return { success: true };
  } catch (error) {
    console.error('Error activating questionnaire:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בהפעלת השאלון');
  }
}

/**
 * Deactivate questionnaire
 * Makes questionnaire inactive
 */
export async function deactivateQuestionnaire(id: number) {
  try {
    // Check questionnaire exists
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Deactivate
    await prismaQuestionnaire.questionnaire.update({
      where: { id },
      data: { isActive: false },
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${id}`);
    revalidatePath('/questionnaire'); // Public page

    return { success: true };
  } catch (error) {
    console.error('Error deactivating questionnaire:', error);
    throw new Error('שגיאה בביטול הפעלת השאלון');
  }
}

/**
 * Get overall questionnaire statistics
 * Returns aggregated stats for admin dashboard
 */
export async function getQuestionnaireStats() {
  try {
    const [totalCount, activeCount, allQuestionnaires] = await Promise.all([
      prismaQuestionnaire.questionnaire.count(),
      prismaQuestionnaire.questionnaire.count({ where: { isActive: true } }),
      prismaQuestionnaire.questionnaire.findMany({
        include: {
          _count: {
            select: { responses: true },
          },
        },
      }),
    ]);

    const totalResponses = allQuestionnaires.reduce(
      (sum, q) => sum + q._count.responses,
      0
    );

    return {
      total: totalCount,
      active: activeCount,
      totalResponses,
    };
  } catch (error) {
    console.error('Error fetching questionnaire stats:', error);
    throw new Error('שגיאה בטעינת סטטיסטיקות שאלונים');
  }
}

/**
 * Get questionnaire statistics
 * Returns counts and status info
 */
export async function getQuestionnaireStatistics(id: number) {
  try {
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
        responses: {
          take: 1,
          orderBy: { submittedAt: 'desc' },
          select: { submittedAt: true },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    return {
      totalQuestions: questionnaire._count.questions,
      totalResponses: questionnaire._count.responses,
      isActive: questionnaire.isActive,
      latestResponseDate: questionnaire.responses[0]?.submittedAt || null,
      title: questionnaire.title,
      description: questionnaire.description,
      createdAt: questionnaire.createdAt,
    };
  } catch (error) {
    console.error('Error fetching questionnaire statistics:', error);
    throw new Error('שגיאה בטעינת סטטיסטיקות השאלון');
  }
}

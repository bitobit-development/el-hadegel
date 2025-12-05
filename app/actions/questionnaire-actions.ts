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
import { generateSlug, validateSlugFormat } from '@/lib/slug-utils';

/**
 * Check if slug is unique in database
 * Server-only function that requires Prisma access
 */
async function checkSlugUniqueness(
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const existing = await prismaQuestionnaire.questionnaire.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return !existing;
}

/**
 * Generate unique slug for a new questionnaire
 * Server-only function that checks database for uniqueness
 */
async function generateUniqueSlug(
  title: string,
  excludeId?: number
): Promise<string> {
  // Generate base slug
  const baseSlug = generateSlug(title);

  // Check if unique
  const isUnique = await checkSlugUniqueness(baseSlug, excludeId);

  if (isUnique) {
    return baseSlug;
  }

  // If not unique, add counter
  let counter = 1;
  let slug = `${baseSlug}-${counter}`;

  while (!(await checkSlugUniqueness(slug, excludeId))) {
    counter++;
    slug = `${baseSlug}-${counter}`;

    // Safety check: prevent infinite loop
    if (counter > 100) {
      throw new Error('Unable to generate unique slug after 100 attempts');
    }
  }

  return slug;
}

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
 * Auto-generates unique slug from title
 * Returns created questionnaire
 */
export async function createQuestionnaire(data: QuestionnaireInput) {
  try {
    // Validate input
    const validated = questionnaireSchema.parse(data);

    // Generate unique slug from title
    const slug = await generateUniqueSlug(validated.title);

    // Create questionnaire (isActive and isPublished default to false)
    const questionnaire = await prismaQuestionnaire.questionnaire.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        slug,
        isActive: false,
        isPublished: false,
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

/**
 * Get questionnaire by slug (public access)
 * Returns null if not found or not published
 * Used by public questionnaire pages
 */
export async function getQuestionnaireBySlug(slug: string) {
  try {
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { slug },
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

    // Security: Only return if published
    if (!questionnaire || !questionnaire.isPublished) {
      return null;
    }

    return questionnaire;
  } catch (error) {
    console.error('Error fetching questionnaire by slug:', error);
    throw new Error('שגיאה בטעינת השאלון');
  }
}

/**
 * Publish questionnaire (make publicly accessible)
 * Does NOT affect other questionnaires
 */
export async function publishQuestionnaire(id: number) {
  try {
    // Verify questionnaire exists and has questions
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      select: {
        slug: true,
        _count: { select: { questions: true } },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    if (questionnaire._count.questions === 0) {
      throw new Error('לא ניתן לפרסם שאלון ללא שאלות');
    }

    // Publish questionnaire
    await prismaQuestionnaire.questionnaire.update({
      where: { id },
      data: { isPublished: true },
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${id}`);
    revalidatePath(`/questionnaire/${questionnaire.slug}`);

    return { success: true };
  } catch (error) {
    console.error('Error publishing questionnaire:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בפרסום השאלון');
  }
}

/**
 * Unpublish questionnaire (make inaccessible)
 */
export async function unpublishQuestionnaire(id: number) {
  try {
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Unpublish
    await prismaQuestionnaire.questionnaire.update({
      where: { id },
      data: { isPublished: false },
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${id}`);
    revalidatePath(`/questionnaire/${questionnaire.slug}`);

    return { success: true };
  } catch (error) {
    console.error('Error unpublishing questionnaire:', error);
    throw new Error('שגיאה בביטול פרסום השאלון');
  }
}

/**
 * Update questionnaire slug (admin only)
 * Validates format and uniqueness
 */
export async function updateQuestionnaireSlug(id: number, newSlug: string) {
  try {
    // Validate format
    if (!validateSlugFormat(newSlug)) {
      throw new Error('Slug must be lowercase alphanumeric with hyphens (3-100 characters)');
    }

    // Check uniqueness
    const existing = await prismaQuestionnaire.questionnaire.findFirst({
      where: { slug: newSlug, NOT: { id } },
    });

    if (existing) {
      throw new Error('Slug already exists');
    }

    // Get old slug for revalidation
    const oldQuestionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!oldQuestionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Update slug
    const updated = await prismaQuestionnaire.questionnaire.update({
      where: { id },
      data: { slug: newSlug },
    });

    // Revalidate pages (old and new URLs)
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/questionnaire/${oldQuestionnaire.slug}`);
    revalidatePath(`/questionnaire/${newSlug}`);

    return updated;
  } catch (error) {
    console.error('Error updating questionnaire slug:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בעדכון ה-Slug');
  }
}

/**
 * Get all published questionnaires (public)
 * Used for listing page or featured questionnaire selection
 */
export async function getPublishedQuestionnaires() {
  try {
    return await prismaQuestionnaire.questionnaire.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching published questionnaires:', error);
    throw new Error('שגיאה בטעינת השאלונים המפורסמים');
  }
}

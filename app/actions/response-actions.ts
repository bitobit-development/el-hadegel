/**
 * Server Actions for Questionnaire Response Management
 * Handles submission, fetching, and statistics for questionnaire responses
 *
 * IMPORTANT: This uses a separate database (prismaQuestionnaire)
 * completely isolated from the main database (prisma).
 */

'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prismaQuestionnaire } from '@/lib/prisma-questionnaire';
import { auth } from '@/auth';
import {
  questionnaireResponseSchema,
  normalizeIsraeliPhone,
  validateAnswerForQuestionType,
  validateRequiredQuestions,
  validateExplanationText,
  updateResponseSchema,
  type QuestionnaireResponseInput,
  type UpdateResponseData,
} from '@/lib/validation/questionnaire-validation';

// Rate limiting store (in-memory, simple implementation)
// For production with multiple servers, use Redis instead
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for IP address
 * Limit: 5 submissions per hour per IP
 */
function checkRateLimit(ipAddress: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const key = `response:${ipAddress}`;
  const limit = 5;
  const windowMs = 60 * 60 * 1000; // 1 hour

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // No record or expired, create new
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, resetAt: record.resetAt };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true };
}

/**
 * Clean up expired rate limit records (called periodically)
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 10 minutes
setInterval(cleanupRateLimitStore, 10 * 60 * 1000);

/**
 * Submit questionnaire response (PUBLIC ACTION)
 * Used by the public questionnaire form
 */
export async function submitQuestionnaireResponse(data: QuestionnaireResponseInput) {
  try {
    // Get IP address
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Check rate limit
    const rateLimitCheck = checkRateLimit(ipAddress);
    if (!rateLimitCheck.allowed) {
      const resetAt = new Date(rateLimitCheck.resetAt!);
      throw new Error(
        `חרגת ממספר ההגשות המותר. אנא נסה שוב ב-${resetAt.toLocaleTimeString('he-IL')}`
      );
    }

    // Validate input
    const validated = questionnaireResponseSchema.parse(data);

    // Normalize phone number
    const normalizedPhone = normalizeIsraeliPhone(validated.phoneNumber);

    // Check questionnaire exists and is active
    const questionnaire = await prismaQuestionnaire.questionnaire.findFirst({
      where: {
        id: validated.questionnaireId,
        isActive: true,
      },
      include: {
        questions: {
          select: {
            id: true,
            questionType: true,
            isRequired: true,
            allowTextExplanation: true,
            explanationMaxLength: true,
          },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא פעיל או לא נמצא');
    }

    // Validate all required questions have answers
    const requiredQuestionIds = questionnaire.questions
      .filter((q) => q.isRequired)
      .map((q) => q.id);

    const missingQuestions = validateRequiredQuestions(
      requiredQuestionIds,
      validated.answers
    );

    if (missingQuestions.length > 0) {
      throw new Error(`חסרות תשובות לשאלות חובה (מספר שאלות: ${missingQuestions.length})`);
    }

    // Validate each answer matches question type
    for (const answer of validated.answers) {
      const question = questionnaire.questions.find((q) => q.id === answer.questionId);
      if (!question) {
        throw new Error(`שאלה מספר ${answer.questionId} לא נמצאה בשאלון`);
      }

      const validation = validateAnswerForQuestionType(question.questionType, answer);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Validate explanation text if present
      const explanationValidation = validateExplanationText(
        question.questionType,
        question.allowTextExplanation,
        answer.explanationText,
        question.explanationMaxLength || 500
      );
      if (!explanationValidation.valid) {
        throw new Error(explanationValidation.error);
      }
    }

    // Create response with answers in transaction
    const response = await prismaQuestionnaire.$transaction(async (tx) => {
      // Create response
      const newResponse = await tx.questionnaireResponse.create({
        data: {
          questionnaireId: validated.questionnaireId,
          fullName: validated.fullName,
          phoneNumber: normalizedPhone,
          email: validated.email,
          ipAddress,
          userAgent,
        },
      });

      // Create answers
      await tx.responseAnswer.createMany({
        data: validated.answers.map((a) => ({
          responseId: newResponse.id,
          questionId: a.questionId,
          answer: a.answer !== undefined ? a.answer : null,
          textAnswer: a.textAnswer || null,
          explanationText: a.explanationText || null,
        })),
      });

      return newResponse;
    });

    // Revalidate admin pages (not public page, no need)
    revalidatePath('/admin/questionnaires');

    return {
      success: true,
      responseId: response.id,
      submittedAt: response.submittedAt,
    };
  } catch (error) {
    console.error('Error submitting questionnaire response:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      throw new Error('נתונים לא תקינים. אנא בדוק את כל השדות.');
    }
    throw new Error(error instanceof Error ? error.message : 'שגיאה בשליחת התשובות');
  }
}

/**
 * Get questionnaire responses
 * Admin only - with filters and pagination
 */
export async function getQuestionnaireResponses(
  questionnaireId: number,
  filters?: {
    search?: string; // Search by name, email, phone
    startDate?: Date;
    endDate?: Date;
  },
  pagination?: {
    limit?: number;
    offset?: number;
  }
) {
  try {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    // Build where clause
    const where: any = { questionnaireId };

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phoneNumber: { contains: filters.search } },
      ];
    }

    if (filters?.startDate || filters?.endDate) {
      where.submittedAt = {};
      if (filters.startDate) {
        where.submittedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.submittedAt.lte = filters.endDate;
      }
    }

    // Fetch responses with pagination
    const [responses, totalCount] = await Promise.all([
      prismaQuestionnaire.questionnaireResponse.findMany({
        where,
        include: {
          questionnaire: {
            select: {
              id: true,
              title: true,
            },
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  questionType: true,
                  allowTextExplanation: true,
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
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prismaQuestionnaire.questionnaireResponse.count({ where }),
    ]);

    return {
      responses,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw new Error('שגיאה בטעינת התשובות');
  }
}

/**
 * Get single response by ID
 * Admin only
 */
export async function getResponseById(id: number) {
  try {
    const response = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id },
      include: {
        questionnaire: {
          select: { id: true, title: true },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                orderIndex: true,
                allowTextExplanation: true,
                explanationLabel: true,
              },
            },
          },
          orderBy: {
            question: { orderIndex: 'asc' },
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
                orderIndex: true,
              },
            },
          },
          orderBy: {
            field: { orderIndex: 'asc' },
          },
        },
      },
    });

    if (!response) {
      throw new Error('תשובה לא נמצאה');
    }

    return response;
  } catch (error) {
    console.error('Error fetching response:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה בטעינת התשובה');
  }
}

/**
 * Delete response
 * Admin only - cascades to answers
 */
export async function deleteResponse(id: number) {
  try {
    // Check response exists
    const existing = await prismaQuestionnaire.questionnaireResponse.findUnique({
      where: { id },
      select: {
        id: true,
        questionnaireId: true,
        _count: { select: { answers: true } },
      },
    });

    if (!existing) {
      throw new Error('תשובה לא נמצאה');
    }

    // Delete response (cascades to answers)
    await prismaQuestionnaire.questionnaireResponse.delete({
      where: { id },
    });

    // Revalidate pages
    revalidatePath('/admin/questionnaires');
    revalidatePath(`/admin/questionnaires/${existing.questionnaireId}`);

    return {
      success: true,
      deletedAnswers: existing._count.answers,
    };
  } catch (error) {
    console.error('Error deleting response:', error);
    throw new Error(error instanceof Error ? error.message : 'שגיאה במחיקת התשובה');
  }
}

/**
 * Get response statistics for questionnaire
 * Admin dashboard
 */
export async function getResponseStatistics(questionnaireId: number) {
  try {
    // Get total response count
    const totalResponses = await prismaQuestionnaire.questionnaireResponse.count({
      where: { questionnaireId },
    });

    // Get question statistics
    const questions = await prismaQuestionnaire.question.findMany({
      where: { questionnaireId },
      include: {
        _count: { select: { answers: true } },
        answers: {
          select: {
            answer: true,
            textAnswer: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    // Calculate stats per question
    const questionStats = questions.map((question) => {
      if (question.questionType === 'YES_NO') {
        const yesCount = question.answers.filter((a) => a.answer === true).length;
        const noCount = question.answers.filter((a) => a.answer === false).length;

        return {
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          totalAnswers: question._count.answers,
          yesCount,
          noCount,
          yesPercentage: totalResponses > 0 ? (yesCount / totalResponses) * 100 : 0,
          noPercentage: totalResponses > 0 ? (noCount / totalResponses) * 100 : 0,
        };
      }

      if (question.questionType === 'TEXT' || question.questionType === 'LONG_TEXT') {
        const textAnswers = question.answers.filter((a) => a.textAnswer).length;

        return {
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          totalAnswers: question._count.answers,
          answeredCount: textAnswers,
          unansweredCount: question._count.answers - textAnswers,
          answerRate: totalResponses > 0 ? (textAnswers / totalResponses) * 100 : 0,
        };
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        totalAnswers: question._count.answers,
      };
    });

    // Get recent responses
    const recentResponses = await prismaQuestionnaire.questionnaireResponse.findMany({
      where: { questionnaireId },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullName: true,
        submittedAt: true,
      },
    });

    return {
      totalResponses,
      totalQuestions: questions.length,
      questionStats,
      recentResponses,
    };
  } catch (error) {
    console.error('Error fetching response statistics:', error);
    throw new Error('שגיאה בטעינת סטטיסטיקות התשובות');
  }
}

/**
 * Export responses to Excel-ready format
 * Returns data that can be used by Excel export function
 */
export async function getResponsesForExport(questionnaireId: number) {
  try {
    // Get questionnaire with questions and custom fields
    const questionnaire = await prismaQuestionnaire.questionnaire.findUnique({
      where: { id: questionnaireId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            orderIndex: true,
            allowTextExplanation: true,
            explanationLabel: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        customFields: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!questionnaire) {
      throw new Error('שאלון לא נמצא');
    }

    // Get all responses with answers and custom field values
    const responses = await prismaQuestionnaire.questionnaireResponse.findMany({
      where: { questionnaireId },
      include: {
        answers: {
          include: {
            question: {
              select: { id: true, orderIndex: true },
            },
          },
        },
        customFieldValues: {
          include: {
            field: {
              select: { id: true, fieldType: true, orderIndex: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Format for Excel
    const excelData = responses.map((response) => {
      const row: any = {
        'שם מלא': response.fullName,
        'טלפון': response.phoneNumber,
        'אימייל': response.email,
        'תאריך הגשה': response.submittedAt,
      };

      // Add answers in question order
      questionnaire.questions.forEach((question) => {
        const answer = response.answers.find((a) => a.question.id === question.id);

        if (question.questionType === 'YES_NO') {
          row[question.questionText] = answer?.answer === true ? 'כן' : answer?.answer === false ? 'לא' : '';

          // Add explanation column if feature enabled
          if (question.allowTextExplanation) {
            const explanationHeader = question.explanationLabel || `${question.questionText} - הסבר`;
            row[explanationHeader] = answer?.explanationText || '';
          }
        } else {
          row[question.questionText] = answer?.textAnswer || '';
        }
      });

      // Add custom field values
      questionnaire.customFields.forEach((customField) => {
        const fieldValue = response.customFieldValues.find((v) => v.field.id === customField.id);

        if (fieldValue) {
          // Extract value based on field type
          let displayValue = '';
          if (fieldValue.field.fieldType === 'NUMBER') {
            displayValue = fieldValue.numberValue?.toString() || '';
          } else if (fieldValue.field.fieldType === 'DATE') {
            displayValue = fieldValue.dateValue?.toLocaleDateString('he-IL') || '';
          } else {
            displayValue = fieldValue.textValue || '';
          }
          row[customField.fieldName] = displayValue;
        } else {
          row[customField.fieldName] = '';
        }
      });

      return row;
    });

    return {
      questionnaireTitle: questionnaire.title,
      questions: questionnaire.questions.map((q, i) => ({
        index: i + 1,
        text: q.questionText,
        type: q.questionType,
      })),
      data: excelData,
    };
  } catch (error) {
    console.error('Error preparing export data:', error);
    throw new Error('שגיאה בהכנת נתונים לייצוא');
  }
}

/**
 * Update Questionnaire Response (Inline Editing)
 * Admin only - allows editing fullName, phoneNumber, email
 */
export async function updateQuestionnaireResponse(
  responseId: number,
  data: UpdateResponseData
): Promise<{
  success: boolean;
  error?: string;
  response?: {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    submittedAt: Date;
  };
}> {
  try {
    // 1. Validate input with Zod schema
    const validationResult = updateResponseSchema.safeParse(data);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const validatedData = validationResult.data;

    // 2. Check authentication
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'אינך מורשה לבצע פעולה זו',
      };
    }

    // 3. Check for duplicate email (excluding current record)
    const existingEmail = await prismaQuestionnaire.questionnaireResponse.findFirst({
      where: {
        email: validatedData.email,
        id: { not: responseId },
      },
    });

    if (existingEmail) {
      return {
        success: false,
        error: 'כתובת אימייל כבר קיימת במערכת',
      };
    }

    // 4. Check for duplicate phone (excluding current record)
    const existingPhone = await prismaQuestionnaire.questionnaireResponse.findFirst({
      where: {
        phoneNumber: validatedData.phoneNumber,
        id: { not: responseId },
      },
    });

    if (existingPhone) {
      return {
        success: false,
        error: 'מספר טלפון כבר קיים במערכת',
      };
    }

    // 5. Update the response
    const updatedResponse = await prismaQuestionnaire.questionnaireResponse.update({
      where: { id: responseId },
      data: {
        fullName: validatedData.fullName,
        phoneNumber: validatedData.phoneNumber,
        email: validatedData.email,
      },
      include: {
        questionnaire: { select: { id: true } },
      },
    });

    // 6. Revalidate the admin page
    revalidatePath(`/admin/questionnaires/${updatedResponse.questionnaire.id}/submissions`);
    revalidatePath('/admin/questionnaires');

    // 7. Return success response
    return {
      success: true,
      response: {
        id: updatedResponse.id,
        fullName: updatedResponse.fullName,
        phoneNumber: updatedResponse.phoneNumber,
        email: updatedResponse.email,
        submittedAt: updatedResponse.submittedAt,
      },
    };
  } catch (error) {
    console.error('Error updating response:', error);
    return {
      success: false,
      error: 'שגיאה בשמירת השינויים. נסה שוב.',
    };
  }
}

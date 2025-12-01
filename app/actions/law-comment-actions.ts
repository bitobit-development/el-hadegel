'use server';

/**
 * Server Actions for Law Document Commenting System
 *
 * Provides both public-facing actions (getLawDocument, submitComment, etc.)
 * and admin-only actions (getAllComments, approve/reject, bulk operations).
 */

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  commentSubmissionSchema,
  commentFilterSchema,
  paginationSchema,
  commentModerationSchema,
  bulkModerationSchema,
  type CommentSubmissionData,
  type CommentFilters,
} from '@/lib/validation/law-comment-validation';
import {
  sanitizeCommentContent,
  detectSpamComment,
  isDuplicateComment,
  extractIpAddress,
  extractUserAgent,
} from '@/lib/security/law-comment-security';
import {
  getCommentRateLimiter,
  CommentRateLimiter,
} from '@/lib/rate-limit-law-comments';
import type {
  LawDocumentData,
  ApprovedComment,
  LawCommentData,
  CommentStats,
  PaginatedResponse,
  ServerActionResponse,
} from '@/types/law-comment';
import { headers } from 'next/headers';

// ============================================================================
// PUBLIC SERVER ACTIONS (No Authentication Required)
// ============================================================================

/**
 * Get active law document with paragraphs and comment counts
 * Returns null if no active document found
 */
export async function getLawDocument(): Promise<LawDocumentData | null> {
  try {
    const document = await prisma.lawDocument.findFirst({
      where: { isActive: true },
      include: {
        paragraphs: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    if (!document) {
      return null;
    }

    // Get comment counts for each paragraph (APPROVED only)
    const commentCounts = await prisma.lawComment.groupBy({
      by: ['paragraphId'],
      where: {
        status: 'APPROVED',
        paragraphId: {
          in: document.paragraphs.map((p: { id: number }) => p.id),
        },
      },
      _count: { id: true },
    });

    const countMap = new Map(
      commentCounts.map((c: { paragraphId: number; _count: { id: number } }) => [c.paragraphId, c._count.id])
    );

    return {
      id: document.id,
      title: document.title,
      description: document.description,
      version: document.version,
      isActive: document.isActive,
      publishedAt: document.publishedAt,
      paragraphs: document.paragraphs.map((p: any) => ({
        id: p.id,
        documentId: p.documentId,
        orderIndex: p.orderIndex,
        sectionTitle: p.sectionTitle,
        content: p.content,
        commentCount: countMap.get(p.id) || 0,
      })),
    };
  } catch (error) {
    console.error('Error fetching law document:', error);
    throw new Error('שגיאה בטעינת מסמך החוק');
  }
}

/**
 * Submit a new comment on a law paragraph
 * Includes validation, rate limiting, spam detection, and duplicate prevention
 */
export async function submitLawComment(
  data: CommentSubmissionData
): Promise<ServerActionResponse<{ commentId: number }>> {
  try {
    // 1. Validate input with Zod
    const validationResult = commentSubmissionSchema.safeParse(data);

    if (!validationResult.success) {
      return {
        success: false,
        error: 'נתונים לא תקינים',
        errors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 2. Extract IP address and user agent
    const headersList = await headers();
    const ipAddress = extractIpAddress(headersList);
    const userAgent = extractUserAgent(headersList);

    // 3. Check rate limits
    const rateLimiter = getCommentRateLimiter();
    const rateLimitResult = rateLimiter.checkRateLimit(
      ipAddress,
      validatedData.email
    );

    if (!rateLimitResult.allowed) {
      const errorMessage = CommentRateLimiter.formatRateLimitError(
        rateLimitResult.resetAt!,
        rateLimitResult.limit!
      );
      return {
        success: false,
        error: errorMessage,
      };
    }

    // 4. Sanitize content (XSS prevention)
    const sanitizedComment = sanitizeCommentContent(validatedData.commentContent);
    const sanitizedEdit = validatedData.suggestedEdit
      ? sanitizeCommentContent(validatedData.suggestedEdit)
      : null;

    // 5. Spam detection
    const spamResult = detectSpamComment({
      ...validatedData,
      commentContent: sanitizedComment,
      suggestedEdit: sanitizedEdit,
    });

    if (spamResult.isSpam) {
      // Log spam attempt (for future analysis)
      console.warn('Spam comment detected:', {
        email: validatedData.email,
        reason: spamResult.reason,
        ip: ipAddress,
      });

      return {
        success: false,
        error: 'התגובה נחסמה. אנא ודא שהתוכן ראוי ולא מכיל ספאם.',
      };
    }

    // 6. Duplicate detection
    const isDuplicate = await isDuplicateComment(
      validatedData.email,
      validatedData.paragraphId,
      sanitizedComment
    );

    if (isDuplicate) {
      return {
        success: false,
        error: 'שלחת תגובה דומה לאחרונה. נסה שוב מאוחר יותר או כתוב תגובה שונה.',
      };
    }

    // 7. Verify paragraph exists
    const paragraph = await prisma.lawParagraph.findUnique({
      where: { id: validatedData.paragraphId },
    });

    if (!paragraph) {
      return {
        success: false,
        error: 'הפסקה שנבחרה לא נמצאה',
      };
    }

    // 8. Create comment record
    const comment = await prisma.lawComment.create({
      data: {
        paragraphId: validatedData.paragraphId,
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        email: validatedData.email.toLowerCase(),
        phoneNumber: validatedData.phoneNumber,
        commentContent: sanitizedComment,
        suggestedEdit: sanitizedEdit,
        status: 'PENDING', // Awaiting moderation
        ipAddress,
        userAgent,
      },
    });

    // 9. Revalidate law document page (to update comment count badge)
    revalidatePath('/law-document');

    return {
      success: true,
      message: 'התגובה נשלחה בהצלחה! היא תופיע לאחר אישור המנהל.',
      data: { commentId: comment.id },
    };
  } catch (error) {
    console.error('Error submitting comment:', error);
    return {
      success: false,
      error: 'שגיאה בשליחת התגובה. אנא נסה שוב.',
    };
  }
}

/**
 * Get approved comments for a specific paragraph
 * Returns only public-safe fields (no email, phone, IP)
 */
export async function getParagraphComments(
  paragraphId: number,
  limit: number = 50
): Promise<ApprovedComment[]> {
  try {
    const comments = await prisma.lawComment.findMany({
      where: {
        paragraphId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        commentContent: true,
        suggestedEdit: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    });

    return comments;
  } catch (error) {
    console.error('Error fetching paragraph comments:', error);
    throw new Error('שגיאה בטעינת תגובות');
  }
}

/**
 * Get approved comment count for a specific paragraph
 */
export async function getParagraphCommentCount(
  paragraphId: number
): Promise<number> {
  try {
    const count = await prisma.lawComment.count({
      where: {
        paragraphId,
        status: 'APPROVED',
      },
    });

    return count;
  } catch (error) {
    console.error('Error counting paragraph comments:', error);
    return 0;
  }
}

// ============================================================================
// ADMIN SERVER ACTIONS (Authentication Required)
// ============================================================================

/**
 * Verify admin session or throw error
 */
async function verifyAdminSession() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('נדרשת הזדהות כמנהל');
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });

  if (!admin) {
    throw new Error('משתמש לא מורשה');
  }

  return admin;
}

/**
 * Get all comments with filtering and pagination (Admin only)
 */
export async function getAllLawComments(
  filters?: CommentFilters,
  pagination?: { limit: number; offset: number }
): Promise<PaginatedResponse<LawCommentData>> {
  try {
    // Verify admin session
    await verifyAdminSession();

    // Validate filters
    const validatedFilters = filters
      ? commentFilterSchema.parse(filters)
      : {};

    // Validate pagination
    const validatedPagination = paginationSchema.parse(pagination || {});

    // Build where clause
    const where: any = {};

    if (validatedFilters.status) {
      where.status = validatedFilters.status;
    }

    if (validatedFilters.paragraphId) {
      where.paragraphId = validatedFilters.paragraphId;
    }

    if (validatedFilters.search) {
      // Search in: firstName, lastName, email, commentContent
      where.OR = [
        { firstName: { contains: validatedFilters.search, mode: 'insensitive' } },
        { lastName: { contains: validatedFilters.search, mode: 'insensitive' } },
        { email: { contains: validatedFilters.search, mode: 'insensitive' } },
        { commentContent: { contains: validatedFilters.search, mode: 'insensitive' } },
      ];
    }

    if (validatedFilters.dateFrom || validatedFilters.dateTo) {
      where.submittedAt = {};
      if (validatedFilters.dateFrom) {
        where.submittedAt.gte = validatedFilters.dateFrom;
      }
      if (validatedFilters.dateTo) {
        where.submittedAt.lte = validatedFilters.dateTo;
      }
    }

    // Get total count
    const total = await prisma.lawComment.count({ where });

    // Fetch comments
    const comments = await prisma.lawComment.findMany({
      where,
      include: {
        paragraph: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                version: true,
              },
            },
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: validatedPagination.limit,
      skip: validatedPagination.offset,
    });

    return {
      data: comments as LawCommentData[],
      total,
      limit: validatedPagination.limit,
      offset: validatedPagination.offset,
      hasMore: validatedPagination.offset + comments.length < total,
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('שגיאה בטעינת תגובות');
  }
}

/**
 * Get comment statistics (Admin only)
 */
export async function getLawCommentStats(): Promise<CommentStats> {
  try {
    // Verify admin session
    await verifyAdminSession();

    // Get counts by status
    const statusCounts = await prisma.lawComment.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const stats: CommentStats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0,
    };

    for (const { status, _count } of statusCounts) {
      stats.total += _count.id;
      switch (status) {
        case 'PENDING':
          stats.pending = _count.id;
          break;
        case 'APPROVED':
          stats.approved = _count.id;
          break;
        case 'REJECTED':
          stats.rejected = _count.id;
          break;
        case 'SPAM':
          stats.spam = _count.id;
          break;
      }
    }

    // Get counts by paragraph
    const paragraphCounts = await prisma.lawComment.groupBy({
      by: ['paragraphId'],
      _count: { id: true },
    });

    const paragraphIds = paragraphCounts.map((p: { paragraphId: number }) => p.paragraphId);
    const paragraphs = await prisma.lawParagraph.findMany({
      where: { id: { in: paragraphIds } },
      select: {
        id: true,
        orderIndex: true,
        sectionTitle: true,
      },
    });

    const paragraphMap = new Map(
      paragraphs.map((p: { id: number; orderIndex: number; sectionTitle: string | null }) => [
        p.id,
        { orderIndex: p.orderIndex, sectionTitle: p.sectionTitle }
      ])
    );

    stats.byParagraph = paragraphCounts.map(
      ({ paragraphId, _count }: { paragraphId: number; _count: { id: number } }) => {
        const paragraph = paragraphMap.get(paragraphId);
        return {
          paragraphId,
          orderIndex: paragraph?.orderIndex ?? 0,
          sectionTitle: paragraph?.sectionTitle ?? null,
          count: _count.id,
        };
      }
    ).sort((a: { count: number }, b: { count: number }) => b.count - a.count); // Sort by count descending

    return stats;
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    throw new Error('שגיאה בטעינת סטטיסטיקות');
  }
}

/**
 * Approve a comment (Admin only)
 */
export async function approveComment(
  commentId: number,
  adminId: number
): Promise<ServerActionResponse> {
  try {
    // Verify admin session
    const admin = await verifyAdminSession();

    if (admin.id !== adminId) {
      throw new Error('אין הרשאה לביצוע פעולה זו');
    }

    // Update comment
    await prisma.lawComment.update({
      where: { id: commentId },
      data: {
        status: 'APPROVED',
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    // Revalidate both pages
    revalidatePath('/law-document'); // Public view
    revalidatePath('/admin/law-comments'); // Admin table

    return {
      success: true,
      message: 'התגובה אושרה בהצלחה',
    };
  } catch (error) {
    console.error('Error approving comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה באישור התגובה',
    };
  }
}

/**
 * Reject a comment with optional reason (Admin only)
 */
export async function rejectComment(
  commentId: number,
  adminId: number,
  reason?: string
): Promise<ServerActionResponse> {
  try {
    // Verify admin session
    const admin = await verifyAdminSession();

    if (admin.id !== adminId) {
      throw new Error('אין הרשאה לביצוע פעולה זו');
    }

    // Validate with schema
    const validationResult = commentModerationSchema.safeParse({
      commentId,
      adminId,
      reason,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: 'נתונים לא תקינים',
      };
    }

    // Update comment
    await prisma.lawComment.update({
      where: { id: commentId },
      data: {
        status: 'REJECTED',
        moderatedBy: adminId,
        moderatedAt: new Date(),
        moderationNote: reason || null,
      },
    });

    // Revalidate admin page
    revalidatePath('/admin/law-comments');

    return {
      success: true,
      message: 'התגובה נדחתה',
    };
  } catch (error) {
    console.error('Error rejecting comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בדחיית התגובה',
    };
  }
}

/**
 * Mark comment as spam (Admin only)
 */
export async function markCommentAsSpam(
  commentId: number,
  adminId: number
): Promise<ServerActionResponse> {
  try {
    // Verify admin session
    const admin = await verifyAdminSession();

    if (admin.id !== adminId) {
      throw new Error('אין הרשאה לביצוע פעולה זו');
    }

    // Update comment
    await prisma.lawComment.update({
      where: { id: commentId },
      data: {
        status: 'SPAM',
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    // Revalidate admin page
    revalidatePath('/admin/law-comments');

    return {
      success: true,
      message: 'התגובה סומנה כספאם',
    };
  } catch (error) {
    console.error('Error marking comment as spam:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בסימון התגובה כספאם',
    };
  }
}

/**
 * Bulk approve comments (Admin only)
 */
export async function bulkApproveComments(
  commentIds: number[],
  adminId: number
): Promise<ServerActionResponse<{ count: number }>> {
  try {
    // Verify admin session
    const admin = await verifyAdminSession();

    if (admin.id !== adminId) {
      throw new Error('אין הרשאה לביצוע פעולה זו');
    }

    // Validate with schema
    const validationResult = bulkModerationSchema.safeParse({
      commentIds,
      adminId,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: 'נתונים לא תקינים',
      };
    }

    // Update comments
    const result = await prisma.lawComment.updateMany({
      where: { id: { in: commentIds } },
      data: {
        status: 'APPROVED',
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    // Revalidate both pages
    revalidatePath('/law-document');
    revalidatePath('/admin/law-comments');

    return {
      success: true,
      message: `${result.count} תגובות אושרו בהצלחה`,
      data: { count: result.count },
    };
  } catch (error) {
    console.error('Error bulk approving comments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה באישור התגובות',
    };
  }
}

/**
 * Bulk reject comments (Admin only)
 */
export async function bulkRejectComments(
  commentIds: number[],
  adminId: number
): Promise<ServerActionResponse<{ count: number }>> {
  try {
    // Verify admin session
    const admin = await verifyAdminSession();

    if (admin.id !== adminId) {
      throw new Error('אין הרשאה לביצוע פעולה זו');
    }

    // Validate with schema
    const validationResult = bulkModerationSchema.safeParse({
      commentIds,
      adminId,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: 'נתונים לא תקינים',
      };
    }

    // Update comments
    const result = await prisma.lawComment.updateMany({
      where: { id: { in: commentIds } },
      data: {
        status: 'REJECTED',
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
    });

    // Revalidate admin page
    revalidatePath('/admin/law-comments');

    return {
      success: true,
      message: `${result.count} תגובות נדחו`,
      data: { count: result.count },
    };
  } catch (error) {
    console.error('Error bulk rejecting comments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה בדחיית התגובות',
    };
  }
}

/**
 * Delete a comment permanently (Admin only - use with caution!)
 */
export async function deleteComment(
  commentId: number
): Promise<ServerActionResponse> {
  try {
    // Verify admin session
    await verifyAdminSession();

    // Delete comment
    await prisma.lawComment.delete({
      where: { id: commentId },
    });

    // Revalidate both pages
    revalidatePath('/law-document');
    revalidatePath('/admin/law-comments');

    return {
      success: true,
      message: 'התגובה נמחקה לצמיתות',
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'שגיאה במחיקת התגובה',
    };
  }
}

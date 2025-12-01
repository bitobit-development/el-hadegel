/**
 * TypeScript Types for Law Document Commenting System
 */

import { CommentStatus } from '@prisma/client';

/**
 * Law Document with Paragraphs
 */
export interface LawDocumentData {
  id: number;
  title: string;
  description: string | null;
  version: string;
  isActive: boolean;
  publishedAt: Date;
  paragraphs: LawParagraphWithCount[];
}

/**
 * Law Paragraph with Comment Count
 */
export interface LawParagraphWithCount {
  id: number;
  documentId: number;
  orderIndex: number;
  sectionTitle: string | null;
  content: string;
  commentCount: number; // Count of APPROVED comments only
}

/**
 * Comment Submission Data (from public form)
 */
export interface CommentSubmissionData {
  paragraphId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  commentContent: string;
  suggestedEdit?: string | null;
}

/**
 * Approved Comment (public view - privacy-conscious)
 */
export interface ApprovedComment {
  id: number;
  firstName: string;
  lastName: string;
  commentContent: string;
  suggestedEdit: string | null;
  submittedAt: Date;
}

/**
 * Full Comment Data (admin view)
 */
export interface LawCommentData {
  id: number;
  paragraphId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  commentContent: string;
  suggestedEdit: string | null;
  status: CommentStatus;
  moderatedBy: number | null;
  moderatedAt: Date | null;
  moderationNote: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  submittedAt: Date;
  updatedAt: Date;

  // Relations
  paragraph?: {
    id: number;
    orderIndex: number;
    sectionTitle: string | null;
    content: string;
    document: {
      id: number;
      title: string;
      version: string;
    };
  };
  moderator?: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * Comment Filter Options (for admin)
 */
export interface CommentFilters {
  status?: CommentStatus;
  paragraphId?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Comment Statistics (admin dashboard)
 */
export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
  byParagraph?: Array<{
    paragraphId: number;
    orderIndex: number;
    sectionTitle: string | null;
    count: number;
  }>;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Comment Moderation Action
 */
export interface CommentModerationAction {
  commentId: number;
  adminId: number;
  reason?: string | null;
}

/**
 * Bulk Moderation Action
 */
export interface BulkModerationAction {
  commentIds: number[];
  adminId: number;
}

/**
 * Comment Submission Result
 */
export interface CommentSubmissionResult {
  success: boolean;
  message: string;
  commentId?: number;
  errors?: Record<string, string[]>;
}

/**
 * Rate Limit Error
 */
export interface RateLimitError {
  error: string;
  resetAt: number;
  limit: number;
  current: number;
}

/**
 * Server Action Response (generic)
 */
export interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Comment Status Labels (Hebrew)
 */
export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  PENDING: 'ממתין לאישור',
  APPROVED: 'אושר',
  REJECTED: 'נדחה',
  SPAM: 'ספאם',
};

/**
 * Comment Status Colors (Tailwind classes)
 */
export const COMMENT_STATUS_COLORS: Record<CommentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  SPAM: 'bg-gray-100 text-gray-800 border-gray-300',
};

/**
 * Sort Options for Admin Table
 */
export type CommentSortField = 'submittedAt' | 'status' | 'firstName' | 'email';
export type CommentSortOrder = 'asc' | 'desc';

export interface CommentSortOptions {
  field: CommentSortField;
  order: CommentSortOrder;
}

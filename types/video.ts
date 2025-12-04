/**
 * Video System Type Definitions
 *
 * Core types for the video management system, including video data,
 * statistics, upload data, and validation constants.
 */

/**
 * Main video data interface (from database + computed fields)
 *
 * Represents a video record with all database fields plus computed
 * aggregations like like/dislike counts and user reactions.
 */
export interface VideoData {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  thumbnailUrl: string | null;
  duration: number | null; // Duration in seconds
  orderIndex: number;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (from likes relation)
  likeCount?: number;
  dislikeCount?: number;
  userReaction?: 'like' | 'dislike' | null; // Current user's reaction (requires IP tracking)
}

/**
 * Admin dashboard statistics
 *
 * Aggregated metrics for video library overview, used in admin
 * dashboard statistics cards.
 */
export interface VideoStats {
  total: number;           // Total videos in system
  published: number;       // Videos visible to public
  draft: number;           // Unpublished videos
  totalViews: number;      // Sum of all video view counts
  totalLikes: number;      // Sum of all video likes
  totalDislikes: number;   // Sum of all video dislikes
}

/**
 * Data for creating/uploading a video
 *
 * Required fields for video creation, typically after file upload
 * completes and metadata is extracted.
 */
export interface VideoUploadData {
  title: string;
  description?: string;
  fileName: string;         // Filename in R2 storage
  duration?: number;        // Duration in seconds (extracted from video)
  thumbnailUrl?: string;    // Generated or uploaded thumbnail URL
}

/**
 * Data for updating an existing video
 *
 * Partial update data, all fields optional. Used for edit operations.
 */
export interface VideoUpdateData {
  title?: string;
  description?: string | null;
  fileName?: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  orderIndex?: number;
  isPublished?: boolean;
}

/**
 * Video reorder operation data
 *
 * Used for bulk drag-and-drop reordering in admin UI.
 */
export interface VideoReorderItem {
  id: number;
  orderIndex: number;
}

/**
 * Video filter options for queries
 *
 * Used in admin video table for filtering and searching.
 */
export interface VideoFilterOptions {
  search?: string;          // Search by title/description
  isPublished?: boolean;    // Filter by publication status
  sortBy?: 'orderIndex' | 'createdAt' | 'viewCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination options
 *
 * Standard pagination parameters for video queries.
 */
export interface VideoPaginationOptions {
  limit?: number;           // Items per page (default: ITEMS_PER_PAGE)
  offset?: number;          // Number of items to skip
}

/**
 * Constants for validation and configuration
 *
 * Used across video upload, validation, and display logic.
 */
export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024,    // 500MB max upload size
  MAX_TITLE_LENGTH: 200,                // Max characters for title
  MAX_DESCRIPTION_LENGTH: 2000,         // Max characters for description
  ALLOWED_FORMATS: ['mp4', 'webm', 'mov'] as const, // Supported video formats
  ITEMS_PER_PAGE: 20,                   // Default pagination size
  MAX_VIDEOS_PER_QUESTIONNAIRE: 100,    // Reasonable upper limit
} as const;

/**
 * Video reaction type
 *
 * User interaction with video (like/dislike).
 */
export type VideoReactionType = 'like' | 'dislike';

/**
 * Video sort fields
 */
export type VideoSortField = 'orderIndex' | 'createdAt' | 'viewCount' | 'likeCount';

/**
 * Video sort order
 */
export type VideoSortOrder = 'asc' | 'desc';

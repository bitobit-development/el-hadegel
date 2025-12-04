/**
 * Video Validation Schemas
 *
 * Zod validation schemas for video creation, updates, and operations
 * with Hebrew error messages for consistent user feedback.
 */

import { z } from 'zod';
import { VIDEO_CONSTRAINTS } from '../../types/video';

/**
 * Schema for creating a new video
 *
 * Validates video metadata during upload process. All fields required
 * except description, duration, and thumbnailUrl.
 */
export const videoCreateSchema = z.object({
  title: z.string()
    .min(1, 'כותרת חובה')
    .max(
      VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH,
      `כותרת לא יכולה לעלות על ${VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH} תווים`
    )
    .trim(),

  description: z.string()
    .max(
      VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH,
      `תיאור לא יכול לעלות על ${VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} תווים`
    )
    .trim()
    .optional()
    .or(z.literal('')),

  fileName: z.string()
    .min(1, 'שם קובץ חובה')
    .trim(),

  duration: z.number()
    .int('משך זמן חייב להיות מספר שלם')
    .positive('משך זמן חייב להיות מספר חיובי')
    .optional(),

  thumbnailUrl: z.string()
    .url('כתובת תמונה לא תקינה')
    .trim()
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for updating an existing video
 *
 * All fields optional (partial update). Includes additional fields
 * for publication status and ordering.
 */
export const videoUpdateSchema = z.object({
  title: z.string()
    .min(1, 'כותרת חובה')
    .max(
      VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH,
      `כותרת לא יכולה לעלות על ${VIDEO_CONSTRAINTS.MAX_TITLE_LENGTH} תווים`
    )
    .trim()
    .optional(),

  description: z.string()
    .max(
      VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH,
      `תיאור לא יכול לעלות על ${VIDEO_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} תווים`
    )
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),

  fileName: z.string()
    .min(1, 'שם קובץ חובה')
    .trim()
    .optional(),

  thumbnailUrl: z.string()
    .url('כתובת תמונה לא תקינה')
    .trim()
    .optional()
    .or(z.literal(''))
    .or(z.null()),

  duration: z.number()
    .int('משך זמן חייב להיות מספר שלם')
    .positive('משך זמן חייב להיות מספר חיובי')
    .optional()
    .or(z.null()),

  isPublished: z.boolean()
    .optional(),

  orderIndex: z.number()
    .int('סדר תצוגה חייב להיות מספר שלם')
    .min(0, 'סדר תצוגה חייב להיות 0 או גדול יותר')
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'לפחות שדה אחד חייב להיות מעודכן' }
);

/**
 * Schema for bulk reordering videos
 *
 * Used in drag-and-drop reordering in admin UI. Validates array
 * of video ID + orderIndex pairs.
 */
export const videoReorderSchema = z.array(
  z.object({
    id: z.number()
      .int('מזהה סרטון חייב להיות מספר שלם')
      .positive('מזהה סרטון חייב להיות מספר חיובי'),

    orderIndex: z.number()
      .int('סדר תצוגה חייב להיות מספר שלם')
      .min(0, 'סדר תצוגה חייב להיות 0 או גדול יותר'),
  })
).min(1, 'לפחות סרטון אחד נדרש לסידור מחדש');

/**
 * Schema for video reaction (like/dislike)
 *
 * Validates user interaction with videos.
 */
export const videoReactionSchema = z.object({
  videoId: z.number()
    .int('מזהה סרטון חייב להיות מספר שלם')
    .positive('מזהה סרטון חייב להיות מספר חיובי'),

  reactionType: z.enum(['like', 'dislike'], {
    message: 'סוג תגובה לא תקין',
  }),
});

/**
 * Schema for filtering videos
 *
 * Used in admin video table for search and filtering.
 */
export const videoFilterSchema = z.object({
  search: z.string()
    .trim()
    .optional(),

  isPublished: z.boolean()
    .optional(),

  sortBy: z.enum(['orderIndex', 'createdAt', 'viewCount', 'likeCount'])
    .optional()
    .default('orderIndex'),

  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

/**
 * Schema for pagination options
 *
 * Validates limit and offset for paginated queries.
 */
export const videoPaginationSchema = z.object({
  limit: z.number()
    .int('מגבלה חייבת להיות מספר שלם')
    .positive('מגבלה חייבת להיות מספר חיובי')
    .max(100, 'מגבלה לא יכולה לעלות על 100')
    .optional()
    .default(VIDEO_CONSTRAINTS.ITEMS_PER_PAGE),

  offset: z.number()
    .int('היסט חייב להיות מספר שלם')
    .min(0, 'היסט חייב להיות 0 או גדול יותר')
    .optional()
    .default(0),
});

/**
 * Type exports for use in Server Actions
 *
 * Infer TypeScript types from Zod schemas for type-safe server actions.
 */
export type VideoCreateInput = z.infer<typeof videoCreateSchema>;
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;
export type VideoReorderInput = z.infer<typeof videoReorderSchema>;
export type VideoReactionInput = z.infer<typeof videoReactionSchema>;
export type VideoFilterInput = z.infer<typeof videoFilterSchema>;
export type VideoPaginationInput = z.infer<typeof videoPaginationSchema>;

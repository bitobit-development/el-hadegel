import { z } from 'zod';

/**
 * Validation Schemas for Law Comment System
 *
 * Comprehensive Zod schemas for comment submission, filtering, and moderation.
 */

// Israeli phone number regex
// Supports formats: 050-1234567, 0501234567, +972-50-1234567, +972501234567
const ISRAELI_PHONE_REGEX = /^(\+972|0)?[1-9]\d{1,2}-?\d{7}$/;

// Hebrew and English name validation (allows spaces, hyphens, apostrophes)
const NAME_REGEX = /^[\u0590-\u05FFa-zA-Z\s'-]+$/;

/**
 * Comment Submission Schema
 * Validates all required fields for public comment submission
 */
export const commentSubmissionSchema = z.object({
  paragraphId: z.number({ message: 'מספר הפסקה נדרש' })
    .int({ message: 'מספר הפסקה חייב להיות מספר שלם' })
    .positive({ message: 'מספר הפסקה חייב להיות חיובי' }),

  firstName: z.string({ message: 'שם פרטי נדרש' })
    .min(2, { message: 'שם פרטי חייב להכיל לפחות 2 תווים' })
    .max(100, { message: 'שם פרטי ארוך מדי (מקסימום 100 תווים)' })
    .regex(NAME_REGEX, { message: 'שם פרטי יכול להכיל רק אותיות בעברית או אנגלית, רווחים, מקפים וגרשיים' })
    .transform(val => val.trim()),

  lastName: z.string({ message: 'שם משפחה נדרש' })
    .min(2, { message: 'שם משפחה חייב להכיל לפחות 2 תווים' })
    .max(100, { message: 'שם משפחה ארוך מדי (מקסימום 100 תווים)' })
    .regex(NAME_REGEX, { message: 'שם משפחה יכול להכיל רק אותיות בעברית או אנגלית, רווחים, מקפים וגרשיים' })
    .transform(val => val.trim()),

  email: z.string({ message: 'כתובת דוא״ל נדרשת' })
    .email({ message: 'כתובת דוא״ל לא תקינה' })
    .max(255, { message: 'כתובת דוא״ל ארוכה מדי' })
    .toLowerCase()
    .transform(val => val.trim()),

  phoneNumber: z.string({ message: 'מספר טלפון נדרש' })
    .regex(ISRAELI_PHONE_REGEX, { message: 'מספר טלפון לא תקין. פורמט מקובל: 050-1234567 או 0501234567' })
    .transform(val => val.trim().replace(/\s+/g, '')), // Remove spaces

  commentContent: z.string({ message: 'תוכן התגובה נדרש' })
    .min(10, { message: 'תגובה חייבת להכיל לפחות 10 תווים' })
    .max(5000, { message: 'תגובה ארוכה מדי (מקסימום 5000 תווים)' })
    .transform(val => val.trim()),

  suggestedEdit: z.string()
    .max(5000, { message: 'הצעת עריכה ארוכה מדי (מקסימום 5000 תווים)' })
    .transform(val => val?.trim() || null)
    .nullable()
    .optional(),
});

/**
 * Admin Comment Filter Schema
 * For filtering comments in admin dashboard
 */
export const commentFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SPAM'], {
    message: 'סטטוס לא תקין',
  }).optional(),

  paragraphId: z.number({ message: 'מספר פסקה לא תקין' })
    .int({ message: 'מספר פסקה חייב להיות מספר שלם' })
    .positive({ message: 'מספר פסקה חייב להיות חיובי' })
    .optional(),

  search: z.string()
    .max(500, { message: 'מחרוזת חיפוש ארוכה מדי' })
    .transform(val => val?.trim() || undefined)
    .optional(),

  dateFrom: z.coerce.date({ message: 'תאריך התחלה לא תקין' }).optional(),

  dateTo: z.coerce.date({ message: 'תאריך סיום לא תקין' }).optional(),
}).refine(
  (data) => {
    // Validate dateFrom is before dateTo if both are provided
    if (data.dateFrom && data.dateTo) {
      return data.dateFrom <= data.dateTo;
    }
    return true;
  },
  {
    message: 'תאריך התחלה חייב להיות לפני תאריך הסיום',
    path: ['dateFrom'],
  }
);

/**
 * Comment Moderation Schema
 * For approving/rejecting comments with optional notes
 */
export const commentModerationSchema = z.object({
  commentId: z.number().int().positive(),
  adminId: z.number().int().positive(),
  reason: z.string()
    .max(1000, 'הערת מנהל ארוכה מדי (מקסימום 1000 תווים)')
    .transform(val => val?.trim() || null)
    .nullable()
    .optional(),
});

/**
 * Bulk Comment Moderation Schema
 * For approving/rejecting multiple comments at once
 */
export const bulkModerationSchema = z.object({
  commentIds: z.array(
    z.number().int().positive(),
    { message: 'רשימת תגובות לא תקינה' }
  )
    .min(1, { message: 'יש לבחור לפחות תגובה אחת' })
    .max(100, { message: 'ניתן לעדכן עד 100 תגובות בבת אחת' }),
  adminId: z.number().int().positive(),
});

/**
 * Pagination Schema
 * For paginated queries
 */
export const paginationSchema = z.object({
  limit: z.number()
    .int()
    .positive()
    .max(100, { message: 'מקסימום 100 תוצאות לעמוד' })
    .default(50),
  offset: z.number()
    .int()
    .min(0)
    .default(0),
});

/**
 * Type exports for use in server actions
 */
export type CommentSubmissionData = z.infer<typeof commentSubmissionSchema>;
export type CommentFilters = z.infer<typeof commentFilterSchema>;
export type CommentModerationData = z.infer<typeof commentModerationSchema>;
export type BulkModerationData = z.infer<typeof bulkModerationSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;

/**
 * Helper function to validate Israeli phone numbers
 * Supports multiple formats:
 * - 050-1234567
 * - 0501234567
 * - +972-50-1234567
 * - +972501234567
 */
export function isValidIsraeliPhone(phone: string): boolean {
  return ISRAELI_PHONE_REGEX.test(phone.trim());
}

/**
 * Helper function to normalize phone number to standard format
 * Returns format: 0XX-XXXXXXX
 */
export function normalizeIsraeliPhone(phone: string): string {
  // Remove all spaces and hyphens
  let cleaned = phone.replace(/[\s-]/g, '');

  // Convert +972 to 0
  if (cleaned.startsWith('+972')) {
    cleaned = '0' + cleaned.slice(4);
  }

  // Add hyphen after area code (3-4 digits)
  if (cleaned.length === 10) {
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3);
  }

  return cleaned;
}

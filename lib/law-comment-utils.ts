/**
 * Utility Functions for Law Comment System
 *
 * Provides Hebrew date formatting, relative time, and content truncation.
 */

import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format date in Hebrew
 * Returns: "15 בינואר 2025, 14:30"
 */
export function formatCommentDate(date: Date): string {
  return format(date, "d MMMM yyyy, HH:mm", { locale: he });
}

/**
 * Get relative time in Hebrew
 * Returns: "לפני 5 דקות", "לפני שעה", "לפני 3 ימים"
 */
export function getRelativeCommentTime(date: Date): string {
  try {
    const distance = formatDistanceToNow(date, { locale: he, addSuffix: true });
    // date-fns returns "לפני X" format automatically with Hebrew locale
    return distance;
  } catch (error) {
    // Fallback to formatted date if error
    return formatCommentDate(date);
  }
}

/**
 * Truncate comment content to specified length
 * Adds "..." if truncated
 */
export function truncateComment(content: string, length: number = 100): string {
  if (!content) return '';

  const trimmed = content.trim();

  if (trimmed.length <= length) {
    return trimmed;
  }

  // Truncate at word boundary if possible
  const truncated = trimmed.slice(0, length);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > length * 0.8) {
    // If we can cut at a space without losing too much, do it
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Format phone number for display
 * Returns: 050-1234567 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Handle +972 prefix
  let normalized = cleaned;
  if (cleaned.startsWith('972')) {
    normalized = '0' + cleaned.slice(3);
  }

  // Format as XXX-XXXXXXX
  if (normalized.length === 10) {
    return normalized.slice(0, 3) + '-' + normalized.slice(3);
  }

  // Return as-is if format doesn't match
  return phone;
}

/**
 * Get initials from full name
 * Returns: "א.ב" for "אבי בן"
 */
export function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0] || '';
  const last = lastName.trim()[0] || '';
  return `${first}.${last}`.toUpperCase();
}

/**
 * Mask email for privacy
 * Returns: "u***@example.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');

  if (!local || !domain) return email;

  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }

  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 3))}@${domain}`;
}

/**
 * Mask phone number for privacy
 * Returns: "050-***4567"
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-***${cleaned.slice(-4)}`;
  }

  // Fallback: show first 3 and last 3 digits
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 3)}***${cleaned.slice(-3)}`;
  }

  return '***' + cleaned.slice(-3);
}

/**
 * Calculate reading time for content (Hebrew text)
 * Returns: "זמן קריאה: 2 דקות"
 */
export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200; // Average reading speed
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  if (minutes === 1) {
    return 'זמן קריאה: דקה';
  }

  return `זמן קריאה: ${minutes} דקות`;
}

/**
 * Format number with thousands separator
 * Returns: "1,234" for 1234
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('he-IL');
}

/**
 * Get paragraph label
 * Returns: "סעיף 5" or "מטרה" (if has section title)
 */
export function getParagraphLabel(orderIndex: number, sectionTitle?: string | null): string {
  if (sectionTitle) {
    return sectionTitle;
  }
  return `סעיף ${orderIndex}`;
}

/**
 * Get full paragraph reference
 * Returns: "סעיף 5: מטרה" or "סעיף 5"
 */
export function getParagraphReference(
  orderIndex: number,
  sectionTitle?: string | null
): string {
  if (sectionTitle) {
    return `סעיף ${orderIndex}: ${sectionTitle}`;
  }
  return `סעיף ${orderIndex}`;
}

/**
 * Validate Hebrew content (at least some Hebrew characters)
 */
export function hasHebrewContent(text: string): boolean {
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

/**
 * Count words in text (Hebrew-aware)
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Get comment status badge class
 */
export function getStatusBadgeClass(status: string): string {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';

  switch (status) {
    case 'PENDING':
      return `${baseClass} bg-yellow-100 text-yellow-800 border-yellow-300`;
    case 'APPROVED':
      return `${baseClass} bg-green-100 text-green-800 border-green-300`;
    case 'REJECTED':
      return `${baseClass} bg-red-100 text-red-800 border-red-300`;
    case 'SPAM':
      return `${baseClass} bg-gray-100 text-gray-800 border-gray-300`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800 border-gray-300`;
  }
}

/**
 * Get comment status label in Hebrew
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'ממתין לאישור';
    case 'APPROVED':
      return 'אושר';
    case 'REJECTED':
      return 'נדחה';
    case 'SPAM':
      return 'ספאם';
    default:
      return status;
  }
}

/**
 * Sort comments by date (newest first)
 */
export function sortCommentsByDate<T extends { submittedAt: Date }>(
  comments: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...comments].sort((a, b) => {
    const dateA = new Date(a.submittedAt).getTime();
    const dateB = new Date(b.submittedAt).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Group comments by status
 */
export function groupCommentsByStatus<T extends { status: string }>(
  comments: T[]
): Record<string, T[]> {
  return comments.reduce((acc, comment) => {
    const status = comment.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(comment);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Format percentage for display
 */
export function formatPercentage(part: number, total: number): string {
  const percentage = calculatePercentage(part, total);
  return `${percentage}%`;
}

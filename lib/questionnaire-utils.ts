/**
 * Utility Functions for Questionnaire System
 * Formatting, calculations, and helper functions
 */

import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format phone number for display
 * Converts 05XXXXXXXX to 050-XXX-XXXX
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it's Israeli mobile format (10 digits starting with 05)
  if (digits.length === 10 && digits.startsWith('05')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return original if not standard format
  return phone;
}

/**
 * Calculate response rate for yes/no questions
 * Returns percentage of "yes" answers
 */
export function calculateResponseRate(yesCount: number, noCount: number): number {
  const total = yesCount + noCount;
  if (total === 0) return 0;
  return Math.round((yesCount / total) * 100);
}

/**
 * Format date in Hebrew
 * Example: "15 בינואר 2025, 14:30"
 */
export function formatQuestionnaireDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "d MMMM yyyy, HH:mm", { locale: he });
}

/**
 * Get relative time in Hebrew
 * Examples: "לפני 5 דקות", "לפני שעה", "לפני 3 ימים"
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: he });
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: "...")
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Get Hebrew label for question type
 */
export function getQuestionTypeLabel(type: 'YES_NO' | 'TEXT' | 'LONG_TEXT'): string {
  const labels: Record<'YES_NO' | 'TEXT' | 'LONG_TEXT', string> = {
    YES_NO: 'כן/לא',
    TEXT: 'תשובה קצרה',
    LONG_TEXT: 'תשובה ארוכה',
  };
  return labels[type] || type;
}

/**
 * Get Tailwind color class for question type badge
 */
export function getQuestionTypeColor(type: 'YES_NO' | 'TEXT' | 'LONG_TEXT'): string {
  const colors: Record<'YES_NO' | 'TEXT' | 'LONG_TEXT', string> = {
    YES_NO: 'bg-blue-100 text-blue-800',
    TEXT: 'bg-green-100 text-green-800',
    LONG_TEXT: 'bg-purple-100 text-purple-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

/**
 * Get status badge color for questionnaire
 */
export function getQuestionnaireStatusColor(isActive: boolean): string {
  return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
}

/**
 * Get status label in Hebrew
 */
export function getQuestionnaireStatusLabel(isActive: boolean): string {
  return isActive ? 'פעיל' : 'לא פעיל';
}

/**
 * Format answer summary for display
 * For yes/no: "כן" or "לא"
 * For text: First 50 chars + ellipsis
 */
export function formatAnswerSummary(
  questionType: 'YES_NO' | 'TEXT' | 'LONG_TEXT',
  answer: boolean | null,
  textAnswer: string | null
): string {
  if (questionType === 'YES_NO') {
    return answer === true ? 'כן' : answer === false ? 'לא' : 'לא נענה';
  }

  if (questionType === 'TEXT' || questionType === 'LONG_TEXT') {
    if (!textAnswer) return 'לא נענה';
    return truncateText(textAnswer, 50);
  }

  return 'לא נענה';
}

/**
 * Calculate statistics for questionnaire responses
 * Returns breakdown by question type and overall stats
 */
export interface QuestionnaireStats {
  totalResponses: number;
  totalQuestions: number;
  averageCompletionRate: number; // Percentage of questions answered
  responsesByQuestionType: {
    YES_NO: number;
    TEXT: number;
    LONG_TEXT: number;
  };
}

export function calculateQuestionnaireStats(
  totalResponses: number,
  totalQuestions: number,
  totalAnswers: number,
  answersByType: Record<'YES_NO' | 'TEXT' | 'LONG_TEXT', number>
): QuestionnaireStats {
  const expectedAnswers = totalResponses * totalQuestions;
  const completionRate = expectedAnswers > 0 ? (totalAnswers / expectedAnswers) * 100 : 0;

  return {
    totalResponses,
    totalQuestions,
    averageCompletionRate: Math.round(completionRate),
    responsesByQuestionType: {
      YES_NO: answersByType.YES_NO || 0,
      TEXT: answersByType.TEXT || 0,
      LONG_TEXT: answersByType.LONG_TEXT || 0,
    },
  };
}

/**
 * Generate unique question order index
 * Returns next available order index for questionnaire
 */
export function getNextOrderIndex(existingIndexes: number[]): number {
  if (existingIndexes.length === 0) return 0;
  return Math.max(...existingIndexes) + 1;
}

/**
 * Reorder array items by moving item from one index to another
 * Used for drag-and-drop reordering
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = Array.from(array);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Validate email format (basic check)
 * More thorough validation should use Zod schema
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Israeli phone number format
 * Accepts: 05XXXXXXXX, 050-XXX-XXXX, +972-50-XXX-XXXX
 */
export function isValidIsraeliPhone(phone: string): boolean {
  const phoneRegex = /^(\+972|0)?[-\s]?5[0-9][-\s]?\d{3}[-\s]?\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * Generate Excel filename for export
 * Format: questionnaire-[title]-[date].xlsx
 */
export function generateExcelFilename(questionnaireTitle: string, timestamp: Date = new Date()): string {
  const sanitizedTitle = questionnaireTitle
    .replace(/[^a-zA-Z0-9\u0590-\u05FF\s]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .slice(0, 50); // Limit length

  const dateStr = format(timestamp, 'yyyy-MM-dd-HHmm');
  return `questionnaire-${sanitizedTitle}-${dateStr}.xlsx`;
}

/**
 * Parse Excel date to JavaScript Date
 * Excel stores dates as numbers (days since 1900-01-01)
 */
export function parseExcelDate(excelDate: number | string | Date): Date {
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === 'string') return new Date(excelDate);

  // Excel date number (days since 1900-01-01)
  const excelEpoch = new Date(1900, 0, 1);
  const days = typeof excelDate === 'number' ? excelDate - 2 : 0; // -2 accounts for Excel's leap year bug
  return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Count characters in text (useful for character counters)
 * Returns object with current count and remaining count
 */
export function getCharacterCount(text: string, maxLength: number): {
  current: number;
  remaining: number;
  isOverLimit: boolean;
} {
  const current = text.length;
  const remaining = maxLength - current;
  return {
    current,
    remaining,
    isOverLimit: remaining < 0,
  };
}

/**
 * Format percentage for display
 * Example: 75.6 -> "76%"
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Get color class for percentage value
 * Used for progress bars and statistics
 */
export function getPercentageColor(value: number): string {
  if (value >= 80) return 'bg-green-500';
  if (value >= 50) return 'bg-yellow-500';
  if (value >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

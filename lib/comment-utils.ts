import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format a date in Hebrew locale (dd/MM/yyyy)
 */
export function formatCommentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: he });
}

/**
 * Get relative time in Hebrew (e.g., "לפני 3 שעות")
 */
export function getRelativeCommentTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: he });
}

/**
 * Truncate comment content with ellipsis
 */
export function truncateComment(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

/**
 * Get platform icon name (for Lucide React icons)
 */
export function getPlatformIcon(platform: string): string {
  const iconMap: Record<string, string> = {
    News: 'Newspaper',
    Twitter: 'Twitter',
    Facebook: 'Facebook',
    YouTube: 'Youtube',
    Knesset: 'Building2',
    Interview: 'Mic',
    Other: 'Link',
  };
  return iconMap[platform] || 'Link';
}

/**
 * Get platform color classes (Tailwind)
 */
export function getPlatformColor(platform: string): string {
  const colorMap: Record<string, string> = {
    News: 'bg-blue-100 text-blue-800 border-blue-200',
    Twitter: 'bg-sky-100 text-sky-800 border-sky-200',
    Facebook: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    YouTube: 'bg-red-100 text-red-800 border-red-200',
    Knesset: 'bg-green-100 text-green-800 border-green-200',
    Interview: 'bg-purple-100 text-purple-800 border-purple-200',
    Other: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colorMap[platform] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get source type label in Hebrew
 */
export function getSourceTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    Primary: 'ראשוני',
    Secondary: 'משני',
  };
  return labelMap[type] || type;
}

/**
 * Get credibility level label and color
 */
export function getCredibilityInfo(score: number): {
  label: string;
  color: string;
} {
  if (score >= 8) {
    return { label: 'גבוהה', color: 'text-green-600' };
  } else if (score >= 5) {
    return { label: 'בינונית', color: 'text-yellow-600' };
  } else {
    return { label: 'נמוכה', color: 'text-orange-600' };
  }
}

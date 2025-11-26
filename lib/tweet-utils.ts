import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format tweet date for display in Hebrew
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatTweetDate(date: Date): string {
  return format(date, 'd בMMMM yyyy, HH:mm', { locale: he });
}

/**
 * Get relative time for tweet (e.g., "לפני 2 שעות", "לפני 3 ימים")
 * @param date - The date to format
 * @returns Relative time string in Hebrew
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'כרגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שבועות`;
  if (diffDays < 365) return `לפני ${Math.floor(diffDays / 30)} חודשים`;
  return `לפני ${Math.floor(diffDays / 365)} שנים`;
}

/**
 * Truncate tweet content for preview
 * @param content - The tweet content
 * @param maxLength - Maximum length (default: 150)
 * @returns Truncated content with ellipsis if needed
 */
export function truncateTweet(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Get platform icon name for display
 * @param platform - The source platform
 * @returns Icon identifier for the platform
 */
export function getPlatformIcon(platform: string): string {
  const iconMap: Record<string, string> = {
    'Twitter': 'twitter',
    'Facebook': 'facebook',
    'Instagram': 'instagram',
    'News': 'newspaper',
    'Knesset Website': 'building',
    'Other': 'link',
  };
  return iconMap[platform] || 'link';
}

/**
 * Get platform color for badges
 * @param platform - The source platform
 * @returns Tailwind color class
 */
export function getPlatformColor(platform: string): string {
  const colorMap: Record<string, string> = {
    'Twitter': 'bg-blue-500',
    'Facebook': 'bg-blue-600',
    'Instagram': 'bg-pink-500',
    'News': 'bg-gray-700',
    'Knesset Website': 'bg-blue-700',
    'Other': 'bg-gray-500',
  };
  return colorMap[platform] || 'bg-gray-500';
}

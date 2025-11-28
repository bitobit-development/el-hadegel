import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Format date in Hebrew (e.g., "15 בינואר 2025")
 */
export function formatNewsDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: he });
}

/**
 * Get relative time in Hebrew (e.g., "לפני 3 שעות")
 */
export function getRelativeNewsTime(date: Date): string {
  return formatDistanceToNow(date, {
    locale: he,
    addSuffix: true,
  });
}

/**
 * Truncate content with ellipsis
 */
export function truncateNewsContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Extract domain from URL for display (e.g., "ynet.co.il")
 */
export function getUrlDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Get icon for social media platform
 */
export function getPlatformIcon(url: string): string {
  const domain = getUrlDomain(url);

  if (domain.includes('x.com') || domain.includes('twitter.com')) {
    return '𝕏'; // X icon
  }
  if (domain.includes('facebook.com')) {
    return '📘';
  }
  if (domain.includes('youtube.com')) {
    return '▶️';
  }
  if (domain.includes('ynet.co.il')) {
    return '📰';
  }
  if (domain.includes('haaretz.co.il')) {
    return '📰';
  }

  return '🔗';
}

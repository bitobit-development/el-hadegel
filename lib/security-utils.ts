/**
 * Security utility functions for API endpoints
 */

/**
 * Sanitize content to prevent XSS attacks
 * Removes HTML tags, script tags, and dangerous characters
 */
export function sanitizeContent(content: string): string {
  // Remove HTML tags
  let sanitized = content.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Validate and sanitize URL
 * Ensures URL is safe and properly formatted
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Return normalized URL
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

/**
 * Detect if content is spam or suspicious
 */
export function isSpam(content: string): boolean {
  const spamPatterns = [
    /viagra/i,
    /casino/i,
    /\b(buy now|click here|limited offer)\b/i,
    /\$\$\$/,
    /http[s]?:\/\/[^\s]{100,}/, // Very long URLs (likely spam)
  ];

  return spamPatterns.some(pattern => pattern.test(content));
}

/**
 * Check for excessive URL usage (spam indicator)
 */
export function hasExcessiveUrls(content: string): boolean {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const matches = content.match(urlPattern);
  return matches ? matches.length > 3 : false;
}

/**
 * Validate image URL format and safety
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check for common image extensions
    const path = parsed.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext => path.endsWith(ext));

    // Also check for common image CDN patterns (no extension required)
    const isCdnPattern = /\.(cloudinary|imgur|unsplash|pexels|googleusercontent)\.com/i.test(parsed.hostname);

    return hasValidExtension || isCdnPattern;
  } catch {
    return false;
  }
}

/**
 * Extract IP address from request
 */
export function getClientIp(headers: Headers): string {
  // Try various headers (proxy-aware)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Check request body size to prevent DoS
 * Returns true if size is within acceptable limits
 */
export function isValidRequestSize(bodyString: string): boolean {
  const maxSize = 1024 * 100; // 100KB max request size
  const sizeInBytes = new Blob([bodyString]).size;
  return sizeInBytes <= maxSize;
}

import prisma from '@/lib/prisma';

/**
 * Security Utilities for Law Comment System
 *
 * Provides XSS prevention, spam detection, duplicate detection,
 * and content sanitization for user-submitted comments.
 */

// Spam keywords in English and Hebrew
const SPAM_KEYWORDS_EN = [
  'viagra', 'cialis', 'casino', 'poker', 'lottery', 'prize',
  'buy now', 'click here', 'free money', 'get rich', 'work from home',
  'credit card', 'bank account', 'password', 'login', 'verify account',
  'congratulations', 'you won', 'claim now', 'limited time',
];

const SPAM_KEYWORDS_HE = [
  'קזינו', 'הימורים', 'פוקר', 'הגרלה', 'פרס',
  'כסף חינם', 'לחץ כאן', 'קנה עכשיו', 'התעשר מהר',
  'כרטיס אשראי', 'חשבון בנק', 'סיסמה', 'התחבר', 'אמת חשבון',
  'מזל טוב', 'זכית', 'תבע עכשיו', 'זמן מוגבל',
];

const ALL_SPAM_KEYWORDS = [...SPAM_KEYWORDS_EN, ...SPAM_KEYWORDS_HE];

/**
 * Sanitize comment content to prevent XSS attacks
 * Removes HTML tags, scripts, event handlers, and dangerous content
 */
export function sanitizeCommentContent(content: string): string {
  if (!content) return '';

  let sanitized = content.trim();

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script tags and their content (case-insensitive)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: and data: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  // Remove style attributes
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*["']/gi, '');

  // Normalize whitespace (but preserve intentional line breaks)
  sanitized = sanitized.replace(/\t/g, ' '); // Replace tabs with spaces
  sanitized = sanitized.replace(/ {2,}/g, ' '); // Multiple spaces to single space
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks

  return sanitized.trim();
}

/**
 * Detect spam content based on keywords and patterns
 * Returns { isSpam: boolean, reason?: string }
 */
export function detectSpamComment(data: {
  firstName: string;
  lastName: string;
  email: string;
  commentContent: string;
  suggestedEdit?: string | null;
}): { isSpam: boolean; reason?: string } {
  const fullContent = `${data.firstName} ${data.lastName} ${data.email} ${data.commentContent} ${data.suggestedEdit || ''}`.toLowerCase();

  // Check for spam keywords (case-insensitive)
  for (const keyword of ALL_SPAM_KEYWORDS) {
    if (fullContent.includes(keyword.toLowerCase())) {
      return {
        isSpam: true,
        reason: `תגובה מכילה מילת ספאם חשודה: "${keyword}"`,
      };
    }
  }

  // Check for excessive URLs (more than 2 URLs = spam)
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = fullContent.match(urlRegex) || [];
  if (urls.length > 2) {
    return {
      isSpam: true,
      reason: `תגובה מכילה יותר מדי קישורים (${urls.length})`,
    };
  }

  // Check for repetitive content (same word repeated 10+ times)
  const words = data.commentContent.split(/\s+/);
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^\u0590-\u05FFa-z0-9]/g, '');
    if (cleanWord.length >= 3) {
      wordCounts.set(cleanWord, (wordCounts.get(cleanWord) || 0) + 1);
      if (wordCounts.get(cleanWord)! >= 10) {
        return {
          isSpam: true,
          reason: `תגובה מכילה חזרה מוגזמת על המילה "${cleanWord}"`,
        };
      }
    }
  }

  // Check for all caps (YELLING) - more than 50% uppercase
  const uppercaseLetters = data.commentContent.match(/[A-ZА-Я]/g) || [];
  const totalLetters = data.commentContent.match(/[A-ZА-Яa-zа-я]/g) || [];
  if (totalLetters.length > 20 && uppercaseLetters.length / totalLetters.length > 0.5) {
    return {
      isSpam: true,
      reason: 'תגובה כתובה באותיות גדולות בלבד (CAPS LOCK)',
    };
  }

  // Check for phone number spam (multiple phone numbers in content)
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  const phones = data.commentContent.match(phoneRegex) || [];
  if (phones.length > 2) {
    return {
      isSpam: true,
      reason: 'תגובה מכילה יותר מדי מספרי טלפון',
    };
  }

  // Check for email spam (multiple emails in content - excluding their own email)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = data.commentContent.match(emailRegex) || [];
  const otherEmails = emails.filter(e => e.toLowerCase() !== data.email.toLowerCase());
  if (otherEmails.length > 1) {
    return {
      isSpam: true,
      reason: 'תגובה מכילה כתובות דוא״ל מרובות',
    };
  }

  return { isSpam: false };
}

/**
 * Check for duplicate comments from same email for same paragraph
 * Detects if user submitted similar content in last 24 hours
 */
export async function isDuplicateComment(
  email: string,
  paragraphId: number,
  content: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find recent comments from same email for same paragraph
  const recentComments = await prisma.lawComment.findMany({
    where: {
      email: email.toLowerCase(),
      paragraphId,
      submittedAt: {
        gte: twentyFourHoursAgo,
      },
    },
    select: {
      commentContent: true,
    },
  });

  if (recentComments.length === 0) {
    return false;
  }

  // Normalize content for comparison
  const normalizedNewContent = normalizeContentForComparison(content);

  // Check similarity with each recent comment
  for (const comment of recentComments) {
    const normalizedExisting = normalizeContentForComparison(comment.commentContent);

    // Calculate simple similarity (90%+ match = duplicate)
    const similarity = calculateSimpleSimilarity(normalizedNewContent, normalizedExisting);
    if (similarity >= 0.90) {
      return true; // Found duplicate
    }
  }

  return false;
}

/**
 * Normalize content for duplicate detection
 * Removes punctuation, extra spaces, converts to lowercase
 */
function normalizeContentForComparison(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\u0590-\u05FFa-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate simple similarity between two strings
 * Returns value between 0 (completely different) and 1 (identical)
 */
function calculateSimpleSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Split into words
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));

  // Calculate Jaccard similarity (intersection / union)
  const words1Array = Array.from(words1);
  const intersection = new Set(words1Array.filter(word => words2.has(word)));
  const union = new Set([...words1Array, ...Array.from(words2)]);

  return intersection.size / union.size;
}

/**
 * Sanitize URL to prevent XSS and malicious links
 * Returns sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.toLowerCase().startsWith(protocol)) {
      return null;
    }
  }

  // Only allow http and https
  if (!trimmed.match(/^https?:\/\//i)) {
    return null;
  }

  // Basic URL validation
  try {
    const urlObj = new URL(trimmed);
    // Ensure no embedded credentials
    if (urlObj.username || urlObj.password) {
      return null;
    }
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Check if content has excessive URLs
 * Returns true if more than maxUrls URLs found
 */
export function hasExcessiveUrls(content: string, maxUrls: number = 2): boolean {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = content.match(urlRegex) || [];
  return urls.length > maxUrls;
}

/**
 * Extract and validate IP address from request headers
 * Returns IP address or null if not found
 */
export function extractIpAddress(headers: Headers): string | null {
  // Try various headers (in order of priority)
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip',
  ];

  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
      // Take the first one (client IP)
      const ip = value.split(',')[0].trim();
      if (isValidIp(ip)) {
        return ip;
      }
    }
  }

  return null;
}

/**
 * Basic IP address validation
 */
function isValidIp(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Regex.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Regex.test(ip);
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(headers: Headers): string | null {
  return headers.get('user-agent');
}

/**
 * Calculate content hash for duplicate detection
 * Uses simple string normalization (more robust hashing in production)
 */
export function calculateContentHash(content: string): string {
  const normalized = normalizeContentForComparison(content);
  // In production, use crypto.createHash('sha256')
  // For now, return normalized content as "hash"
  return normalized;
}

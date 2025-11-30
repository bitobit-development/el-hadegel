import crypto from 'crypto';
import { RECRUITMENT_LAW_KEYWORDS } from './comment-constants';

/**
 * Generate SHA-256 hash of content for exact duplicate detection
 */
export function generateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content.trim())
    .digest('hex');
}

/**
 * Normalize content for fuzzy matching
 * - Remove extra whitespace
 * - Lowercase
 * - Remove punctuation
 * - Remove common Hebrew particles
 */
export function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:"'()[\]{}]/g, '')
    .replace(/\b(את|של|על|אל|עם|ל|מ|ב|כ|ה|ש|ו)\b/g, '')
    .trim();
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * Uses Levenshtein distance algorithm
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

/**
 * Check if content matches recruitment law keywords
 */
export function isRecruitmentLawComment(
  content: string,
  minPrimaryMatches: number = 1
): { matches: boolean; keywords: string[] } {
  const lowerContent = content.toLowerCase();
  const matchedKeywords: string[] = [];

  let primaryMatches = 0;

  for (const keyword of RECRUITMENT_LAW_KEYWORDS.primary) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      primaryMatches++;
      matchedKeywords.push(keyword);
    }
  }

  for (const keyword of RECRUITMENT_LAW_KEYWORDS.secondary) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  }

  return {
    matches: primaryMatches >= minPrimaryMatches,
    keywords: matchedKeywords,
  };
}

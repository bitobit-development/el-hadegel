/**
 * Slug Generation Utilities
 *
 * Generates URL-friendly slugs from Hebrew/English titles with:
 * - Hebrew transliteration to English
 * - Normalization (lowercase, hyphens, no special chars)
 * - Validation
 *
 * NOTE: Database-dependent functions (uniqueness checking) are in server actions
 */

/**
 * Hebrew to English transliteration map
 * Maps Hebrew characters to their English equivalents
 */
const HEBREW_TO_ENGLISH: Record<string, string> = {
  // Hebrew letters
  'א': 'a',
  'ב': 'b',
  'ג': 'g',
  'ד': 'd',
  'ה': 'h',
  'ו': 'v',
  'ז': 'z',
  'ח': 'ch',
  'ט': 't',
  'י': 'y',
  'כ': 'k',
  'ך': 'k',
  'ל': 'l',
  'מ': 'm',
  'ם': 'm',
  'נ': 'n',
  'ן': 'n',
  'ס': 's',
  'ע': 'a',
  'פ': 'p',
  'ף': 'f',
  'צ': 'tz',
  'ץ': 'tz',
  'ק': 'k',
  'ר': 'r',
  'ש': 'sh',
  'ת': 't',

  // Common Hebrew words (for better readability)
  'שאלון': 'survey',
  'גיוס': 'recruitment',
  'צהל': 'idf',
  'צה״ל': 'idf',
  'חוק': 'law',
  'חרדים': 'haredim',
  'דעת': 'opinion',
  'קהל': 'public',
  'משפחות': 'families',
  'למען': 'for',
  'תנועת': 'movement',
};

/**
 * Transliterate Hebrew text to English
 *
 * @param text - Hebrew text to transliterate
 * @returns English transliteration
 *
 * @example
 * transliterateHebrew('שאלון גיוס') → 'survey recruitment'
 * transliterateHebrew('תנועת אל-הדגל') → 'movement al-hadegel'
 */
export function transliterateHebrew(text: string): string {
  let result = text;

  // First, replace common Hebrew words (whole words only)
  Object.entries(HEBREW_TO_ENGLISH).forEach(([hebrew, english]) => {
    if (hebrew.length > 1) {
      // Only for multi-character words
      const regex = new RegExp(`\\b${hebrew}\\b`, 'g');
      result = result.replace(regex, english);
    }
  });

  // Then, replace individual Hebrew characters
  result = result
    .split('')
    .map((char) => HEBREW_TO_ENGLISH[char] || char)
    .join('');

  return result;
}

/**
 * Normalize text to slug format
 *
 * - Lowercase
 * - Remove special characters (except hyphens)
 * - Replace spaces with hyphens
 * - Remove duplicate hyphens
 * - Trim hyphens from start/end
 * - Limit length to 100 characters
 *
 * @param text - Text to normalize
 * @returns Normalized slug
 *
 * @example
 * normalizeToSlug('Hello World!') → 'hello-world'
 * normalizeToSlug('Test---Multiple---Hyphens') → 'test-multiple-hyphens'
 */
export function normalizeToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
    .substring(0, 100); // Limit length
}

/**
 * Generate slug from title
 *
 * Combines transliteration and normalization to create a URL-friendly slug
 * Adds a unique suffix to prevent collisions
 *
 * @param title - Questionnaire title (Hebrew or English)
 * @param suffix - Optional suffix (defaults to timestamp)
 * @returns Generated slug
 *
 * @example
 * generateSlug('שאלון גיוס לצה״ל') → 'survey-recruitment-idf-1733337600000'
 * generateSlug('Public Opinion Survey', '-2024') → 'public-opinion-survey-2024'
 */
export function generateSlug(title: string, suffix?: string): string {
  // Step 1: Transliterate Hebrew to English
  const transliterated = transliterateHebrew(title);

  // Step 2: Normalize to slug format
  const normalized = normalizeToSlug(transliterated);

  // Step 3: Add suffix (timestamp or custom)
  const finalSuffix = suffix || `-${Date.now()}`;

  // Step 4: Combine and ensure not empty
  const slug = normalized ? `${normalized}${finalSuffix}` : `questionnaire${finalSuffix}`;

  return slug;
}

/**
 * NOTE: generateUniqueSlug and checkSlugUniqueness have been moved to server actions
 * See: app/actions/questionnaire-actions.ts
 *
 * These functions require database access and must run server-side only.
 */

/**
 * Validate slug format
 *
 * Slug must:
 * - Be 3-100 characters long
 * - Contain only lowercase letters, numbers, and hyphens
 * - Not start or end with hyphen
 * - Not contain consecutive hyphens
 *
 * @param slug - Slug to validate
 * @returns True if valid
 *
 * @example
 * validateSlugFormat('valid-slug-123') → true
 * validateSlugFormat('Invalid Slug') → false (uppercase, space)
 * validateSlugFormat('-invalid') → false (starts with hyphen)
 * validateSlugFormat('a') → false (too short)
 */
export function validateSlugFormat(slug: string): boolean {
  // Check length
  if (slug.length < 3 || slug.length > 100) {
    return false;
  }

  // Check format: lowercase alphanumeric + hyphens, no consecutive hyphens, no leading/trailing hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validate and sanitize user-provided slug
 *
 * If slug is invalid, attempts to fix it by:
 * - Converting to lowercase
 * - Replacing invalid characters
 * - Removing consecutive hyphens
 *
 * @param slug - User-provided slug
 * @returns Sanitized slug or null if cannot be fixed
 *
 * @example
 * sanitizeSlug('My Slug!') → 'my-slug'
 * sanitizeSlug('valid-slug') → 'valid-slug'
 * sanitizeSlug('--invalid--') → null (cannot fix)
 */
export function sanitizeSlug(slug: string): string | null {
  // Try to fix the slug
  const sanitized = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens

  // Validate after sanitization
  if (validateSlugFormat(sanitized)) {
    return sanitized;
  }

  return null;
}

/**
 * Get questionnaire URL from slug
 *
 * @param slug - Questionnaire slug
 * @param short - Use short URL format (default: false)
 * @returns Full questionnaire URL
 *
 * @example
 * getQuestionnaireUrl('army-recruitment-2025') → '/questionnaire/army-recruitment-2025'
 * getQuestionnaireUrl('army-recruitment-2025', true) → '/q/army-recruitment-2025'
 */
export function getQuestionnaireUrl(slug: string, short: boolean = false): string {
  const prefix = short ? '/q' : '/questionnaire';
  return `${prefix}/${slug}`;
}

/**
 * Get full questionnaire URL with domain
 *
 * @param slug - Questionnaire slug
 * @param domain - Domain (default: from env or 'localhost:3000')
 * @param short - Use short URL format (default: false)
 * @returns Full URL with protocol and domain
 *
 * @example
 * getFullQuestionnaireUrl('army-2025') → 'https://elhadegel.co.il/questionnaire/army-2025'
 * getFullQuestionnaireUrl('army-2025', 'custom.com', true) → 'https://custom.com/q/army-2025'
 */
export function getFullQuestionnaireUrl(
  slug: string,
  domain?: string,
  short: boolean = false
): string {
  const finalDomain = domain || process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000';
  const protocol = finalDomain.includes('localhost') ? 'http' : 'https';
  const path = getQuestionnaireUrl(slug, short);

  return `${protocol}://${finalDomain}${path}`;
}

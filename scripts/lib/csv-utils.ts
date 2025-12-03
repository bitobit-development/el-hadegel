/**
 * Shared CSV utility functions for historical comment import
 * Handles UTF-8 encoding, parsing, and field normalization
 */

import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';

/**
 * CSV row interface matching historical comment structure
 */
export interface HistoricalCommentRow {
  mkId: string;
  content: string;
  sourceUrl: string;
  sourcePlatform: string;
  sourceType: string;
  commentDate: string;
  sourceName?: string;
  sourceCredibility?: string;
  imageUrl?: string;
  videoUrl?: string;
  additionalContext?: string;
}

/**
 * Valid source platforms (exact match required)
 */
export const VALID_PLATFORMS = [
  'News',
  'Twitter',
  'Facebook',
  'YouTube',
  'Knesset',
  'Interview',
  'Other',
] as const;

export type SourcePlatform = typeof VALID_PLATFORMS[number];

/**
 * Valid source types
 */
export const VALID_SOURCE_TYPES = ['Primary', 'Secondary'] as const;
export type SourceType = typeof VALID_SOURCE_TYPES[number];

/**
 * Platform name variations mapping to canonical names
 */
export const PLATFORM_ALIASES: Record<string, SourcePlatform> = {
  twitter: 'Twitter',
  x: 'Twitter',
  tweet: 'Twitter',
  facebook: 'Facebook',
  fb: 'Facebook',
  youtube: 'YouTube',
  yt: 'YouTube',
  news: 'News',
  newspaper: 'News',
  article: 'News',
  knesset: 'Knesset',
  interview: 'Interview',
  other: 'Other',
};

/**
 * Field name aliases for flexible CSV parsing
 */
export const FIELD_ALIASES: Record<string, string> = {
  mk_id: 'mkId',
  mk: 'mkId',
  member_id: 'mkId',
  comment: 'content',
  text: 'content',
  comment_content: 'content',
  url: 'sourceUrl',
  source: 'sourceUrl',
  link: 'sourceUrl',
  platform: 'sourcePlatform',
  source_platform: 'sourcePlatform',
  type: 'sourceType',
  source_type: 'sourceType',
  date: 'commentDate',
  comment_date: 'commentDate',
  posted_at: 'commentDate',
  name: 'sourceName',
  source_name: 'sourceName',
  credibility: 'sourceCredibility',
  source_credibility: 'sourceCredibility',
  image: 'imageUrl',
  image_url: 'imageUrl',
  video: 'videoUrl',
  video_url: 'videoUrl',
  context: 'additionalContext',
  additional_context: 'additionalContext',
  notes: 'additionalContext',
};

/**
 * Read and parse CSV file with proper UTF-8 encoding
 * @param filePath Path to CSV file
 * @returns Array of parsed rows
 */
export async function readCsvFile(
  filePath: string
): Promise<HistoricalCommentRow[]> {
  try {
    // Read file with UTF-8 BOM support
    const fileContent = await readFile(filePath, 'utf-8');

    // Remove BOM if present
    const cleanContent = fileContent.replace(/^\uFEFF/, '');

    // Parse CSV
    const records = parse(cleanContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true, // Allow rows with different column counts
    });

    // Normalize field names
    return records.map((record: any) => normalizeFieldNames(record));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`קובץ CSV לא נמצא: ${filePath}`);
    }
    throw new Error(
      `שגיאה בקריאת קובץ CSV: ${(error as Error).message}`
    );
  }
}

/**
 * Normalize field names using aliases
 * @param row Raw CSV row
 * @returns Row with normalized field names
 */
function normalizeFieldNames(row: any): HistoricalCommentRow {
  const normalized: any = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = FIELD_ALIASES[key.toLowerCase()] || key;
    normalized[normalizedKey] = value;
  }

  return normalized as HistoricalCommentRow;
}

/**
 * Normalize platform name to canonical value
 * @param platform Raw platform name
 * @returns Canonical platform name or null if invalid
 */
export function normalizePlatform(
  platform: string
): SourcePlatform | null {
  const normalized = platform.toLowerCase().trim();
  return PLATFORM_ALIASES[normalized] || null;
}

/**
 * Validate and normalize source type
 * @param sourceType Raw source type
 * @returns Canonical source type or 'Secondary' as default
 */
export function normalizeSourceType(sourceType?: string): SourceType {
  if (!sourceType) return 'Secondary';

  const normalized = sourceType.trim();
  if (normalized === 'Primary' || normalized === 'Secondary') {
    return normalized;
  }

  // Default to Secondary for safety
  return 'Secondary';
}

/**
 * Validate URL format
 * @param url URL string to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate ISO8601 date format
 * @param dateStr Date string to validate
 * @returns True if valid ISO8601 format
 */
export function isValidIso8601(dateStr: string): boolean {
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!iso8601Regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Clean HTML tags from content
 * @param content Content with potential HTML
 * @returns Clean text
 */
export function stripHtmlTags(content: string): string {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&') // Replace &amp;
    .replace(/&lt;/g, '<') // Replace &lt;
    .replace(/&gt;/g, '>') // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'") // Replace &#39;
    .trim();
}

/**
 * Check if content contains recruitment law keywords
 * @param content Comment content
 * @returns True if keywords found
 */
export function hasRecruitmentKeywords(content: string): boolean {
  const primaryKeywords = [
    'חוק גיוס',
    'חוק הגיוס',
    'גיוס חרדים',
    'recruitment law',
    'draft law',
  ];

  const lowerContent = content.toLowerCase();
  return primaryKeywords.some((keyword) =>
    lowerContent.includes(keyword.toLowerCase())
  );
}

/**
 * Generate sample CSV template
 * @returns CSV template string
 */
export function generateCsvTemplate(): string {
  return `mkId,content,sourceUrl,sourcePlatform,sourceType,commentDate,sourceName,sourceCredibility,imageUrl,videoUrl,additionalContext
1,"חוק הגיוס הוא חוק חשוב למדינת ישראל","https://www.ynet.co.il/news/article/example1",News,Primary,2024-01-15T10:00:00Z,ידיעות אחרונות,8,,,
2,"גיוס חרדים נושא מורכב שדורש דיון רציני","https://x.com/username/status/123456",Twitter,Primary,2024-01-16T14:30:00Z,,6,https://pbs.twimg.com/media/example.jpg,,
3,"נאום של השר בנושא הגיוס בכנסת","https://main.knesset.gov.il/Activity/Plenum/example",Knesset,Primary,2024-01-17T11:00:00Z,כנסת ישראל,9,,https://www.youtube.com/watch?v=example,
`;
}

/**
 * Count total rows in CSV file (excluding header)
 * @param filePath Path to CSV file
 * @returns Number of data rows
 */
export async function countCsvRows(filePath: string): Promise<number> {
  const rows = await readCsvFile(filePath);
  return rows.length;
}

/**
 * Validate required fields are present
 * @param row CSV row
 * @returns Array of missing field names
 */
export function getMissingRequiredFields(
  row: HistoricalCommentRow
): string[] {
  const required = [
    'mkId',
    'content',
    'sourceUrl',
    'sourcePlatform',
    'sourceType',
    'commentDate',
  ];

  return required.filter((field) => {
    const value = row[field as keyof HistoricalCommentRow];
    return !value || value.toString().trim() === '';
  });
}

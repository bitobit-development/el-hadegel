/**
 * Historical Comments Constants
 *
 * Classification keywords, source credibility mappings, and platform definitions
 * for the Historical Comments tracking system.
 */

// Classification keywords (Hebrew and English)
export const RECRUITMENT_LAW_KEYWORDS = {
  primary: [
    'חוק גיוס',
    'חוק הגיוס',
    'recruitment law',
    'draft law',
    'גיוס חרדים',
    'haredi draft',
  ],
  secondary: [
    'שירות צבאי',
    'צה"ל',
    'IDF',
    'military service',
  ],
};

// Source credibility mapping (1-10 scale)
export const SOURCE_CREDIBILITY: Record<string, number> = {
  'Knesset': 10,
  'Interview': 8,
  'News': 7,
  'YouTube': 6,
  'Twitter': 5,
  'Facebook': 4,
};

// Platform options
export const COMMENT_PLATFORMS = [
  'News',
  'Twitter',
  'Facebook',
  'YouTube',
  'Knesset',
  'Interview',
  'Other',
] as const;

export type CommentPlatform = typeof COMMENT_PLATFORMS[number];

// Source type options
export const SOURCE_TYPES = ['Primary', 'Secondary'] as const;
export type SourceType = typeof SOURCE_TYPES[number];

// Topic categories
export const COMMENT_TOPICS = ['IDF_RECRUITMENT', 'OTHER'] as const;
export type CommentTopic = typeof COMMENT_TOPICS[number];

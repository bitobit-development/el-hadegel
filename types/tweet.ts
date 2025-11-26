// Tweet data types
export interface TweetData {
  id: number;
  mkId: number;
  mkName: string;
  content: string;
  sourceUrl: string | null;
  sourcePlatform: string;
  postedAt: Date;
  createdAt: Date;
}

// API request/response types
export interface CreateTweetRequest {
  mkId: number;
  content: string;
  sourceUrl?: string;
  sourcePlatform: string;
  postedAt: string; // ISO 8601 date string
}

export interface CreateTweetResponse {
  success: boolean;
  tweet?: TweetData;
  error?: string;
}

// API Key types
export interface ApiKeyData {
  id: number;
  name: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  createdBy: string;
}

// Platform enum
export const TWEET_PLATFORMS = [
  'Twitter',
  'Facebook',
  'Instagram',
  'News',
  'Knesset Website',
  'Other',
] as const;

export type TweetPlatform = typeof TWEET_PLATFORMS[number];

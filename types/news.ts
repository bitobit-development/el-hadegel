import { NewsPost as PrismaNewsPost } from '@prisma/client';

export type NewsPostData = PrismaNewsPost;

/**
 * NewsPost with MK information (joined data)
 */
export interface NewsPostWithMK extends NewsPostData {
  mk?: {
    id: number;
    nameHe: string;
    faction: string;
  } | null;
}

export interface CreateNewsPostRequest {
  content: string;
  sourceUrl: string;
  sourceName?: string;
  postedAt?: string; // ISO 8601 format
  mkId?: number; // Optional: Manually specify MK ID
}

export interface NewsPostsResponse {
  posts: NewsPostData[];
  total: number;
}

export interface OpenGraphData {
  title: string | null;
  image: string | null;
  description: string | null;
  siteName: string | null;
}

// Validation constants
export const NEWS_POST_CONSTRAINTS = {
  MIN_CONTENT_LENGTH: 10,
  MAX_CONTENT_LENGTH: 2000,
  MAX_URL_LENGTH: 500,
  MAX_POSTS_DISPLAY: 10, // User requirement: max 10 posts
} as const;

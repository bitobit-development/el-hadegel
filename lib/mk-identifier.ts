import prisma from '@/lib/prisma';
import { getMKIdFromXUrl, getMKIdFromHandle, MK_NAME_MAP } from './mk-handle-mapping';

/**
 * MK Identifier Service
 *
 * Identifies which MK (Knesset Member) a news post or content belongs to.
 * Uses multiple detection strategies:
 * 1. URL matching (X/Twitter URLs)
 * 2. Name matching in content
 * 3. Manual MK ID
 */

export interface MKIdentificationResult {
  mkId: number | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  method: 'url_match' | 'name_match' | 'manual' | 'none';
  details?: string;
}

/**
 * Identify MK from news post data
 *
 * @param sourceUrl - URL of the news source
 * @param content - Hebrew content of the post
 * @param manualMkId - Optional manually provided MK ID
 * @returns MK identification result with confidence level
 */
export async function identifyMK(
  sourceUrl: string,
  content: string,
  manualMkId?: number
): Promise<MKIdentificationResult> {
  // Strategy 1: Manual MK ID (highest confidence)
  if (manualMkId !== undefined) {
    const isValid = await validateMKId(manualMkId);
    if (isValid) {
      return {
        mkId: manualMkId,
        confidence: 'high',
        method: 'manual',
        details: 'Manually provided MK ID',
      };
    }
  }

  // Strategy 2: URL matching (high confidence)
  const urlMkId = await identifyFromUrl(sourceUrl);
  if (urlMkId !== null) {
    return {
      mkId: urlMkId,
      confidence: 'high',
      method: 'url_match',
      details: `Matched from X/Twitter URL: ${sourceUrl}`,
    };
  }

  // Strategy 3: Name matching in content (medium confidence)
  const nameMkId = await identifyFromContent(content);
  if (nameMkId !== null) {
    return {
      mkId: nameMkId,
      confidence: 'medium',
      method: 'name_match',
      details: 'Matched from MK name in content',
    };
  }

  // No match found
  return {
    mkId: null,
    confidence: 'none',
    method: 'none',
    details: 'Could not identify MK from URL or content',
  };
}

/**
 * Identify MK from URL (X/Twitter only)
 *
 * @param url - Source URL
 * @returns MK database ID or null
 */
async function identifyFromUrl(url: string): Promise<number | null> {
  try {
    const urlObj = new URL(url);

    // Check if it's an X/Twitter URL
    if (!urlObj.hostname.includes('twitter.com') && !urlObj.hostname.includes('x.com')) {
      return null;
    }

    // Try to get Knesset MK ID from handle mapping
    const knessetMkId = getMKIdFromXUrl(url);
    if (!knessetMkId) {
      return null;
    }

    // Convert Knesset MK ID to our database ID
    const dbMkId = await getMKIdFromKnessetId(parseInt(knessetMkId, 10));
    return dbMkId;
  } catch {
    return null;
  }
}

/**
 * Identify MK from content by name matching
 *
 * Searches for MK names in the content and returns the best match.
 * Uses fuzzy matching to handle Hebrew variations.
 *
 * @param content - Hebrew content to search
 * @returns MK database ID or null
 */
async function identifyFromContent(content: string): Promise<number | null> {
  // Normalize content for matching (lowercase, remove extra spaces)
  const normalizedContent = content.trim().replace(/\s+/g, ' ');

  // Get all MKs from database
  const mks = await prisma.mK.findMany({
    select: {
      id: true,
      mkId: true,
      nameHe: true,
    },
  });

  // Try exact name matching first
  for (const mk of mks) {
    if (normalizedContent.includes(mk.nameHe)) {
      return mk.id;
    }
  }

  // Try matching with name variations (first name + last name)
  for (const mk of mks) {
    const nameParts = mk.nameHe.split(' ');

    // Check if content contains both first and last name
    const hasAllParts = nameParts.every(part =>
      normalizedContent.includes(part) && part.length > 2 // Ignore short words
    );

    if (hasAllParts && nameParts.length >= 2) {
      return mk.id;
    }
  }

  // Try checking coalition members from mapping (as fallback)
  for (const [knessetMkId, name] of Object.entries(MK_NAME_MAP)) {
    if (normalizedContent.includes(name)) {
      // Find the database ID for this Knesset MK ID
      const mk = mks.find(m => m.mkId === parseInt(knessetMkId, 10));
      if (mk) {
        return mk.id;
      }
    }
  }

  return null;
}

/**
 * Validate that an MK ID exists in the database
 *
 * @param mkId - Database MK ID to validate
 * @returns true if MK exists
 */
async function validateMKId(mkId: number): Promise<boolean> {
  const mk = await prisma.mK.findUnique({
    where: { id: mkId },
    select: { id: true },
  });

  return mk !== null;
}

/**
 * Get MK ID from Knesset MK ID
 *
 * Converts Knesset official ID (e.g., 771) to our database ID
 *
 * @param knessetMkId - Official Knesset MK ID
 * @returns Database MK ID or null
 */
export async function getMKIdFromKnessetId(knessetMkId: number): Promise<number | null> {
  const mk = await prisma.mK.findUnique({
    where: { mkId: knessetMkId },
    select: { id: true },
  });

  return mk?.id ?? null;
}

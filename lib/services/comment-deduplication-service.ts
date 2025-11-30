import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import {
  generateContentHash,
  normalizeContent,
  calculateSimilarity,
} from '@/lib/content-hash';
import { SOURCE_CREDIBILITY } from '@/lib/comment-constants';

const SIMILARITY_THRESHOLD = 0.85; // 85% similarity = duplicate

interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOf?: number;
  duplicateGroup?: string;
  similarComments: Array<{
    id: number;
    similarity: number;
    content: string;
  }>;
}

export class CommentDeduplicationService {
  /**
   * Check if comment is a duplicate of existing comments for this MK
   */
  async checkForDuplicates(
    mkId: number,
    content: string,
    sourceUrl: string
  ): Promise<DuplicateCheckResult> {
    const contentHash = generateContentHash(content);
    const normalizedContent = normalizeContent(content);

    // 1. Check for exact hash match
    const exactMatch = await prisma.historicalComment.findFirst({
      where: {
        mkId,
        contentHash,
      },
      select: { id: true, duplicateGroup: true },
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        duplicateOf: exactMatch.id,
        duplicateGroup: exactMatch.duplicateGroup || undefined,
        similarComments: [],
      };
    }

    // 2. Check for fuzzy matches (same MK, last 90 days)
    const recentComments = await prisma.historicalComment.findMany({
      where: {
        mkId,
        commentDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        content: true,
        normalizedContent: true,
        duplicateGroup: true,
      },
    });

    const similarComments = recentComments
      .map((comment) => ({
        id: comment.id,
        content: comment.content,
        similarity: calculateSimilarity(
          normalizedContent,
          comment.normalizedContent
        ),
      }))
      .filter((result) => result.similarity >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity);

    if (similarComments.length > 0) {
      const primaryComment = recentComments.find(
        (c) => c.id === similarComments[0].id
      );
      return {
        isDuplicate: true,
        duplicateOf: similarComments[0].id,
        duplicateGroup: primaryComment?.duplicateGroup || undefined,
        similarComments,
      };
    }

    // 3. Not a duplicate
    return {
      isDuplicate: false,
      similarComments: [],
    };
  }

  /**
   * Create new comment with deduplication handling
   */
  async createComment(data: {
    mkId: number;
    content: string;
    sourceUrl: string;
    sourcePlatform: string;
    sourceType: string;
    sourceName?: string;
    commentDate: Date;
    keywords: string[];
    imageUrl?: string;
    videoUrl?: string;
  }) {
    const duplicateCheck = await this.checkForDuplicates(
      data.mkId,
      data.content,
      data.sourceUrl
    );

    const contentHash = generateContentHash(data.content);
    const normalizedContent = normalizeContent(data.content);

    if (duplicateCheck.isDuplicate) {
      // Add as duplicate reference
      return prisma.historicalComment.create({
        data: {
          ...data,
          contentHash,
          normalizedContent,
          duplicateOf: duplicateCheck.duplicateOf,
          duplicateGroup:
            duplicateCheck.duplicateGroup || uuidv4(),
          publishedAt: new Date(),
          sourceCredibility:
            SOURCE_CREDIBILITY[data.sourcePlatform] || 5,
        },
      });
    } else {
      // Create new primary comment
      const duplicateGroup = uuidv4();
      return prisma.historicalComment.create({
        data: {
          ...data,
          contentHash,
          normalizedContent,
          duplicateGroup,
          publishedAt: new Date(),
          sourceCredibility:
            SOURCE_CREDIBILITY[data.sourcePlatform] || 5,
        },
      });
    }
  }

  /**
   * Get primary (non-duplicate) comments for an MK
   */
  async getPrimaryComments(mkId: number, limit: number = 50) {
    return prisma.historicalComment.findMany({
      where: {
        mkId,
        duplicateOf: null,
      },
      orderBy: {
        commentDate: 'desc',
      },
      take: limit,
      include: {
        duplicates: {
          select: {
            id: true,
            sourceUrl: true,
            sourcePlatform: true,
            sourceName: true,
            publishedAt: true,
          },
        },
      },
    });
  }
}

export const commentDeduplicationService = new CommentDeduplicationService();

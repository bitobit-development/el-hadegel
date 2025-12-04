'use server';

/**
 * Video Management Server Actions
 *
 * Comprehensive server-side logic for video CRUD operations, like/dislike
 * functionality, statistics, and admin management. Includes public actions
 * (no auth) and admin-only actions (require NextAuth session).
 */

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { unlink } from 'fs/promises';
import { join } from 'path';
import type { VideoData, VideoStats, VideoUploadData } from '@/types/video';
import {
  videoCreateSchema,
  videoUpdateSchema,
  videoReorderSchema,
  type VideoUpdateInput,
} from '@/lib/validation/video-validation';

// ========== HELPER FUNCTIONS ==========

/**
 * Map Prisma Video record to VideoData with like/dislike counts
 */
function mapToVideoData(
  video: any,
  ipAddress?: string
): VideoData {
  const likes = video.likes || [];
  const likeCount = likes.filter((l: any) => l.isLike).length;
  const dislikeCount = likes.filter((l: any) => !l.isLike).length;

  // Determine user reaction if IP provided
  let userReaction: 'like' | 'dislike' | null = null;
  if (ipAddress) {
    const userVote = likes.find((l: any) => l.ipAddress === ipAddress);
    if (userVote) {
      userReaction = userVote.isLike ? 'like' : 'dislike';
    }
  }

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    fileName: video.fileName,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    orderIndex: video.orderIndex,
    isPublished: video.isPublished,
    viewCount: video.viewCount,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    likeCount,
    dislikeCount,
    userReaction,
  };
}

// ========== PUBLIC ACTIONS (No Authentication Required) ==========

/**
 * Get published videos for landing page display
 *
 * @param limit - Number of videos to fetch (default: 20)
 * @returns Array of published videos ordered by orderIndex
 */
export async function getPublishedVideos(limit: number = 20): Promise<VideoData[]> {
  try {
    const videos = await prisma.video.findMany({
      where: {
        isPublished: true,
      },
      include: {
        likes: true, // Include for counting
      },
      orderBy: {
        orderIndex: 'asc',
      },
      take: limit,
    });

    return videos.map((video) => mapToVideoData(video));
  } catch (error) {
    console.error('Error fetching published videos:', error);
    throw new Error('שגיאה בטעינת הסרטונים');
  }
}

/**
 * Get single video by ID with user's reaction
 *
 * @param id - Video ID
 * @param ipAddress - Optional IP address to fetch user's reaction
 * @returns Video data with userReaction or null if not found
 */
export async function getVideoById(
  id: number,
  ipAddress?: string
): Promise<VideoData | null> {
  try {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        likes: true,
      },
    });

    if (!video) {
      return null;
    }

    return mapToVideoData(video, ipAddress);
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    throw new Error('שגיאה בטעינת הסרטון');
  }
}

/**
 * Toggle video like/dislike (anonymous voting via IP address)
 *
 * Logic:
 * - If user already voted same type: Remove vote (toggle off)
 * - If user already voted opposite type: Switch vote (like ↔ dislike)
 * - If user never voted: Create new vote
 *
 * @param videoId - Video ID to react to
 * @param isLike - true = like, false = dislike
 * @param ipAddress - User's IP address (for anonymous tracking)
 * @param userAgent - Optional browser fingerprint for spam detection
 * @returns Updated like/dislike counts and user's new reaction state
 */
export async function toggleVideoLike(
  videoId: number,
  isLike: boolean,
  ipAddress: string,
  userAgent?: string
): Promise<{ likeCount: number; dislikeCount: number; userReaction: 'like' | 'dislike' | null }> {
  try {
    // Find existing vote
    const existingVote = await prisma.videoLike.findUnique({
      where: {
        videoId_ipAddress: {
          videoId,
          ipAddress,
        },
      },
    });

    let userReaction: 'like' | 'dislike' | null = null;

    if (existingVote) {
      if (existingVote.isLike === isLike) {
        // Same vote type → Remove vote (toggle off)
        await prisma.videoLike.delete({
          where: {
            id: existingVote.id,
          },
        });
        userReaction = null;
      } else {
        // Opposite vote type → Switch vote
        await prisma.videoLike.update({
          where: {
            id: existingVote.id,
          },
          data: {
            isLike,
          },
        });
        userReaction = isLike ? 'like' : 'dislike';
      }
    } else {
      // No existing vote → Create new vote
      await prisma.videoLike.create({
        data: {
          videoId,
          ipAddress,
          userAgent,
          isLike,
        },
      });
      userReaction = isLike ? 'like' : 'dislike';
    }

    // Calculate new counts using groupBy for efficiency
    const counts = await prisma.videoLike.groupBy({
      by: ['isLike'],
      where: { videoId },
      _count: true,
    });

    const likeCount = counts.find((c) => c.isLike)?._count || 0;
    const dislikeCount = counts.find((c) => !c.isLike)?._count || 0;

    // Revalidate landing page to update counts
    revalidatePath('/');

    return {
      likeCount,
      dislikeCount,
      userReaction,
    };
  } catch (error) {
    console.error('Error toggling video like:', error);
    throw new Error('שגיאה בעדכון התגובה');
  }
}

// ========== ADMIN ACTIONS (Require Authentication) ==========

/**
 * Get all videos for admin table (published and draft)
 *
 * @returns Array of all videos ordered by orderIndex
 * @throws Unauthorized if no session
 */
export async function getAllVideos(): Promise<VideoData[]> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    const videos = await prisma.video.findMany({
      include: {
        likes: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    return videos.map((video) => mapToVideoData(video));
  } catch (error) {
    console.error('Error fetching all videos:', error);
    throw new Error('שגיאה בטעינת כל הסרטונים');
  }
}

/**
 * Create video record after file upload
 *
 * @param data - Video metadata (title, description, fileName, etc.)
 * @returns Created video data
 * @throws Validation error if data invalid
 * @throws Unauthorized if no session
 */
export async function createVideo(data: VideoUploadData): Promise<VideoData> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Validate input
    const validatedData = videoCreateSchema.parse(data);

    // Find max orderIndex to append at end
    const maxVideo = await prisma.video.findFirst({
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        orderIndex: true,
      },
    });

    const nextOrderIndex = (maxVideo?.orderIndex ?? -1) + 1;

    // Create video (draft by default)
    const video = await prisma.video.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        fileName: validatedData.fileName,
        thumbnailUrl: validatedData.thumbnailUrl || null,
        duration: validatedData.duration || null,
        orderIndex: nextOrderIndex,
        isPublished: false, // Draft by default
      },
      include: {
        likes: true,
      },
    });

    // Revalidate admin and landing pages
    revalidatePath('/admin/videos');
    revalidatePath('/');

    return mapToVideoData(video);
  } catch (error) {
    console.error('Error creating video:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('שגיאה ביצירת הסרטון');
  }
}

/**
 * Update video metadata (title, description, isPublished, orderIndex)
 *
 * @param id - Video ID to update
 * @param data - Partial update data
 * @returns Updated video data
 * @throws Validation error if data invalid
 * @throws Unauthorized if no session
 */
export async function updateVideo(
  id: number,
  data: VideoUpdateInput
): Promise<VideoData> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Validate partial update data
    const validatedData = videoUpdateSchema.parse(data);

    // Update video
    const video = await prisma.video.update({
      where: { id },
      data: validatedData,
      include: {
        likes: true,
      },
    });

    // Revalidate admin and landing pages
    revalidatePath('/admin/videos');
    revalidatePath('/');

    return mapToVideoData(video);
  } catch (error) {
    console.error('Error updating video:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('שגיאה בעדכון הסרטון');
  }
}

/**
 * Delete video record and file from filesystem
 *
 * @param id - Video ID to delete
 * @returns true on success
 * @throws Unauthorized if no session
 */
export async function deleteVideo(id: number): Promise<boolean> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Find video to get fileName
    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        fileName: true,
      },
    });

    if (!video) {
      throw new Error('הסרטון לא נמצא');
    }

    // Delete video record (CASCADE deletes VideoLike records automatically)
    await prisma.video.delete({
      where: { id },
    });

    // Attempt to delete file from filesystem (non-blocking if file doesn't exist)
    const filePath = join(process.cwd(), 'videos', video.fileName);
    await unlink(filePath).catch((err) => {
      console.warn('Failed to delete video file (may not exist):', err);
    });

    // Revalidate admin and landing pages
    revalidatePath('/admin/videos');
    revalidatePath('/');

    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('שגיאה במחיקת הסרטון');
  }
}

/**
 * Bulk update orderIndex for drag-and-drop reordering
 *
 * @param updates - Array of { id, orderIndex } pairs
 * @returns true on success
 * @throws Validation error if data invalid
 * @throws Unauthorized if no session
 */
export async function reorderVideos(
  updates: Array<{ id: number; orderIndex: number }>
): Promise<boolean> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Validate reorder data
    const validatedUpdates = videoReorderSchema.parse(updates);

    // Use transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      validatedUpdates.map(({ id, orderIndex }) =>
        prisma.video.update({
          where: { id },
          data: { orderIndex },
        })
      )
    );

    // Revalidate admin and landing pages
    revalidatePath('/admin/videos');
    revalidatePath('/');

    return true;
  } catch (error) {
    console.error('Error reordering videos:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('שגיאה בסידור הסרטונים');
  }
}

/**
 * Get dashboard statistics for admin overview
 *
 * @returns Video statistics (counts, views, likes/dislikes)
 * @throws Unauthorized if no session
 */
export async function getVideoStats(): Promise<VideoStats> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Count videos by status
    const [total, published, draft, viewAggregate, likeStats] = await Promise.all([
      prisma.video.count(),
      prisma.video.count({ where: { isPublished: true } }),
      prisma.video.count({ where: { isPublished: false } }),
      prisma.video.aggregate({
        _sum: {
          viewCount: true,
        },
      }),
      prisma.videoLike.groupBy({
        by: ['isLike'],
        _count: {
          _all: true,
        },
      }),
    ]);

    const totalLikes = likeStats.find((s) => s.isLike)?._count._all || 0;
    const totalDislikes = likeStats.find((s) => !s.isLike)?._count._all || 0;

    return {
      total,
      published,
      draft,
      totalViews: viewAggregate._sum.viewCount || 0,
      totalLikes,
      totalDislikes,
    };
  } catch (error) {
    console.error('Error fetching video stats:', error);
    throw new Error('שגיאה בטעינת סטטיסטיקות');
  }
}

/**
 * Increment view counter when video is played
 *
 * @param videoId - Video ID to increment view count for
 * @returns void
 */
export async function incrementViewCount(videoId: number): Promise<void> {
  try {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // No revalidation needed (view counts don't require page refresh)
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Non-blocking - don't throw error to avoid disrupting video playback
  }
}

/**
 * Quick publish/unpublish toggle
 *
 * @param videoId - Video ID to toggle publish status
 * @returns Updated video data
 * @throws Unauthorized if no session
 */
export async function togglePublishStatus(videoId: number): Promise<VideoData> {
  const session = await auth();
  if (!session) {
    throw new Error('Unauthorized');
  }

  try {
    // Find current video
    const currentVideo = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        isPublished: true,
      },
    });

    if (!currentVideo) {
      throw new Error('הסרטון לא נמצא');
    }

    // Toggle publish status
    const video = await prisma.video.update({
      where: { id: videoId },
      data: {
        isPublished: !currentVideo.isPublished,
      },
      include: {
        likes: true,
      },
    });

    // Revalidate admin and landing pages with aggressive cache busting
    revalidatePath('/admin/videos', 'layout');
    revalidatePath('/', 'layout');

    return mapToVideoData(video);
  } catch (error) {
    console.error('Error toggling publish status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('שגיאה בשינוי סטטוס פרסום');
  }
}

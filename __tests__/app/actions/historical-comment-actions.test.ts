import {
  getMKHistoricalComments,
  getMKHistoricalCommentCount,
  getHistoricalCommentCounts,
  verifyHistoricalComment,
  deleteHistoricalComment,
} from '@/app/actions/historical-comment-actions'
import prisma from '@/lib/prisma'
import { commentDeduplicationService } from '@/lib/services/comment-deduplication-service'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    historicalComment: {
      count: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/services/comment-deduplication-service', () => ({
  commentDeduplicationService: {
    getPrimaryComments: jest.fn(),
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockService = commentDeduplicationService as jest.Mocked<
  typeof commentDeduplicationService
>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>

describe('historical-comment-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.error in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getMKHistoricalComments', () => {
    it('should fetch comments for MK using service', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'Test comment',
          sourceUrl: 'https://x.com/test',
          sourcePlatform: 'Twitter',
          sourceType: 'Primary',
          sourceName: 'Twitter',
          sourceCredibility: 8,
          commentDate: new Date('2024-01-15'),
          publishedAt: new Date('2024-01-15'),
          keywords: ['גיוס'],
          isVerified: false,
          imageUrl: null,
          videoUrl: null,
          duplicateOf: null,
          duplicates: [],
        },
      ]

      mockService.getPrimaryComments.mockResolvedValue(mockComments as any)

      const result = await getMKHistoricalComments(1, 50)

      expect(mockService.getPrimaryComments).toHaveBeenCalledWith(1, 50)
      expect(result).toEqual(mockComments)
    })

    it('should use default limit of 50', async () => {
      mockService.getPrimaryComments.mockResolvedValue([])

      await getMKHistoricalComments(1)

      expect(mockService.getPrimaryComments).toHaveBeenCalledWith(1, 50)
    })

    it('should respect custom limit parameter', async () => {
      mockService.getPrimaryComments.mockResolvedValue([])

      await getMKHistoricalComments(1, 10)

      expect(mockService.getPrimaryComments).toHaveBeenCalledWith(1, 10)
    })

    it('should return empty array on error', async () => {
      mockService.getPrimaryComments.mockRejectedValue(
        new Error('Database error')
      )

      const result = await getMKHistoricalComments(1)

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle different MK IDs', async () => {
      mockService.getPrimaryComments.mockResolvedValue([])

      await getMKHistoricalComments(5, 20)

      expect(mockService.getPrimaryComments).toHaveBeenCalledWith(5, 20)
    })
  })

  describe('getMKHistoricalCommentCount', () => {
    it('should return count of non-duplicate comments', async () => {
      mockPrisma.historicalComment.count.mockResolvedValue(15)

      const result = await getMKHistoricalCommentCount(1)

      expect(mockPrisma.historicalComment.count).toHaveBeenCalledWith({
        where: {
          mkId: 1,
          duplicateOf: null,
        },
      })
      expect(result).toBe(15)
    })

    it('should return 0 when no comments exist', async () => {
      mockPrisma.historicalComment.count.mockResolvedValue(0)

      const result = await getMKHistoricalCommentCount(1)

      expect(result).toBe(0)
    })

    it('should return 0 on error', async () => {
      mockPrisma.historicalComment.count.mockRejectedValue(
        new Error('Database error')
      )

      const result = await getMKHistoricalCommentCount(1)

      expect(result).toBe(0)
      expect(console.error).toHaveBeenCalled()
    })

    it('should only count primary comments (not duplicates)', async () => {
      mockPrisma.historicalComment.count.mockResolvedValue(5)

      await getMKHistoricalCommentCount(1)

      expect(mockPrisma.historicalComment.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          duplicateOf: null,
        }),
      })
    })
  })

  describe('getHistoricalCommentCounts', () => {
    it('should return counts for multiple MKs', async () => {
      mockPrisma.historicalComment.groupBy.mockResolvedValue([
        { mkId: 1, _count: 10 },
        { mkId: 2, _count: 5 },
        { mkId: 3, _count: 8 },
      ] as any)

      const result = await getHistoricalCommentCounts([1, 2, 3])

      expect(mockPrisma.historicalComment.groupBy).toHaveBeenCalledWith({
        by: ['mkId'],
        where: {
          mkId: { in: [1, 2, 3] },
          duplicateOf: null,
        },
        _count: true,
      })
      expect(result).toEqual({
        1: 10,
        2: 5,
        3: 8,
      })
    })

    it('should return empty object when no counts', async () => {
      mockPrisma.historicalComment.groupBy.mockResolvedValue([])

      const result = await getHistoricalCommentCounts([1, 2, 3])

      expect(result).toEqual({})
    })

    it('should return empty object on error', async () => {
      mockPrisma.historicalComment.groupBy.mockRejectedValue(
        new Error('Database error')
      )

      const result = await getHistoricalCommentCounts([1, 2, 3])

      expect(result).toEqual({})
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle empty array input', async () => {
      mockPrisma.historicalComment.groupBy.mockResolvedValue([])

      const result = await getHistoricalCommentCounts([])

      expect(result).toEqual({})
    })

    it('should only count primary comments', async () => {
      mockPrisma.historicalComment.groupBy.mockResolvedValue([])

      await getHistoricalCommentCounts([1, 2, 3])

      expect(mockPrisma.historicalComment.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            duplicateOf: null,
          }),
        })
      )
    })
  })

  describe('verifyHistoricalComment', () => {
    it('should update verification status successfully', async () => {
      mockPrisma.historicalComment.update.mockResolvedValue({
        id: 1,
        isVerified: true,
      } as any)

      const result = await verifyHistoricalComment(1)

      expect(mockPrisma.historicalComment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isVerified: true },
      })
      expect(result).toBe(true)
    })

    it('should revalidate paths after verification', async () => {
      mockPrisma.historicalComment.update.mockResolvedValue({
        id: 1,
        isVerified: true,
      } as any)

      await verifyHistoricalComment(1)

      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
    })

    it('should return false on error', async () => {
      mockPrisma.historicalComment.update.mockRejectedValue(
        new Error('Comment not found')
      )

      const result = await verifyHistoricalComment(999)

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle different comment IDs', async () => {
      mockPrisma.historicalComment.update.mockResolvedValue({
        id: 42,
        isVerified: true,
      } as any)

      await verifyHistoricalComment(42)

      expect(mockPrisma.historicalComment.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { isVerified: true },
      })
    })
  })

  describe('deleteHistoricalComment', () => {
    it('should delete comment successfully', async () => {
      mockPrisma.historicalComment.delete.mockResolvedValue({
        id: 1,
      } as any)

      const result = await deleteHistoricalComment(1)

      expect(mockPrisma.historicalComment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(result).toBe(true)
    })

    it('should revalidate paths after deletion', async () => {
      mockPrisma.historicalComment.delete.mockResolvedValue({
        id: 1,
      } as any)

      await deleteHistoricalComment(1)

      expect(mockRevalidatePath).toHaveBeenCalledWith('/')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
    })

    it('should return false when comment not found', async () => {
      mockPrisma.historicalComment.delete.mockRejectedValue(
        new Error('Comment not found')
      )

      const result = await deleteHistoricalComment(999)

      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle different comment IDs', async () => {
      mockPrisma.historicalComment.delete.mockResolvedValue({
        id: 42,
      } as any)

      await deleteHistoricalComment(42)

      expect(mockPrisma.historicalComment.delete).toHaveBeenCalledWith({
        where: { id: 42 },
      })
    })
  })
})

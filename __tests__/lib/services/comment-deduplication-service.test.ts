import { CommentDeduplicationService } from '@/lib/services/comment-deduplication-service'
import prisma from '@/lib/prisma'

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    historicalComment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('CommentDeduplicationService', () => {
  let service: CommentDeduplicationService

  beforeEach(() => {
    service = new CommentDeduplicationService()
    jest.clearAllMocks()
  })

  describe('checkForDuplicates', () => {
    const mkId = 1
    const content = 'אני תומך בחוק הגיוס'
    const sourceUrl = 'https://x.com/test/123'

    it('should find exact hash match', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue({
        id: 100,
        duplicateGroup: 'existing-group-uuid',
        mkId: 1,
        content: 'אני תומך בחוק הגיוס',
        contentHash: 'abc123',
        normalizedContent: 'אני תומך בחוק הגיוס',
        sourceUrl: 'https://x.com/test/123',
        sourcePlatform: 'Twitter',
        sourceType: 'Primary',
        sourceName: 'Twitter',
        sourceCredibility: 8,
        topic: 'IDF_RECRUITMENT',
        keywords: ['גיוס'],
        isVerified: false,
        commentDate: new Date(),
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        duplicateOf: null,
        imageUrl: null,
        videoUrl: null,
      })

      const result = await service.checkForDuplicates(mkId, content, sourceUrl)

      expect(result.isDuplicate).toBe(true)
      expect(result.duplicateOf).toBe(100)
      expect(result.duplicateGroup).toBe('existing-group-uuid')
      expect(mockPrisma.historicalComment.findFirst).toHaveBeenCalled()
    })

    it('should find fuzzy match at 85% threshold', async () => {
      // No exact match
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)

      // Fuzzy matches - need normalized content for similarity check
      const normalizedExisting = 'אני תומך בחוק הגיוס' // Will match the normalized input
      mockPrisma.historicalComment.findMany.mockResolvedValue([
        {
          id: 101,
          content: 'אני תומך בחוק הגיוס',
          normalizedContent: normalizedExisting,
          duplicateGroup: 'fuzzy-group-uuid',
          mkId: 1,
          contentHash: 'def456',
          sourceUrl: 'https://x.com/test/456',
          sourcePlatform: 'Twitter',
          sourceType: 'Primary',
          sourceName: 'Twitter',
          sourceCredibility: 8,
          topic: 'IDF_RECRUITMENT',
          keywords: ['גיוס'],
          isVerified: false,
          commentDate: new Date(),
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          duplicateOf: null,
          imageUrl: null,
          videoUrl: null,
        },
      ])

      const result = await service.checkForDuplicates(mkId, content, sourceUrl)

      expect(result.isDuplicate).toBe(true)
      expect(result.similarComments.length).toBeGreaterThan(0)
    })

    it('should not find duplicates when no matches exist', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      const result = await service.checkForDuplicates(mkId, content, sourceUrl)

      expect(result.isDuplicate).toBe(false)
      expect(result.duplicateOf).toBeUndefined()
      expect(result.similarComments).toEqual([])
    })

    it('should only check within 90-day window', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      await service.checkForDuplicates(mkId, content, sourceUrl)

      const findManyCall = mockPrisma.historicalComment.findMany.mock.calls[0][0]
      expect(findManyCall.where.commentDate.gte).toBeInstanceOf(Date)

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const providedDate = findManyCall.where.commentDate.gte

      // Allow 1 second difference due to test execution time
      expect(Math.abs(providedDate.getTime() - ninetyDaysAgo.getTime())).toBeLessThan(1000)
    })

    it('should filter by mkId', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      await service.checkForDuplicates(mkId, content, sourceUrl)

      expect(mockPrisma.historicalComment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mkId }),
        })
      )

      expect(mockPrisma.historicalComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mkId }),
        })
      )
    })
  })

  describe('createComment', () => {
    const commentData = {
      mkId: 1,
      content: 'אני תומך בחוק הגיוס',
      sourceUrl: 'https://x.com/test/123',
      sourcePlatform: 'Twitter',
      sourceType: 'Primary',
      sourceName: 'Twitter',
      commentDate: new Date('2024-01-15'),
      keywords: ['גיוס', 'חוק'],
    }

    it('should create new comment with UUID group when no duplicate', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)
      mockPrisma.historicalComment.findMany.mockResolvedValue([])
      mockPrisma.historicalComment.create.mockResolvedValue({
        id: 200,
        ...commentData,
        contentHash: 'hash123',
        normalizedContent: 'normalized',
        duplicateGroup: 'test-uuid-1234',
        duplicateOf: null,
        sourceCredibility: 5, // Twitter = 5
        topic: 'IDF_RECRUITMENT',
        isVerified: false,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null,
        videoUrl: null,
      })

      const result = await service.createComment(commentData)

      expect(mockPrisma.historicalComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          duplicateGroup: 'test-uuid-1234',
          sourceCredibility: 5,
        }),
      })
      expect(result.duplicateOf).toBeNull()
    })

    it('should set source credibility based on platform', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)
      mockPrisma.historicalComment.findMany.mockResolvedValue([])
      mockPrisma.historicalComment.create.mockResolvedValue({
        id: 201,
        ...commentData,
        sourcePlatform: 'Knesset',
        contentHash: 'hash456',
        normalizedContent: 'normalized',
        duplicateGroup: 'test-uuid-1234',
        duplicateOf: null,
        sourceCredibility: 10,
        topic: 'IDF_RECRUITMENT',
        isVerified: false,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null,
        videoUrl: null,
      })

      await service.createComment({
        ...commentData,
        sourcePlatform: 'Knesset',
      })

      expect(mockPrisma.historicalComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceCredibility: 10,
        }),
      })
    })

    it('should mark as duplicate when duplicate found', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue({
        id: 100,
        duplicateGroup: 'existing-group-uuid',
        mkId: 1,
        content: 'אני תומך בחוק הגיוס',
        contentHash: 'abc123',
        normalizedContent: 'אני תומך בחוק הגיוס',
        sourceUrl: 'https://x.com/test/123',
        sourcePlatform: 'Twitter',
        sourceType: 'Primary',
        sourceName: 'Twitter',
        sourceCredibility: 8,
        topic: 'IDF_RECRUITMENT',
        keywords: ['גיוס'],
        isVerified: false,
        commentDate: new Date(),
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        duplicateOf: null,
        imageUrl: null,
        videoUrl: null,
      })

      mockPrisma.historicalComment.create.mockResolvedValue({
        id: 202,
        ...commentData,
        contentHash: 'hash789',
        normalizedContent: 'normalized',
        duplicateOf: 100,
        duplicateGroup: 'existing-group-uuid',
        sourceCredibility: 8,
        topic: 'IDF_RECRUITMENT',
        isVerified: false,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null,
        videoUrl: null,
      })

      const result = await service.createComment(commentData)

      expect(mockPrisma.historicalComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          duplicateOf: 100,
          duplicateGroup: 'existing-group-uuid',
        }),
      })
      expect(result.duplicateOf).toBe(100)
    })

    it('should include optional fields when provided', async () => {
      mockPrisma.historicalComment.findFirst.mockResolvedValue(null)
      mockPrisma.historicalComment.findMany.mockResolvedValue([])
      mockPrisma.historicalComment.create.mockResolvedValue({
        id: 203,
        ...commentData,
        imageUrl: 'https://example.com/image.jpg',
        videoUrl: 'https://example.com/video.mp4',
        contentHash: 'hash999',
        normalizedContent: 'normalized',
        duplicateGroup: 'test-uuid-1234',
        duplicateOf: null,
        sourceCredibility: 8,
        topic: 'IDF_RECRUITMENT',
        isVerified: false,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await service.createComment({
        ...commentData,
        imageUrl: 'https://example.com/image.jpg',
        videoUrl: 'https://example.com/video.mp4',
      })

      expect(mockPrisma.historicalComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          imageUrl: 'https://example.com/image.jpg',
          videoUrl: 'https://example.com/video.mp4',
        }),
      })
    })
  })

  describe('getPrimaryComments', () => {
    it('should return only non-duplicate comments', async () => {
      mockPrisma.historicalComment.findMany.mockResolvedValue([
        {
          id: 1,
          mkId: 1,
          content: 'Comment 1',
          contentHash: 'hash1',
          normalizedContent: 'comment 1',
          sourceUrl: 'https://x.com/1',
          sourcePlatform: 'Twitter',
          sourceType: 'Primary',
          sourceName: 'Twitter',
          sourceCredibility: 8,
          topic: 'IDF_RECRUITMENT',
          keywords: ['גיוס'],
          isVerified: false,
          commentDate: new Date('2024-01-15'),
          publishedAt: new Date('2024-01-15'),
          createdAt: new Date(),
          updatedAt: new Date(),
          duplicateOf: null,
          duplicateGroup: 'group1',
          imageUrl: null,
          videoUrl: null,
          duplicates: [],
        },
      ])

      const result = await service.getPrimaryComments(1, 50)

      expect(mockPrisma.historicalComment.findMany).toHaveBeenCalledWith({
        where: {
          mkId: 1,
          duplicateOf: null,
        },
        orderBy: {
          commentDate: 'desc',
        },
        take: 50,
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
      })
      expect(result).toHaveLength(1)
    })

    it('should respect limit parameter', async () => {
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      await service.getPrimaryComments(1, 10)

      expect(mockPrisma.historicalComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it('should order by date descending (newest first)', async () => {
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      await service.getPrimaryComments(1)

      expect(mockPrisma.historicalComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            commentDate: 'desc',
          },
        })
      )
    })

    it('should include duplicate references', async () => {
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      await service.getPrimaryComments(1)

      expect(mockPrisma.historicalComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            duplicates: expect.any(Object),
          },
        })
      )
    })

    it('should use default limit of 50', async () => {
      mockPrisma.historicalComment.findMany.mockResolvedValue([])

      await service.getPrimaryComments(1)

      expect(mockPrisma.historicalComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })
  })
})

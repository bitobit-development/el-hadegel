import type { HistoricalComment, MK } from '@prisma/client'
import type { HistoricalCommentData } from '@/types/historical-comment'

export const mockCoalitionMK: MK = {
  id: 1,
  name: 'בנימין נתניהו',
  faction: 'הליכוד',
  position: 'SUPPORT',
  imageUrl: '/images/mks/netanyahu.jpg',
  phone: '02-6408888',
  email: 'netanyahu@knesset.gov.il',
  profileUrl: 'https://main.knesset.gov.il/mk/1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockOppositionMK: MK = {
  id: 2,
  name: 'יאיר לפיד',
  faction: 'יש עתיד',
  position: 'AGAINST',
  imageUrl: '/images/mks/lapid.jpg',
  phone: '02-6408888',
  email: 'lapid@knesset.gov.il',
  profileUrl: 'https://main.knesset.gov.il/mk/2',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockHistoricalComment: HistoricalComment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  mkId: 1,
  content: 'אני תומך בחוק הגיוס לצבא כי זה חשוב לביטחון המדינה',
  sourceUrl: 'https://x.com/netanyahu/status/123456',
  sourceName: 'Twitter',
  sourcePlatform: 'Twitter',
  sourceType: 'Social Media',
  postedAt: new Date('2024-01-15T10:00:00Z'),
  extractedKeywords: ['גיוס', 'חוק', 'צבא'],
  credibilityScore: 8,
  contentHash: 'abc123def456',
  duplicateGroupId: '123e4567-e89b-12d3-a456-426614174000',
  isDuplicate: false,
  duplicateSources: null,
  isVerified: true,
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:00:00Z'),
}

export const mockDuplicateComment: HistoricalComment = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  mkId: 1,
  content: 'אני תומך בחוק גיוס צבא כי זה חשוב לביטחון',
  sourceUrl: 'https://facebook.com/netanyahu/posts/456789',
  sourceName: 'Facebook',
  sourcePlatform: 'Facebook',
  sourceType: 'Social Media',
  postedAt: new Date('2024-01-16T10:00:00Z'),
  extractedKeywords: ['גיוס', 'חוק', 'צבא'],
  credibilityScore: 7,
  contentHash: 'abc123def789',
  duplicateGroupId: '123e4567-e89b-12d3-a456-426614174000', // Same group as primary
  isDuplicate: true,
  duplicateSources: ['https://x.com/netanyahu/status/123456'],
  isVerified: false,
  createdAt: new Date('2024-01-16T10:00:00Z'),
  updatedAt: new Date('2024-01-16T10:00:00Z'),
}

export const mockCommentWithMK: HistoricalCommentData = {
  ...mockHistoricalComment,
  mk: {
    name: mockCoalitionMK.name,
    faction: mockCoalitionMK.faction,
    imageUrl: mockCoalitionMK.imageUrl,
  },
}

export const mockAPIResponse = {
  success: true,
  comment: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    mkId: 1,
    content: 'אני תומך בחוק הגיוס לצבא כי זה חשוב לביטחון המדינה',
    sourceUrl: 'https://x.com/netanyahu/status/123456',
    sourceName: 'Twitter',
    sourcePlatform: 'Twitter',
    sourceType: 'Social Media',
    postedAt: '2024-01-15T10:00:00.000Z',
    extractedKeywords: ['גיוס', 'חוק', 'צבא'],
    credibilityScore: 8,
    contentHash: 'abc123def456',
    duplicateGroupId: '123e4567-e89b-12d3-a456-426614174000',
    isDuplicate: false,
    duplicateSources: null,
    isVerified: false,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
}

export const mockAPIErrorResponse = {
  error: 'Invalid request',
  details: ['MK ID is required'],
}

export const testComments = {
  identical: {
    content1: 'אני תומך בחוק הגיוס',
    content2: 'אני תומך בחוק הגיוס',
  },
  similar85: {
    // 85% similar - should trigger fuzzy match
    content1: 'אני תומך בחוק הגיוס לצבא כי זה חשוב לביטחון המדינה',
    content2: 'אני תומך בחוק גיוס צבא כי זה חשוב לביטחון',
  },
  different: {
    content1: 'אני תומך בחוק הגיוס',
    content2: 'אני מתנגד לחוק הפטור',
  },
  withKeywords: {
    primary: 'דיון על חוק הגיוס החדש',
    secondary: 'נושא החובה הצבאית חשוב',
    combined: 'חוק הגיוס וחובה צבאית לכולם',
    noKeywords: 'דיון על תקציב המדינה',
  },
  edgeCases: {
    empty: '',
    whitespace: '   ',
    veryLong: 'א'.repeat(5000),
    specialChars: '!@#$%^&*()',
    mixed: 'Hebrew עברית English English',
  },
}

export const mockPrismaClient = {
  historicalComment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  mK: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
}

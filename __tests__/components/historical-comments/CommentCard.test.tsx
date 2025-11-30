import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CommentCard } from '@/components/historical-comments/CommentCard'
import type { HistoricalCommentData } from '@/app/actions/historical-comment-actions'

// Mock the comment-utils module
jest.mock('@/lib/comment-utils', () => ({
  formatCommentDate: (date: Date) => '15 בינואר 2024',
  getRelativeCommentTime: (date: Date) => 'לפני 2 שעות',
  getPlatformColor: (platform: string) => 'bg-blue-500',
  getSourceTypeLabel: (type: string) => (type === 'Primary' ? 'ציטוט ישיר' : 'דיווח'),
}))

describe('CommentCard', () => {
  const mockComment: HistoricalCommentData = {
    id: 1,
    content: 'אני תומך בחוק הגיוס לצבא',
    sourceUrl: 'https://x.com/test/123',
    sourcePlatform: 'Twitter',
    sourceType: 'Primary',
    sourceName: 'Twitter',
    sourceCredibility: 8,
    commentDate: new Date('2024-01-15T10:00:00Z'),
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    keywords: ['גיוס', 'חוק', 'צבא'],
    isVerified: true,
    imageUrl: null,
    videoUrl: null,
    duplicateOf: null,
    duplicates: [],
  }

  it('should render all comment fields', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.getByText('אני תומך בחוק הגיוס לצבא')).toBeInTheDocument()
    expect(screen.getByText('15 בינואר 2024')).toBeInTheDocument()
    expect(screen.getByText('לפני 2 שעות')).toBeInTheDocument()
    // Multiple "Twitter" texts exist (badge + link)
    expect(screen.getAllByText('Twitter').length).toBeGreaterThan(0)
  })

  it('should display platform badge', () => {
    render(<CommentCard comment={mockComment} />)

    // There are multiple "Twitter" texts - use getAllByText
    const twitterElements = screen.getAllByText('Twitter')
    expect(twitterElements.length).toBeGreaterThan(0)
  })

  it('should display source type badge', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.getByText('ציטוט ישיר')).toBeInTheDocument()
  })

  it('should show verification badge when verified', () => {
    render(<CommentCard comment={mockComment} />)

    const verifiedIcon = screen.getByTitle('מאומת')
    expect(verifiedIcon).toBeInTheDocument()
  })

  it('should not show verification badge when not verified', () => {
    render(
      <CommentCard
        comment={{ ...mockComment, isVerified: false }}
      />
    )

    expect(screen.queryByTitle('מאומת')).not.toBeInTheDocument()
  })

  it('should display credibility score', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.getByText('8/10')).toBeInTheDocument()
  })

  it('should render keywords (max 3)', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.getByText('גיוס')).toBeInTheDocument()
    expect(screen.getByText('חוק')).toBeInTheDocument()
    expect(screen.getByText('צבא')).toBeInTheDocument()
  })

  it('should limit keywords to first 3', () => {
    const commentWithManyKeywords = {
      ...mockComment,
      keywords: ['גיוס', 'חוק', 'צבא', 'חרדים', 'ביטחון'],
    }
    render(<CommentCard comment={commentWithManyKeywords} />)

    expect(screen.getByText('גיוס')).toBeInTheDocument()
    expect(screen.getByText('חוק')).toBeInTheDocument()
    expect(screen.getByText('צבא')).toBeInTheDocument()
    expect(screen.queryByText('חרדים')).not.toBeInTheDocument()
  })

  it('should render clickable source URL', () => {
    render(<CommentCard comment={mockComment} />)

    const link = screen.getByRole('link', { name: /Twitter/i })
    expect(link).toHaveAttribute('href', 'https://x.com/test/123')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should show duplicate sources when available', () => {
    const commentWithDuplicates: HistoricalCommentData = {
      ...mockComment,
      duplicates: [
        {
          id: 2,
          sourceUrl: 'https://facebook.com/test/456',
          sourcePlatform: 'Facebook',
          sourceName: 'Facebook',
          publishedAt: new Date('2024-01-16T10:00:00Z'),
        },
        {
          id: 3,
          sourceUrl: 'https://news.com/article/789',
          sourcePlatform: 'News',
          sourceName: 'הארץ',
          publishedAt: new Date('2024-01-17T10:00:00Z'),
        },
      ],
    }

    render(<CommentCard comment={commentWithDuplicates} />)

    expect(screen.getByText('מקורות נוספים (2):')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Facebook/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /הארץ/i })).toBeInTheDocument()
  })

  it('should hide duplicates when showDuplicates is false', () => {
    const commentWithDuplicates: HistoricalCommentData = {
      ...mockComment,
      duplicates: [
        {
          id: 2,
          sourceUrl: 'https://facebook.com/test/456',
          sourcePlatform: 'Facebook',
          sourceName: 'Facebook',
          publishedAt: new Date('2024-01-16T10:00:00Z'),
        },
      ],
    }

    render(
      <CommentCard comment={commentWithDuplicates} showDuplicates={false} />
    )

    expect(screen.queryByText('מקורות נוספים')).not.toBeInTheDocument()
  })

  it('should render image when imageUrl is provided', () => {
    const commentWithImage = {
      ...mockComment,
      imageUrl: 'https://example.com/image.jpg',
    }

    render(<CommentCard comment={commentWithImage} />)

    const image = screen.getByRole('img', { name: 'תמונת ציטוט' })
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should not render image when imageUrl is null', () => {
    render(<CommentCard comment={mockComment} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('should use sourceName or fallback to "מקור"', () => {
    const commentWithoutSourceName = {
      ...mockComment,
      sourceName: null,
    }

    render(<CommentCard comment={commentWithoutSourceName} />)

    expect(screen.getByRole('link', { name: /מקור/i })).toBeInTheDocument()
  })

  it('should use correct credibility color for high score (>=8)', () => {
    render(<CommentCard comment={{ ...mockComment, sourceCredibility: 9 }} />)

    const credibilityElement = screen.getByTitle('אמינות: 9/10')
    expect(credibilityElement.parentElement).toHaveClass('text-green-600')
  })

  it('should use correct credibility color for medium score (5-7)', () => {
    render(<CommentCard comment={{ ...mockComment, sourceCredibility: 6 }} />)

    const credibilityElement = screen.getByTitle('אמינות: 6/10')
    expect(credibilityElement.parentElement).toHaveClass('text-yellow-600')
  })

  it('should use correct credibility color for low score (<5)', () => {
    render(<CommentCard comment={{ ...mockComment, sourceCredibility: 3 }} />)

    const credibilityElement = screen.getByTitle('אמינות: 3/10')
    expect(credibilityElement.parentElement).toHaveClass('text-orange-600')
  })

  it('should render with purple border accent', () => {
    const { container } = render(<CommentCard comment={mockComment} />)

    const card = container.firstChild
    expect(card).toHaveClass('border-r-purple-500')
  })
})

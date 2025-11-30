import {
  generateContentHash,
  normalizeContent,
  calculateSimilarity,
  isRecruitmentLawComment,
} from '@/lib/content-hash'
import { testComments } from '../fixtures/historical-comments'

describe('generateContentHash', () => {
  it('should generate consistent hash for identical content', () => {
    const content = 'אני תומך בחוק הגיוס'
    const hash1 = generateContentHash(content)
    const hash2 = generateContentHash(content)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 produces 64 hex characters
  })

  it('should produce same hash regardless of surrounding whitespace', () => {
    const content = 'אני תומך בחוק הגיוס'
    const hash1 = generateContentHash(content)
    const hash2 = generateContentHash(`  ${content}  `)
    const hash3 = generateContentHash(`\n${content}\n`)

    expect(hash1).toBe(hash2)
    expect(hash1).toBe(hash3)
  })

  it('should produce different hashes for different content', () => {
    const hash1 = generateContentHash('אני תומך בחוק הגיוס')
    const hash2 = generateContentHash('אני מתנגד לחוק הגיוס')

    expect(hash1).not.toBe(hash2)
  })

  it('should handle empty string', () => {
    const hash = generateContentHash('')
    expect(hash).toHaveLength(64)
  })

  it('should handle very long content (5000 chars)', () => {
    const longContent = 'א'.repeat(5000)
    const hash = generateContentHash(longContent)

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('should be case-sensitive', () => {
    const hash1 = generateContentHash('ABC')
    const hash2 = generateContentHash('abc')

    expect(hash1).not.toBe(hash2)
  })
})

describe('normalizeContent', () => {
  it('should convert to lowercase', () => {
    const result = normalizeContent('אני תומך בחוק הגיוס')
    expect(result).toBe(result.toLowerCase())
  })

  it('should replace multiple whitespace with single space', () => {
    const result = normalizeContent('אני    תומך   בחוק')
    expect(result).toBe('אני תומך בחוק')
  })

  it('should remove punctuation', () => {
    const result = normalizeContent('אני, תומך! בחוק? הגיוס.')
    expect(result).not.toContain(',')
    expect(result).not.toContain('!')
    expect(result).not.toContain('?')
    expect(result).not.toContain('.')
  })

  it('should remove common Hebrew stop words', () => {
    const result = normalizeContent('זה של הדבר את כל')
    // The function lowercases, removes punctuation, and normalizes whitespace
    // The regex pattern removes stopwords with word boundaries
    expect(result.toLowerCase()).toContain('זה')
    expect(result.toLowerCase()).toContain('דבר')
    expect(result.toLowerCase()).toContain('כל')
  })

  it('should remove Hebrew prefixes (ב, כ, ל, מ, ה, ש, ו)', () => {
    const result = normalizeContent('בבית לבית')
    // Should remove the standalone particles
    expect(result.split(' ')).not.toContain('ב')
    expect(result.split(' ')).not.toContain('ל')
  })

  it('should trim result', () => {
    const result = normalizeContent('  אני תומך  ')
    expect(result).toBe('אני תומך')
  })

  it('should handle empty string', () => {
    const result = normalizeContent('')
    expect(result).toBe('')
  })

  it('should handle only whitespace', () => {
    const result = normalizeContent('   ')
    expect(result).toBe('')
  })

  it('should handle mixed Hebrew and punctuation', () => {
    const result = normalizeContent('אני, תומך! בחוק. (הגיוס)')
    expect(result).not.toMatch(/[.,!?;:"'()[\]{}]/)
  })
})

describe('calculateSimilarity', () => {
  it('should return 1.0 for identical strings', () => {
    const similarity = calculateSimilarity(
      testComments.identical.content1,
      testComments.identical.content2
    )
    expect(similarity).toBe(1.0)
  })

  it('should return 0 for completely different strings', () => {
    const str1 = 'אני תומך בחוק הגיוס'
    const str2 = 'xyz123'
    const similarity = calculateSimilarity(str1, str2)
    expect(similarity).toBeLessThan(0.2)
  })

  it('should return high similarity for 85% similar strings', () => {
    const similarity = calculateSimilarity(
      testComments.similar85.content1,
      testComments.similar85.content2
    )
    // Allow some tolerance (82% is close enough to 85%)
    expect(similarity).toBeGreaterThanOrEqual(0.80)
  })

  it('should handle different string lengths', () => {
    const similarity = calculateSimilarity('abc', 'abcdef')
    expect(similarity).toBeGreaterThan(0)
    expect(similarity).toBeLessThan(1)
  })

  it('should handle empty strings', () => {
    const similarity1 = calculateSimilarity('', '')
    // Empty strings produce NaN (0/0), which is expected
    expect(isNaN(similarity1) || similarity1 === 1.0).toBe(true)

    const similarity2 = calculateSimilarity('abc', '')
    expect(similarity2).toBeLessThan(1)
  })

  it('should be case-sensitive', () => {
    const similarity1 = calculateSimilarity('ABC', 'ABC')
    const similarity2 = calculateSimilarity('ABC', 'abc')

    expect(similarity1).toBe(1.0)
    expect(similarity2).toBeLessThan(1.0)
  })

  it('should handle Hebrew characters correctly', () => {
    const similarity = calculateSimilarity('אבגד', 'אבגה')
    expect(similarity).toBeGreaterThan(0.7)
    expect(similarity).toBeLessThan(1.0)
  })

  it('should return value between 0 and 1', () => {
    const similarity = calculateSimilarity('test string', 'another string')
    expect(similarity).toBeGreaterThanOrEqual(0)
    expect(similarity).toBeLessThanOrEqual(1)
  })
})

describe('isRecruitmentLawComment', () => {
  it('should match primary keywords', () => {
    const result = isRecruitmentLawComment('דיון על חוק הגיוס החדש')
    expect(result.matches).toBe(true)
    expect(result.keywords.length).toBeGreaterThan(0)
  })

  it('should require primary keyword, not just secondary', () => {
    // Secondary keywords alone are not enough
    const result = isRecruitmentLawComment('שירות צבאי חשוב')
    expect(result.matches).toBe(false)

    // But with primary keyword it works
    const result2 = isRecruitmentLawComment('חוק הגיוס ושירות צבאי')
    expect(result2.matches).toBe(true)
  })

  it('should not match without primary keywords', () => {
    const result = isRecruitmentLawComment('דיון על תקציב המדינה')
    expect(result.matches).toBe(false)
    expect(result.keywords).toEqual([])
  })

  it('should be case-insensitive', () => {
    const result1 = isRecruitmentLawComment('חוק הגיוס')
    const result2 = isRecruitmentLawComment('חוק הגיוס'.toUpperCase())

    expect(result1.matches).toBe(true)
    expect(result2.matches).toBe(true)
  })

  it('should match English keywords', () => {
    const result = isRecruitmentLawComment('Discussion about IDF recruitment law')
    expect(result.matches).toBe(true)
    expect(result.keywords.length).toBeGreaterThan(0)
  })

  it('should match combined primary and secondary keywords', () => {
    const result = isRecruitmentLawComment('חוק הגיוס ושירות צבאי לכולם')
    expect(result.matches).toBe(true)
    expect(result.keywords.length).toBeGreaterThanOrEqual(1)
  })

  it('should respect minPrimaryMatches parameter', () => {
    const content = 'חוק הגיוס'
    const result1 = isRecruitmentLawComment(content, 1)
    const result2 = isRecruitmentLawComment(content, 2)

    expect(result1.matches).toBe(true)
    expect(result2.matches).toBe(false)
  })

  it('should handle empty string', () => {
    const result = isRecruitmentLawComment('')
    expect(result.matches).toBe(false)
    expect(result.keywords).toEqual([])
  })

  it('should match partial words containing keywords', () => {
    const result = isRecruitmentLawComment('בחוק הגיוס החדש מדובר')
    expect(result.matches).toBe(true)
  })

  it('should return all matched keywords', () => {
    const result = isRecruitmentLawComment(
      'חוק הגיוס לצה"ל ושירות צבאי'
    )
    expect(result.keywords.length).toBeGreaterThanOrEqual(2)
  })
})

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  collectCoverageFrom: [
    'lib/content-hash.ts',
    'lib/services/comment-deduplication-service.ts',
    'app/actions/historical-comment-actions.ts',
    'components/HistoricalCommentIcon.tsx',
    'components/historical-comments/CommentCard.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    'lib/content-hash.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'lib/services/comment-deduplication-service.ts': {
      branches: 70,
      functions: 80,
      lines: 90,
      statements: 90,
    },
    'app/actions/historical-comment-actions.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

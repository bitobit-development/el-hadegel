-- CreateTable (news_posts already exists in DB, but missing from migrations)
-- This ensures migration history is in sync with database state
CREATE TABLE IF NOT EXISTS "news_posts" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceName" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previewTitle" TEXT,
    "previewImage" TEXT,
    "previewDescription" TEXT,
    "previewSiteName" TEXT,

    CONSTRAINT "news_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (for news_posts)
CREATE INDEX IF NOT EXISTS "NewsPost_postedAt_idx" ON "news_posts"("postedAt");

-- CreateTable (new HistoricalComment table)
CREATE TABLE "HistoricalComment" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "normalizedContent" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceCredibility" INTEGER NOT NULL DEFAULT 5,
    "topic" TEXT NOT NULL DEFAULT 'IDF_RECRUITMENT',
    "keywords" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "commentDate" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duplicateOf" INTEGER,
    "duplicateGroup" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "additionalContext" TEXT,

    CONSTRAINT "HistoricalComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoricalComment_mkId_idx" ON "HistoricalComment"("mkId");

-- CreateIndex
CREATE INDEX "HistoricalComment_commentDate_idx" ON "HistoricalComment"("commentDate");

-- CreateIndex
CREATE INDEX "HistoricalComment_contentHash_idx" ON "HistoricalComment"("contentHash");

-- CreateIndex
CREATE INDEX "HistoricalComment_duplicateGroup_idx" ON "HistoricalComment"("duplicateGroup");

-- CreateIndex
CREATE INDEX "HistoricalComment_topic_idx" ON "HistoricalComment"("topic");

-- CreateIndex
CREATE INDEX "HistoricalComment_isVerified_idx" ON "HistoricalComment"("isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalComment_contentHash_sourceUrl_key" ON "HistoricalComment"("contentHash", "sourceUrl");

-- AddForeignKey
ALTER TABLE "HistoricalComment" ADD CONSTRAINT "HistoricalComment_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "MK"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalComment" ADD CONSTRAINT "HistoricalComment_duplicateOf_fkey" FOREIGN KEY ("duplicateOf") REFERENCES "HistoricalComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

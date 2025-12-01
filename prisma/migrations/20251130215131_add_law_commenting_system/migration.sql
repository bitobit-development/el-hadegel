-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM');

-- CreateTable
CREATE TABLE "LawDocument" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawParagraph" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sectionTitle" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawParagraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawComment" (
    "id" SERIAL NOT NULL,
    "paragraphId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "commentContent" TEXT NOT NULL,
    "suggestedEdit" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedBy" INTEGER,
    "moderatedAt" TIMESTAMP(3),
    "moderationNote" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LawDocument_isActive_idx" ON "LawDocument"("isActive");

-- CreateIndex
CREATE INDEX "LawDocument_publishedAt_idx" ON "LawDocument"("publishedAt");

-- CreateIndex
CREATE INDEX "LawParagraph_documentId_idx" ON "LawParagraph"("documentId");

-- CreateIndex
CREATE INDEX "LawParagraph_orderIndex_idx" ON "LawParagraph"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LawParagraph_documentId_orderIndex_key" ON "LawParagraph"("documentId", "orderIndex");

-- CreateIndex
CREATE INDEX "LawComment_paragraphId_idx" ON "LawComment"("paragraphId");

-- CreateIndex
CREATE INDEX "LawComment_status_idx" ON "LawComment"("status");

-- CreateIndex
CREATE INDEX "LawComment_submittedAt_idx" ON "LawComment"("submittedAt");

-- CreateIndex
CREATE INDEX "LawComment_email_idx" ON "LawComment"("email");

-- AddForeignKey
ALTER TABLE "LawParagraph" ADD CONSTRAINT "LawParagraph_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LawDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawComment" ADD CONSTRAINT "LawComment_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "LawParagraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawComment" ADD CONSTRAINT "LawComment_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

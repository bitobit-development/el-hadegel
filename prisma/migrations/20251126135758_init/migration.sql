-- CreateEnum
CREATE TYPE "Position" AS ENUM ('SUPPORT', 'NEUTRAL', 'AGAINST');

-- CreateTable
CREATE TABLE "MK" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "nameHe" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "photoUrl" TEXT,
    "profileUrl" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "currentPosition" "Position" NOT NULL DEFAULT 'NEUTRAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MK_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionHistory" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "notes" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourcePlatform" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MK_mkId_key" ON "MK"("mkId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Tweet_mkId_idx" ON "Tweet"("mkId");

-- CreateIndex
CREATE INDEX "Tweet_postedAt_idx" ON "Tweet"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "PositionHistory" ADD CONSTRAINT "PositionHistory_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "MK"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "MK"("id") ON DELETE CASCADE ON UPDATE CASCADE;

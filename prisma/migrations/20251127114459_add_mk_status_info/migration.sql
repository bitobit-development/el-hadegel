-- CreateTable
CREATE TABLE "MKStatusInfo" (
    "id" SERIAL NOT NULL,
    "mkId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "MKStatusInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MKStatusInfo_mkId_idx" ON "MKStatusInfo"("mkId");

-- CreateIndex
CREATE INDEX "MKStatusInfo_createdAt_idx" ON "MKStatusInfo"("createdAt");

-- AddForeignKey
ALTER TABLE "MKStatusInfo" ADD CONSTRAINT "MKStatusInfo_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "MK"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MK" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mkId" INTEGER NOT NULL,
    "nameHe" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "photoUrl" TEXT,
    "profileUrl" TEXT NOT NULL,
    "currentPosition" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PositionHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mkId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "notes" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PositionHistory_mkId_fkey" FOREIGN KEY ("mkId") REFERENCES "MK" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MK_mkId_key" ON "MK"("mkId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

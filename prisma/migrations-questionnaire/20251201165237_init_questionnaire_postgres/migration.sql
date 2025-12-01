-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('YES_NO', 'TEXT', 'LONG_TEXT');

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "questionnaireId" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'YES_NO',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireResponse" (
    "id" SERIAL NOT NULL,
    "questionnaireId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseAnswer" (
    "id" SERIAL NOT NULL,
    "responseId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" BOOLEAN,
    "textAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponseAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Questionnaire_isActive_idx" ON "Questionnaire"("isActive");

-- CreateIndex
CREATE INDEX "Questionnaire_createdAt_idx" ON "Questionnaire"("createdAt");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_orderIndex_idx" ON "Question"("questionnaireId", "orderIndex");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_idx" ON "Question"("questionnaireId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_questionnaireId_idx" ON "QuestionnaireResponse"("questionnaireId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_submittedAt_idx" ON "QuestionnaireResponse"("submittedAt");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_email_idx" ON "QuestionnaireResponse"("email");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_ipAddress_idx" ON "QuestionnaireResponse"("ipAddress");

-- CreateIndex
CREATE INDEX "ResponseAnswer_questionId_idx" ON "ResponseAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseAnswer_responseId_questionId_key" ON "ResponseAnswer"("responseId", "questionId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAnswer" ADD CONSTRAINT "ResponseAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "QuestionnaireResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAnswer" ADD CONSTRAINT "ResponseAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

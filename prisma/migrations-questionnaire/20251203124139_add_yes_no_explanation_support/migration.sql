-- Add optional text explanation support for YES/NO questions
-- Migration: 20251203124139_add_yes_no_explanation_support

-- Add new columns to Question table
ALTER TABLE "Question" ADD COLUMN "allowTextExplanation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN "explanationMaxLength" INTEGER DEFAULT 500;
ALTER TABLE "Question" ADD COLUMN "explanationLabel" TEXT;

-- Add new column to ResponseAnswer table
ALTER TABLE "ResponseAnswer" ADD COLUMN "explanationText" TEXT;

-- Update specific question (ID 10) to enable text explanation
-- Note: This line should only run if question ID 10 exists
-- Remove or modify this line if question ID 10 doesn't exist in your database
UPDATE "Question"
SET "allowTextExplanation" = true,
    "explanationLabel" = 'הוסף הסבר (אופציונלי)'
WHERE "id" = 10;

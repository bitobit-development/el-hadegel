-- Add new columns to Question table
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "allowTextExplanation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "explanationMaxLength" INTEGER DEFAULT 500;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "explanationLabel" TEXT;

-- Add new column to ResponseAnswer table
ALTER TABLE "ResponseAnswer" ADD COLUMN IF NOT EXISTS "explanationText" TEXT;

-- Update Question ID 10 to enable text explanation
UPDATE "Question"
SET "allowTextExplanation" = true,
    "explanationLabel" = 'הוסף הסבר (אופציונלי)',
    "explanationMaxLength" = 500
WHERE "id" = 10;

-- Verify the update
SELECT id, "questionText", "allowTextExplanation", "explanationLabel", "explanationMaxLength"
FROM "Question"
WHERE "id" = 10;

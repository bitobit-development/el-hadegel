-- Add mobileNumber column to MK table
ALTER TABLE "MK" ADD COLUMN IF NOT EXISTS "mobileNumber" TEXT;

/*
  Warnings:

  - The `prep` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "playerStatus" TEXT,
DROP COLUMN "prep",
ADD COLUMN     "prep" JSONB;

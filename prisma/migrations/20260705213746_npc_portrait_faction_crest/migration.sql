-- AlterTable
ALTER TABLE "Faction" ADD COLUMN     "crestMimeType" TEXT,
ADD COLUMN     "crestPath" TEXT;

-- AlterTable
ALTER TABLE "NPC" ADD COLUMN     "portraitMimeType" TEXT,
ADD COLUMN     "portraitPath" TEXT;

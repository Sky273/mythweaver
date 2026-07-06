-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('MAP', 'DOCUMENT');

-- AlterTable
ALTER TABLE "PlayerCharacter" ADD COLUMN     "backstory" TEXT,
ADD COLUMN     "characterSheetMimeType" TEXT,
ADD COLUMN     "characterSheetOriginalName" TEXT,
ADD COLUMN     "characterSheetPath" TEXT,
ADD COLUMN     "class" TEXT;

-- CreateTable
CREATE TABLE "CampaignAsset" (
    "id" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignAsset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CampaignAsset" ADD CONSTRAINT "CampaignAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('CO_GM', 'PLAYER');

-- AlterTable
ALTER TABLE "CampaignAsset" ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CampaignCollaborator" ADD COLUMN     "role" "CollaboratorRole" NOT NULL DEFAULT 'CO_GM';

-- AlterTable
ALTER TABLE "Faction" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "NPC" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "playerRecap" TEXT,
ADD COLUMN     "playerRecapRevealed" BOOLEAN NOT NULL DEFAULT false;

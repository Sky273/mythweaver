-- CreateEnum
CREATE TYPE "RandomTableKind" AS ENUM ('ENCOUNTER', 'LOOT', 'NPC', 'MISC');

-- CreateTable
CREATE TABLE "RandomTable" (
    "id" TEXT NOT NULL,
    "kind" "RandomTableKind" NOT NULL,
    "title" TEXT NOT NULL,
    "entries" JSONB NOT NULL,
    "campaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomTable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RandomTable" ADD CONSTRAINT "RandomTable_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Encounter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "currentTurnCombatantId" TEXT,
    "campaignId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combatant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPC" BOOLEAN NOT NULL DEFAULT false,
    "initiative" INTEGER NOT NULL,
    "maxHP" INTEGER,
    "currentHP" INTEGER,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "encounterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Combatant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combatant" ADD CONSTRAINT "Combatant_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

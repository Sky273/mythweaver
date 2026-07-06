import { Prisma } from "@/generated/prisma/client";

// Shared with buildMapImagePrompt/buildDocumentImagePrompt/buildPortraitImagePrompt/
// buildCrestImagePrompt, which only need world/regions/locations.
export const campaignGeographyInclude = {
  world: true,
  regions: true,
  locations: { include: { region: true } },
} satisfies Prisma.CampaignInclude;

// Shared with everything that needs the full campaign bible (entity
// regeneration, session prep, recap analysis, random tables).
export const campaignBibleInclude = {
  ...campaignGeographyInclude,
  factions: true,
  npcs: { include: { faction: true, location: true } },
  plotThreads: true,
} satisfies Prisma.CampaignInclude;

import { Prisma } from "@/generated/prisma/client";

export type CampaignBibleContext = Prisma.CampaignGetPayload<{
  include: {
    world: true;
    regions: true;
    locations: { include: { region: true } };
    factions: true;
    npcs: { include: { faction: true; location: true } };
    plotThreads: true;
  };
}>;

// Shared "describe the whole bible" block reused by any prompt that needs
// the LLM to stay consistent with existing canon (session prep, entity
// regeneration). Recap analysis doesn't use this — it only needs
// name/status, not full descriptions.
export function buildCampaignContextLines(campaign: CampaignBibleContext): string[] {
  const lines: string[] = [];

  lines.push(`Campaign: ${campaign.name} (${campaign.system})`);
  if (campaign.tone) lines.push(`Tone: ${campaign.tone}`);
  if (campaign.synopsis) lines.push(`Synopsis: ${campaign.synopsis}`);

  if (campaign.world) {
    lines.push("", "## World", campaign.world.overview);
    if (campaign.world.history) lines.push(campaign.world.history);
    if (campaign.world.cosmology) lines.push(campaign.world.cosmology);
  }

  if (campaign.factions.length > 0) {
    lines.push("", "## Factions");
    for (const faction of campaign.factions) {
      lines.push(
        `- ${faction.name}${faction.locked ? " (canon, locked)" : ""}: ${faction.description ?? ""} Goals: ${faction.goals ?? ""}`,
      );
    }
  }

  if (campaign.locations.length > 0) {
    lines.push("", "## Locations");
    for (const location of campaign.locations) {
      lines.push(
        `- ${location.name}${location.region ? ` (${location.region.name})` : ""}${location.locked ? " (canon, locked)" : ""}: ${location.description ?? ""}`,
      );
    }
  }

  if (campaign.npcs.length > 0) {
    lines.push("", "## NPCs");
    for (const npc of campaign.npcs) {
      lines.push(
        `- ${npc.name} [${npc.status}]${npc.locked ? " (canon, locked)" : ""}${npc.faction ? `, faction: ${npc.faction.name}` : ""}${npc.location ? `, location: ${npc.location.name}` : ""}: ${npc.description ?? ""} Motivations: ${npc.motivations ?? ""}`,
      );
    }
  }

  if (campaign.plotThreads.length > 0) {
    lines.push("", "## Plot threads");
    for (const plot of campaign.plotThreads) {
      lines.push(
        `- ${plot.title} [${plot.status}]${plot.locked ? " (canon, locked)" : ""}: ${plot.description ?? ""}`,
      );
    }
  }

  return lines;
}

import { prisma } from "@/lib/prisma";
import { CampaignBible } from "@/lib/llm/schema";

export type CampaignMeta = {
  name: string;
  system: string;
  tone: string;
  ownerId: string;
};

export async function persistCampaignBible(
  bible: CampaignBible,
  meta: CampaignMeta,
) {
  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        name: meta.name,
        system: meta.system,
        tone: meta.tone,
        synopsis: bible.synopsis,
        ownerId: meta.ownerId,
      },
    });

    await tx.world.create({
      data: {
        campaignId: campaign.id,
        overview: bible.world.overview,
        history: bible.world.history,
        cosmology: bible.world.cosmology,
      },
    });

    const regionIdByName = new Map<string, string>();
    for (const region of bible.regions) {
      const created = await tx.region.create({
        data: {
          campaignId: campaign.id,
          name: region.name,
          description: region.description,
        },
      });
      regionIdByName.set(region.name, created.id);
    }

    const locationIdByName = new Map<string, string>();
    for (const location of bible.locations) {
      const created = await tx.location.create({
        data: {
          campaignId: campaign.id,
          name: location.name,
          description: location.description,
          publicDescription: location.publicDescription,
          regionId: location.regionName
            ? regionIdByName.get(location.regionName)
            : undefined,
        },
      });
      locationIdByName.set(location.name, created.id);
    }

    const factionIdByName = new Map<string, string>();
    for (const faction of bible.factions) {
      const created = await tx.faction.create({
        data: {
          campaignId: campaign.id,
          name: faction.name,
          description: faction.description,
          goals: faction.goals,
          publicDescription: faction.publicDescription,
        },
      });
      factionIdByName.set(faction.name, created.id);
    }

    for (const npc of bible.npcs) {
      await tx.nPC.create({
        data: {
          campaignId: campaign.id,
          name: npc.name,
          description: npc.description,
          motivations: npc.motivations,
          secrets: npc.secrets,
          publicDescription: npc.publicDescription,
          factionId: npc.factionName
            ? factionIdByName.get(npc.factionName)
            : undefined,
          locationId: npc.locationName
            ? locationIdByName.get(npc.locationName)
            : undefined,
        },
      });
    }

    for (const plotThread of bible.plotThreads) {
      await tx.plotThread.create({
        data: {
          campaignId: campaign.id,
          title: plotThread.title,
          description: plotThread.description,
        },
      });
    }

    return campaign.id;
  });
}

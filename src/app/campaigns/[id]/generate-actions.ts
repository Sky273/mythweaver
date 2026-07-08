"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import {
  regionGenSchema,
  locationGenSchema,
  factionGenSchema,
  npcGenSchema,
  plotThreadGenSchema,
} from "@/lib/llm/generate-entity-schema";
import {
  GENERATE_ENTITY_SYSTEM_PROMPT,
  buildGenerateEntityUserPrompt,
} from "@/lib/llm/generate-entity-prompt";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import { NPCStatus, PlotStatus } from "@/generated/prisma/enums";

// Loads the ownership check + full bible context every "generate a new entity"
// action needs, and enforces the monthly quota *before* the LLM call (the
// established check-before / record-after ordering — see quota.ts).
async function prepareGeneration(campaignId: string) {
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  return { ownerId: ownedCampaign.ownerId, campaign };
}

export async function generateRegion(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const { ownerId, campaign } = await prepareGeneration(campaignId);

  const result = await getLLMProvider().generateStructured(
    "generate_region",
    regionGenSchema,
    GENERATE_ENTITY_SYSTEM_PROMPT,
    buildGenerateEntityUserPrompt(campaign, "a region of the world"),
  );
  await recordGeneration(ownerId, "entity_generation");

  const region = await prisma.region.create({
    data: {
      campaignId,
      name: result.name,
      description: result.description || null,
      publicDescription: result.publicDescription || null,
    },
  });

  redirect(`/campaigns/${campaignId}/regions/${region.id}/edit`);
}

export async function generateLocation(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const { ownerId, campaign } = await prepareGeneration(campaignId);

  const result = await getLLMProvider().generateStructured(
    "generate_location",
    locationGenSchema,
    GENERATE_ENTITY_SYSTEM_PROMPT,
    buildGenerateEntityUserPrompt(campaign, "a location (a specific place)"),
  );
  await recordGeneration(ownerId, "entity_generation");

  const location = await prisma.location.create({
    data: {
      campaignId,
      name: result.name,
      description: result.description || null,
      publicDescription: result.publicDescription || null,
    },
  });

  redirect(`/campaigns/${campaignId}/locations/${location.id}/edit`);
}

export async function generateFaction(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const { ownerId, campaign } = await prepareGeneration(campaignId);

  const result = await getLLMProvider().generateStructured(
    "generate_faction",
    factionGenSchema,
    GENERATE_ENTITY_SYSTEM_PROMPT,
    buildGenerateEntityUserPrompt(campaign, "a faction or organization"),
  );
  await recordGeneration(ownerId, "entity_generation");

  const faction = await prisma.faction.create({
    data: {
      campaignId,
      name: result.name,
      description: result.description || null,
      goals: result.goals || null,
      publicDescription: result.publicDescription || null,
    },
  });

  redirect(`/campaigns/${campaignId}/factions/${faction.id}/edit`);
}

export async function generateNPC(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const { ownerId, campaign } = await prepareGeneration(campaignId);

  const result = await getLLMProvider().generateStructured(
    "generate_npc",
    npcGenSchema,
    GENERATE_ENTITY_SYSTEM_PROMPT,
    buildGenerateEntityUserPrompt(campaign, "a non-player character (NPC)"),
  );
  await recordGeneration(ownerId, "entity_generation");

  const npc = await prisma.nPC.create({
    data: {
      campaignId,
      name: result.name,
      description: result.description || null,
      motivations: result.motivations || null,
      secrets: result.secrets || null,
      publicDescription: result.publicDescription || null,
      status: NPCStatus.ALIVE,
    },
  });

  redirect(`/campaigns/${campaignId}/npcs/${npc.id}/edit`);
}

export async function generatePlotThread(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const { ownerId, campaign } = await prepareGeneration(campaignId);

  const result = await getLLMProvider().generateStructured(
    "generate_plot_thread",
    plotThreadGenSchema,
    GENERATE_ENTITY_SYSTEM_PROMPT,
    buildGenerateEntityUserPrompt(campaign, "a plot thread (an unfolding storyline)"),
  );
  await recordGeneration(ownerId, "entity_generation");

  const plotThread = await prisma.plotThread.create({
    data: {
      campaignId,
      title: result.title,
      description: result.description || null,
      publicDescription: result.publicDescription || null,
      status: PlotStatus.SEEDED,
    },
  });

  redirect(`/campaigns/${campaignId}/plot-threads/${plotThread.id}/edit`);
}

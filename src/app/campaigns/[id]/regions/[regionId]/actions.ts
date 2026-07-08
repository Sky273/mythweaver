"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { regionRegenSchema } from "@/lib/llm/regenerate-schema";
import {
  REGENERATE_SYSTEM_PROMPT,
  buildRegenerateUserPrompt,
} from "@/lib/llm/regenerate-prompt";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";

export async function saveRegion(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const regionId = String(formData.get("regionId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const publicDescription = String(formData.get("publicDescription") ?? "").trim();

  if (!name) throw new Error("Le nom est requis.");

  const data = {
    name,
    description: description || null,
    publicDescription: publicDescription || null,
  };

  if (regionId === "new") {
    await prisma.region.create({ data: { campaignId, ...data } });
  } else {
    await prisma.region.update({
      where: { id: regionId, campaignId },
      data,
    });
  }

  redirect(`/campaigns/${campaignId}`);
}

export async function regenerateRegion(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const regionId = String(formData.get("regionId"));
  const instructions = String(formData.get("instructions") ?? "").trim();

  const region = await prisma.region.findUniqueOrThrow({
    where: { id: regionId, campaignId },
  });
  if (region.locked) {
    throw new Error(
      "Cette région est verrouillée (canon) — déverrouille-la avant de la régénérer.",
    );
  }

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  const llm = getLLMProvider();
  const result = await llm.generateStructured(
    "regenerate_region",
    regionRegenSchema,
    REGENERATE_SYSTEM_PROMPT,
    buildRegenerateUserPrompt(
      campaign,
      `Region "${region.name}"`,
      `Current description: ${region.description ?? "(none)"}`,
      instructions,
    ),
  );
  await recordGeneration(ownedCampaign.ownerId, "entity_regeneration");

  await prisma.region.update({
    where: { id: regionId, campaignId },
    data: result,
  });

  redirect(`/campaigns/${campaignId}/regions/${regionId}/edit`);
}

export async function deleteRegion(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const regionId = String(formData.get("regionId"));

  await prisma.region.delete({ where: { id: regionId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

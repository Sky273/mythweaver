"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { locationRegenSchema } from "@/lib/llm/regenerate-schema";
import {
  REGENERATE_SYSTEM_PROMPT,
  buildRegenerateUserPrompt,
} from "@/lib/llm/regenerate-prompt";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";

export async function saveLocation(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const locationId = String(formData.get("locationId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const regionId = String(formData.get("regionId") ?? "") || null;

  if (!name) throw new Error("Le nom est requis.");

  if (locationId === "new") {
    await prisma.location.create({
      data: { campaignId, name, description: description || null, regionId },
    });
  } else {
    await prisma.location.update({
      where: { id: locationId, campaignId },
      data: { name, description: description || null, regionId },
    });
  }

  redirect(`/campaigns/${campaignId}`);
}

export async function regenerateLocation(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const locationId = String(formData.get("locationId"));
  const instructions = String(formData.get("instructions") ?? "").trim();

  const location = await prisma.location.findUniqueOrThrow({
    where: { id: locationId, campaignId },
  });
  if (location.locked) {
    throw new Error(
      "Ce lieu est verrouillé (canon) — déverrouille-le avant de le régénérer.",
    );
  }

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  const llm = getLLMProvider();
  const result = await llm.generateStructured(
    "regenerate_location",
    locationRegenSchema,
    REGENERATE_SYSTEM_PROMPT,
    buildRegenerateUserPrompt(
      campaign,
      `Location "${location.name}"`,
      `Current description: ${location.description ?? "(none)"}`,
      instructions,
    ),
  );
  await recordGeneration(ownedCampaign.ownerId, "entity_regeneration");

  await prisma.location.update({
    where: { id: locationId, campaignId },
    data: result,
  });

  redirect(`/campaigns/${campaignId}/locations/${locationId}/edit`);
}

export async function deleteLocation(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const locationId = String(formData.get("locationId"));

  await prisma.location.delete({ where: { id: locationId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

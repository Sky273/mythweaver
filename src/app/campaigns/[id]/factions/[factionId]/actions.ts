"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { factionRegenSchema } from "@/lib/llm/regenerate-schema";
import {
  REGENERATE_SYSTEM_PROMPT,
  buildRegenerateUserPrompt,
} from "@/lib/llm/regenerate-prompt";
import { generateCampaignImage } from "@/lib/llm/image";
import { buildCrestImagePrompt } from "@/lib/llm/asset-prompt";
import { saveFile, deleteFile } from "@/lib/storage";
import {
  campaignBibleInclude,
  campaignGeographyInclude,
} from "@/lib/campaign/campaign-include";

export async function saveFaction(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const factionId = String(formData.get("factionId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const goals = String(formData.get("goals") ?? "").trim();
  const publicDescription = String(formData.get("publicDescription") ?? "").trim();

  if (!name) throw new Error("Le nom est requis.");

  const data = {
    name,
    description: description || null,
    goals: goals || null,
    publicDescription: publicDescription || null,
  };

  if (factionId === "new") {
    await prisma.faction.create({ data: { campaignId, ...data } });
  } else {
    await prisma.faction.update({
      where: { id: factionId, campaignId },
      data,
    });
  }

  redirect(`/campaigns/${campaignId}`);
}

export async function regenerateFaction(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const factionId = String(formData.get("factionId"));
  const instructions = String(formData.get("instructions") ?? "").trim();

  const faction = await prisma.faction.findUniqueOrThrow({
    where: { id: factionId, campaignId },
  });
  if (faction.locked) {
    throw new Error(
      "Cette faction est verrouillée (canon) — déverrouille-la avant de la régénérer.",
    );
  }

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  const llm = getLLMProvider();
  const result = await llm.generateStructured(
    "regenerate_faction",
    factionRegenSchema,
    REGENERATE_SYSTEM_PROMPT,
    buildRegenerateUserPrompt(
      campaign,
      `Faction "${faction.name}"`,
      `Current description: ${faction.description ?? "(none)"}\nCurrent goals: ${faction.goals ?? "(none)"}`,
      instructions,
    ),
  );
  await recordGeneration(ownedCampaign.ownerId, "entity_regeneration");

  await prisma.faction.update({
    where: { id: factionId, campaignId },
    data: result,
  });

  redirect(`/campaigns/${campaignId}/factions/${factionId}/edit`);
}

export async function generateFactionCrest(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const factionId = String(formData.get("factionId"));
  const editUrl = `/campaigns/${campaignId}/factions/${factionId}/edit`;

  let errorMessage: string | null = null;
  try {
    const faction = await prisma.faction.findUniqueOrThrow({
      where: { id: factionId, campaignId },
    });

    await checkGenerationQuota(ownedCampaign.ownerId);

    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      include: campaignGeographyInclude,
    });

    const buffer = await generateCampaignImage(
      buildCrestImagePrompt(campaign, faction),
      // "medium" (not "high") keeps crest generation comfortably under the
      // serverless timeout — an emblem needs no more detail than this.
      { size: "1024x1024", quality: "medium" },
    );
    await recordGeneration(ownedCampaign.ownerId, "campaign_image");

    if (faction.crestPath) await deleteFile(faction.crestPath);
    const crestPath = await saveFile(campaignId, buffer, "png");

    await prisma.faction.update({
      where: { id: factionId, campaignId },
      data: { crestPath, crestMimeType: "image/png" },
    });
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "La génération du blason a échoué. Réessaie dans un instant.";
  }

  redirect(
    errorMessage
      ? `${editUrl}?imageError=${encodeURIComponent(errorMessage)}`
      : editUrl,
  );
}

export async function deleteFaction(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const factionId = String(formData.get("factionId"));

  const faction = await prisma.faction.findUnique({
    where: { id: factionId, campaignId },
  });
  if (faction?.crestPath) await deleteFile(faction.crestPath);

  await prisma.faction.delete({ where: { id: factionId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

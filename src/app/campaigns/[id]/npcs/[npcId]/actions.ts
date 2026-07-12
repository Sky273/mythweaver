"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { npcRegenSchema } from "@/lib/llm/regenerate-schema";
import {
  REGENERATE_SYSTEM_PROMPT,
  buildRegenerateUserPrompt,
} from "@/lib/llm/regenerate-prompt";
import { generateCampaignImage } from "@/lib/llm/image";
import { buildPortraitImagePrompt } from "@/lib/llm/asset-prompt";
import { saveFile, deleteFile } from "@/lib/storage";
import { parseRequiredEnum } from "@/lib/campaign/enum-validation";
import {
  campaignBibleInclude,
  campaignGeographyInclude,
} from "@/lib/campaign/campaign-include";
import { NPCStatus } from "@/generated/prisma/enums";

export async function saveNPC(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const npcId = String(formData.get("npcId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const motivations = String(formData.get("motivations") ?? "").trim();
  const secrets = String(formData.get("secrets") ?? "").trim();
  const publicDescription = String(formData.get("publicDescription") ?? "").trim();
  const status = parseRequiredEnum(
    formData.get("status"),
    Object.values(NPCStatus),
    NPCStatus.ALIVE,
    "Le statut",
  );
  const factionId = String(formData.get("factionId") ?? "") || null;
  const locationId = String(formData.get("locationId") ?? "") || null;

  if (!name) throw new Error("Le nom est requis.");

  const data = {
    name,
    description: description || null,
    motivations: motivations || null,
    secrets: secrets || null,
    publicDescription: publicDescription || null,
    status,
    factionId,
    locationId,
  };

  if (npcId === "new") {
    await prisma.nPC.create({ data: { campaignId, ...data } });
  } else {
    await prisma.nPC.update({ where: { id: npcId, campaignId }, data });
  }

  redirect(`/campaigns/${campaignId}`);
}

export async function regenerateNPC(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const npcId = String(formData.get("npcId"));
  const instructions = String(formData.get("instructions") ?? "").trim();

  const npc = await prisma.nPC.findUniqueOrThrow({
    where: { id: npcId, campaignId },
  });
  if (npc.locked) {
    throw new Error(
      "Ce PNJ est verrouillé (canon) — déverrouille-le avant de le régénérer.",
    );
  }

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  const llm = getLLMProvider();
  const result = await llm.generateStructured(
    "regenerate_npc",
    npcRegenSchema,
    REGENERATE_SYSTEM_PROMPT,
    buildRegenerateUserPrompt(
      campaign,
      `NPC "${npc.name}"`,
      `Current description: ${npc.description ?? "(none)"}\nCurrent motivations: ${npc.motivations ?? "(none)"}\nCurrent secret: ${npc.secrets ?? "(none)"}`,
      instructions,
    ),
  );
  await recordGeneration(ownedCampaign.ownerId, "entity_regeneration");

  await prisma.nPC.update({
    where: { id: npcId, campaignId },
    data: result,
  });

  redirect(`/campaigns/${campaignId}/npcs/${npcId}/edit`);
}

export async function generateNPCPortrait(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const npcId = String(formData.get("npcId"));
  const editUrl = `/campaigns/${campaignId}/npcs/${npcId}/edit`;

  let errorMessage: string | null = null;
  try {
    const npc = await prisma.nPC.findUniqueOrThrow({
      where: { id: npcId, campaignId },
    });

    await checkGenerationQuota(ownedCampaign.ownerId);

    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      include: campaignGeographyInclude,
    });

    const buffer = await generateCampaignImage(
      buildPortraitImagePrompt(campaign, npc),
      // "medium" (not "high") keeps portrait generation comfortably under the
      // serverless timeout — the quality difference is imperceptible at the
      // sizes portraits are shown (48px thumbnail / 1024px preview).
      { size: "1024x1024", quality: "medium" },
    );
    await recordGeneration(ownedCampaign.ownerId, "campaign_image");

    if (npc.portraitPath) await deleteFile(npc.portraitPath);
    const portraitPath = await saveFile(campaignId, buffer, "png");

    await prisma.nPC.update({
      where: { id: npcId, campaignId },
      data: { portraitPath, portraitMimeType: "image/png" },
    });
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "La génération du portrait a échoué. Réessaie dans un instant.";
  }

  redirect(
    errorMessage
      ? `${editUrl}?imageError=${encodeURIComponent(errorMessage)}`
      : editUrl,
  );
}

export async function deleteNPC(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const npcId = String(formData.get("npcId"));

  const npc = await prisma.nPC.findUnique({ where: { id: npcId, campaignId } });
  if (npc?.portraitPath) await deleteFile(npc.portraitPath);

  await prisma.nPC.delete({ where: { id: npcId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

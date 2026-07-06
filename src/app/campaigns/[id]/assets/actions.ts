"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { generateCampaignImage } from "@/lib/llm/image";
import {
  buildDocumentImagePrompt,
  buildMapImagePrompt,
} from "@/lib/llm/asset-prompt";
import { saveFile, deleteFile } from "@/lib/storage";
import { parseRequiredEnum } from "@/lib/campaign/enum-validation";
import { campaignGeographyInclude } from "@/lib/campaign/campaign-include";
import { AssetKind } from "@/generated/prisma/enums";

export async function createCampaignAsset(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const title = String(formData.get("title") ?? "").trim();
  const kind = parseRequiredEnum(
    formData.get("kind"),
    Object.values(AssetKind),
    AssetKind.MAP,
    "Le type de document",
  );
  const userPrompt = String(formData.get("prompt") ?? "").trim();

  if (!title || !userPrompt) {
    throw new Error("Le titre et la description sont requis.");
  }

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignGeographyInclude,
  });

  const prompt =
    kind === "MAP"
      ? buildMapImagePrompt(campaign, userPrompt)
      : buildDocumentImagePrompt(campaign, userPrompt);

  const buffer = await generateCampaignImage(prompt, {
    size: kind === "MAP" ? "1536x1024" : "1024x1536",
    quality: "high",
  });
  await recordGeneration(ownedCampaign.ownerId, "campaign_image");
  const filePath = await saveFile(campaignId, buffer, "png");

  await prisma.campaignAsset.create({
    data: {
      campaignId,
      kind,
      title,
      prompt,
      filePath,
      mimeType: "image/png",
    },
  });

  redirect(`/campaigns/${campaignId}`);
}

export async function deleteCampaignAsset(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const assetId = String(formData.get("assetId"));

  const asset = await prisma.campaignAsset.findUnique({
    where: { id: assetId, campaignId },
  });
  if (asset) {
    await deleteFile(asset.filePath);
    await prisma.campaignAsset.delete({ where: { id: assetId, campaignId } });
  }

  redirect(`/campaigns/${campaignId}`);
}

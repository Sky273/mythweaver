"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";

export async function addMapPin(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const assetId = String(formData.get("assetId"));
  const locationId = String(formData.get("locationId"));
  const label = String(formData.get("label") ?? "").trim();
  const x = Number(formData.get("x"));
  const y = Number(formData.get("y"));

  if (!locationId) throw new Error("Choisis un lieu à associer au point.");
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    x > 100 ||
    y < 0 ||
    y > 100
  ) {
    throw new Error("Position du point invalide.");
  }

  // Scope both the asset and the location to this campaign before linking.
  await prisma.campaignAsset.findUniqueOrThrow({
    where: { id: assetId, campaignId },
  });
  await prisma.location.findUniqueOrThrow({
    where: { id: locationId, campaignId },
  });

  await prisma.mapPin.create({
    data: { campaignId, assetId, locationId, x, y, label: label || null },
  });

  revalidatePath(`/campaigns/${campaignId}/maps/${assetId}`);
}

export async function updateMapPinLabel(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const pinId = String(formData.get("pinId"));
  const assetId = String(formData.get("assetId"));
  const label = String(formData.get("label") ?? "").trim();

  await prisma.mapPin.update({
    where: { id: pinId, campaignId },
    data: { label: label || null },
  });

  revalidatePath(`/campaigns/${campaignId}/maps/${assetId}`);
}

export async function deleteMapPin(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const pinId = String(formData.get("pinId"));
  const assetId = String(formData.get("assetId"));

  await prisma.mapPin.delete({ where: { id: pinId, campaignId } });

  revalidatePath(`/campaigns/${campaignId}/maps/${assetId}`);
}

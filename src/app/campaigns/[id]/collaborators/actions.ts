"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";

export async function addCollaborator(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const campaign = await requireCampaignOwnership(campaignId);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) throw new Error("L'email est requis.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Aucun utilisateur avec cet email.");
  if (user.id === campaign.ownerId) {
    throw new Error("Cet utilisateur est déjà propriétaire de la campagne.");
  }

  await prisma.campaignCollaborator.upsert({
    where: { campaignId_userId: { campaignId, userId: user.id } },
    create: { campaignId, userId: user.id },
    update: {},
  });

  redirect(`/campaigns/${campaignId}`);
}

export async function removeCollaborator(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const collaboratorId = String(formData.get("collaboratorId"));
  await prisma.campaignCollaborator.delete({
    where: { id: collaboratorId, campaignId },
  });

  redirect(`/campaigns/${campaignId}`);
}

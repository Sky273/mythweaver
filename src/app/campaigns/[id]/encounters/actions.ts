"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";

export async function createEncounter(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Le nom du combat est requis.");

  const encounter = await prisma.encounter.create({
    data: { campaignId, name },
  });

  redirect(`/campaigns/${campaignId}/encounters/${encounter.id}`);
}

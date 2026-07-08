"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";

export async function updateWorld(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const overview = String(formData.get("overview") ?? "").trim();
  const history = String(formData.get("history") ?? "").trim();
  const cosmology = String(formData.get("cosmology") ?? "").trim();
  const publicDescription = String(formData.get("publicDescription") ?? "").trim();

  await prisma.world.update({
    where: { campaignId },
    data: {
      overview,
      history: history || null,
      cosmology: cosmology || null,
      publicDescription: publicDescription || null,
    },
  });

  redirect(`/campaigns/${campaignId}`);
}

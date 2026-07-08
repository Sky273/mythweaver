"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { plotThreadRegenSchema } from "@/lib/llm/regenerate-schema";
import {
  REGENERATE_SYSTEM_PROMPT,
  buildRegenerateUserPrompt,
} from "@/lib/llm/regenerate-prompt";
import { parseRequiredEnum } from "@/lib/campaign/enum-validation";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import { PlotStatus } from "@/generated/prisma/enums";

export async function savePlotThread(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const plotThreadId = String(formData.get("plotThreadId"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const publicDescription = String(formData.get("publicDescription") ?? "").trim();
  const status = parseRequiredEnum(
    formData.get("status"),
    Object.values(PlotStatus),
    PlotStatus.SEEDED,
    "Le statut",
  );

  if (!title) throw new Error("Le titre est requis.");

  const data = {
    title,
    description: description || null,
    publicDescription: publicDescription || null,
    status,
  };

  if (plotThreadId === "new") {
    await prisma.plotThread.create({ data: { campaignId, ...data } });
  } else {
    await prisma.plotThread.update({
      where: { id: plotThreadId, campaignId },
      data,
    });
  }

  redirect(`/campaigns/${campaignId}`);
}

export async function regeneratePlotThread(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const plotThreadId = String(formData.get("plotThreadId"));
  const instructions = String(formData.get("instructions") ?? "").trim();

  const plotThread = await prisma.plotThread.findUniqueOrThrow({
    where: { id: plotThreadId, campaignId },
  });
  if (plotThread.locked) {
    throw new Error(
      "Cette intrigue est verrouillée (canon) — déverrouille-la avant de la régénérer.",
    );
  }

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  const llm = getLLMProvider();
  const result = await llm.generateStructured(
    "regenerate_plot_thread",
    plotThreadRegenSchema,
    REGENERATE_SYSTEM_PROMPT,
    buildRegenerateUserPrompt(
      campaign,
      `Plot thread "${plotThread.title}"`,
      `Current description: ${plotThread.description ?? "(none)"}`,
      instructions,
    ),
  );
  await recordGeneration(ownedCampaign.ownerId, "entity_regeneration");

  await prisma.plotThread.update({
    where: { id: plotThreadId, campaignId },
    data: result,
  });

  redirect(`/campaigns/${campaignId}/plot-threads/${plotThreadId}/edit`);
}

export async function deletePlotThread(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const plotThreadId = String(formData.get("plotThreadId"));

  await prisma.plotThread.delete({ where: { id: plotThreadId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

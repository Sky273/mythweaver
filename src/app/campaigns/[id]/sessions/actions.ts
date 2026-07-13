"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";

// Create a session manually, without any AI call. The GM lands on the edit
// page to fill in the details. Sessions default to "Préparée" (PREPPED).
export async function createSession(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const lastSession = await prisma.session.findFirst({
    where: { campaignId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const session = await prisma.session.create({
    data: {
      campaignId,
      number: (lastSession?.number ?? 0) + 1,
      status: "PREPPED",
    },
  });

  redirect(`/campaigns/${campaignId}/sessions/${session.id}/edit`);
}

export async function createSessionPrep(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  await checkGenerationQuota(ownedCampaign.ownerId);

  const playerStatus = String(formData.get("playerStatus") ?? "").trim();
  const focusPlotThreadIds = formData
    .getAll("focusPlotThreadIds")
    .map((value) => String(value));
  const provider = String(formData.get("provider") ?? "") || undefined;
  const detailLevel =
    formData.get("detailLevel") === "detailed" ? "detailed" : "standard";

  if (!playerStatus) {
    throw new Error("Décris où en sont les joueurs.");
  }

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      ...campaignBibleInclude,
      playerCharacters: true,
      sessions: true,
    },
  });

  const focusPlotThreadTitles = campaign.plotThreads
    .filter((plot) => focusPlotThreadIds.includes(plot.id))
    .map((plot) => plot.title);

  const llm = getLLMProvider(provider);
  const prep = await llm.generateSessionPrep(campaign, {
    playerStatus,
    focusPlotThreadTitles,
    detailLevel,
  });
  await recordGeneration(ownedCampaign.ownerId, "session_prep");

  const lastSession = campaign.sessions.reduce<number>(
    (max, session) => Math.max(max, session.number),
    0,
  );

  const session = await prisma.session.create({
    data: {
      campaignId,
      number: lastSession + 1,
      playerStatus,
      prep,
      status: "PREPPED",
    },
  });

  redirect(`/campaigns/${campaignId}/sessions/${session.id}`);
}

"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { storedProposalSchema } from "@/lib/llm/recap-schema";
import { sessionPrepSchema } from "@/lib/llm/session-schema";
import { parseRequiredEnum } from "@/lib/campaign/enum-validation";
import { SessionStatus } from "@/generated/prisma/enums";

// Parse the session-prep editor's hidden JSON field into a value ready for the
// `prep` Json column: a validated prep object, or DbNull when the editor is
// effectively empty (so the session reads as "not yet prepared").
function parsePrepInput(
  raw: string,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  const trimmed = raw.trim();
  if (!trimmed) return Prisma.DbNull;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Les données de préparation sont invalides.");
  }

  const prep = sessionPrepSchema.parse(parsed);
  const cleaned = {
    ...prep,
    scenes: prep.scenes.filter((scene) => scene.title || scene.summary),
    keyNPCs: prep.keyNPCs.filter(
      (npc) => npc.name || npc.wantsThisSession || npc.playingTips,
    ),
  };

  const isEmpty =
    !cleaned.objectives &&
    !cleaned.recapForPlayers &&
    !cleaned.openingReadAloud &&
    cleaned.scenes.length === 0 &&
    cleaned.keyNPCs.length === 0 &&
    cleaned.hooks.length === 0 &&
    cleaned.complications.length === 0;

  return isEmpty ? Prisma.DbNull : (cleaned as Prisma.InputJsonValue);
}

export async function updateSession(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const sessionId = String(formData.get("sessionId"));

  const number = Number(formData.get("number"));
  if (!Number.isInteger(number) || number < 1) {
    throw new Error("Le numéro de session doit être un entier positif.");
  }

  const status = parseRequiredEnum(
    formData.get("status"),
    Object.values(SessionStatus),
    SessionStatus.PREPPED,
    "Le statut",
  );

  const scheduledForRaw = String(formData.get("scheduledFor") ?? "").trim();
  const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : null;
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) {
    throw new Error("La date prévue est invalide.");
  }

  const playerStatus = String(formData.get("playerStatus") ?? "").trim();
  const recap = String(formData.get("recap") ?? "").trim();
  const playerRecap = String(formData.get("playerRecap") ?? "").trim();
  const prep = parsePrepInput(String(formData.get("prepJson") ?? ""));

  // The session number is unique per campaign — surface a clear message
  // instead of a raw Prisma unique-constraint error.
  const clash = await prisma.session.findFirst({
    where: { campaignId, number, NOT: { id: sessionId } },
    select: { id: true },
  });
  if (clash) {
    throw new Error(`La session numéro ${number} existe déjà dans cette campagne.`);
  }

  await prisma.session.update({
    where: { id: sessionId, campaignId },
    data: {
      number,
      status,
      scheduledFor,
      playerStatus: playerStatus || null,
      recap: recap || null,
      playerRecap: playerRecap || null,
      prep,
    },
  });

  redirect(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function deleteSession(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const sessionId = String(formData.get("sessionId"));
  await prisma.session.delete({ where: { id: sessionId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

export async function submitRecap(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  await checkGenerationQuota(ownedCampaign.ownerId);

  const sessionId = String(formData.get("sessionId"));
  const recap = String(formData.get("recap") ?? "").trim();
  const provider = String(formData.get("provider") ?? "") || undefined;

  if (!recap) throw new Error("Décris ce qui s'est passé pendant la session.");

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { npcs: true, plotThreads: true },
  });

  const llm = getLLMProvider(provider);
  const proposal = await llm.generateSessionUpdateProposal(campaign, recap);
  await recordGeneration(ownedCampaign.ownerId, "recap_analysis");

  await prisma.session.update({
    where: { id: sessionId, campaignId },
    data: {
      recap,
      status: "PLAYED",
      changeProposal: proposal,
      // Pre-fill the player-facing recap from the same call; the GM can edit
      // it and choose when to diffuse it (playerRecapRevealed stays false).
      playerRecap: proposal.playerRecap,
    },
  });

  redirect(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

export async function applyProposal(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const sessionId = String(formData.get("sessionId"));

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId, campaignId },
  });
  if (!session.changeProposal) {
    redirect(`/campaigns/${campaignId}/sessions/${sessionId}`);
  }

  const proposal = storedProposalSchema.parse(session.changeProposal);
  const included = new Set(formData.getAll("include").map(String));

  for (const [index, update] of proposal.npcUpdates.entries()) {
    if (!included.has(`npcUpdates:${index}`) || !update.newStatus) continue;
    const npc = await prisma.nPC.findFirst({
      where: { campaignId, name: update.name },
    });
    if (npc) {
      await prisma.nPC.update({
        where: { id: npc.id },
        data: { status: update.newStatus },
      });
    }
  }

  for (const [index, update] of proposal.plotThreadUpdates.entries()) {
    if (!included.has(`plotThreadUpdates:${index}`) || !update.newStatus) continue;
    const plotThread = await prisma.plotThread.findFirst({
      where: { campaignId, title: update.title },
    });
    if (plotThread) {
      await prisma.plotThread.update({
        where: { id: plotThread.id },
        data: { status: update.newStatus },
      });
    }
  }

  for (const [index, npc] of proposal.newNPCs.entries()) {
    if (!included.has(`newNPCs:${index}`)) continue;
    await prisma.nPC.create({
      data: {
        campaignId,
        name: npc.name,
        description: npc.description,
        motivations: npc.motivations,
      },
    });
  }

  for (const [index, plotThread] of proposal.newPlotThreads.entries()) {
    if (!included.has(`newPlotThreads:${index}`)) continue;
    await prisma.plotThread.create({
      data: {
        campaignId,
        title: plotThread.title,
        description: plotThread.description,
      },
    });
  }

  await prisma.session.update({
    where: { id: sessionId, campaignId },
    data: { changeProposal: Prisma.DbNull },
  });

  redirect(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { clampHP, computeNextTurn } from "@/lib/campaign/encounter-order";

function encounterPath(campaignId: string, encounterId: string) {
  return `/campaigns/${campaignId}/encounters/${encounterId}`;
}

export async function addCombatant(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));

  const prefill = String(formData.get("prefill") ?? "");
  const manualName = String(formData.get("name") ?? "").trim();
  const initiative = Number(formData.get("initiative"));
  const maxHPRaw = String(formData.get("maxHP") ?? "").trim();

  if (!Number.isFinite(initiative)) throw new Error("L'initiative est requise.");
  const maxHP = maxHPRaw ? Number(maxHPRaw) : null;

  let name = manualName;
  let isPC = formData.get("isPC") === "on";

  if (prefill) {
    const [kind, refId] = prefill.split(":");
    if (kind === "npc") {
      const npc = await prisma.nPC.findUniqueOrThrow({ where: { id: refId, campaignId } });
      name = npc.name;
      isPC = false;
    } else if (kind === "pc") {
      const pc = await prisma.playerCharacter.findUniqueOrThrow({
        where: { id: refId, campaignId },
      });
      name = pc.name;
      isPC = true;
    }
  }

  if (!name) throw new Error("Un nom est requis.");

  const combatant = await prisma.combatant.create({
    data: { encounterId, name, initiative, maxHP, currentHP: maxHP, isPC },
  });

  const encounter = await prisma.encounter.findUniqueOrThrow({
    where: { id: encounterId, campaignId },
  });
  if (!encounter.currentTurnCombatantId) {
    await prisma.encounter.update({
      where: { id: encounterId },
      data: { currentTurnCombatantId: combatant.id },
    });
  }

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function removeCombatant(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));
  const combatantId = String(formData.get("combatantId"));

  const encounter = await prisma.encounter.findUniqueOrThrow({
    where: { id: encounterId, campaignId },
    include: { combatants: true },
  });

  let nextCurrentId = encounter.currentTurnCombatantId;
  if (nextCurrentId === combatantId) {
    const { nextId } = computeNextTurn(encounter.combatants, combatantId);
    nextCurrentId = nextId === combatantId ? null : nextId;
  }

  await prisma.combatant.delete({ where: { id: combatantId, encounterId } });
  await prisma.encounter.update({
    where: { id: encounterId },
    data: { currentTurnCombatantId: nextCurrentId },
  });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function adjustCombatantHP(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));
  const combatantId = String(formData.get("combatantId"));
  const delta = Number(formData.get("delta"));
  if (!Number.isFinite(delta)) throw new Error("Valeur invalide.");

  const combatant = await prisma.combatant.findUniqueOrThrow({
    where: { id: combatantId, encounterId },
  });
  const nextHP = clampHP((combatant.currentHP ?? combatant.maxHP ?? 0) + delta, combatant.maxHP);

  await prisma.combatant.update({ where: { id: combatantId }, data: { currentHP: nextHP } });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function setCombatantInitiative(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));
  const combatantId = String(formData.get("combatantId"));
  const initiative = Number(formData.get("initiative"));
  if (!Number.isFinite(initiative)) throw new Error("Initiative invalide.");

  await prisma.combatant.update({
    where: { id: combatantId, encounterId },
    data: { initiative },
  });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function addCondition(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));
  const combatantId = String(formData.get("combatantId"));
  const condition = String(formData.get("condition") ?? "").trim();

  if (condition) {
    const combatant = await prisma.combatant.findUniqueOrThrow({
      where: { id: combatantId, encounterId },
    });
    if (!combatant.conditions.includes(condition)) {
      await prisma.combatant.update({
        where: { id: combatantId },
        data: { conditions: { push: condition } },
      });
    }
  }

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function removeCondition(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));
  const combatantId = String(formData.get("combatantId"));
  const condition = String(formData.get("condition") ?? "");

  const combatant = await prisma.combatant.findUniqueOrThrow({
    where: { id: combatantId, encounterId },
  });
  await prisma.combatant.update({
    where: { id: combatantId },
    data: { conditions: combatant.conditions.filter((c) => c !== condition) },
  });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function advanceTurn(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));

  const encounter = await prisma.encounter.findUniqueOrThrow({
    where: { id: encounterId, campaignId },
    include: { combatants: true },
  });

  const { nextId, roundIncremented } = computeNextTurn(
    encounter.combatants,
    encounter.currentTurnCombatantId,
  );

  await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      currentTurnCombatantId: nextId,
      round: roundIncremented ? encounter.round + 1 : encounter.round,
    },
  });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function endEncounter(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));

  await prisma.encounter.update({
    where: { id: encounterId, campaignId },
    data: { active: false },
  });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function reopenEncounter(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));

  await prisma.encounter.update({
    where: { id: encounterId, campaignId },
    data: { active: true },
  });

  revalidatePath(encounterPath(campaignId, encounterId));
}

export async function deleteEncounter(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);
  const encounterId = String(formData.get("encounterId"));

  await prisma.encounter.delete({ where: { id: encounterId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

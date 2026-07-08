"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "./authorize";

// Entities that can be revealed to players (the player view only ever shows
// revealed ones, and only their spoiler-free public content). "session" flips
// a session's playerRecapRevealed flag.
export type RevealableKind =
  | "world"
  | "region"
  | "npc"
  | "location"
  | "faction"
  | "plotThread"
  | "asset"
  | "session";

export async function toggleReveal(formData: FormData) {
  const kind = String(formData.get("kind")) as RevealableKind;
  const id = String(formData.get("id"));
  const campaignId = String(formData.get("campaignId"));
  const nextRevealed = formData.get("nextRevealed") === "true";

  await requireCampaignOwnership(campaignId);

  switch (kind) {
    case "world":
      await prisma.world.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "region":
      await prisma.region.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "npc":
      await prisma.nPC.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "location":
      await prisma.location.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "faction":
      await prisma.faction.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "plotThread":
      await prisma.plotThread.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "asset":
      await prisma.campaignAsset.update({
        where: { id, campaignId },
        data: { revealed: nextRevealed },
      });
      break;
    case "session":
      await prisma.session.update({
        where: { id, campaignId },
        data: { playerRecapRevealed: nextRevealed },
      });
      break;
    default:
      throw new Error("Type révélable inconnu.");
  }

  revalidatePath(`/campaigns/${campaignId}`);
}

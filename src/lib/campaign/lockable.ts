"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "./authorize";

export type LockableKind =
  | "world"
  | "region"
  | "location"
  | "faction"
  | "npc"
  | "plotThread";

export async function toggleLocked(formData: FormData) {
  const kind = String(formData.get("kind")) as LockableKind;
  const id = String(formData.get("id"));
  const campaignId = String(formData.get("campaignId"));
  const nextLocked = formData.get("nextLocked") === "true";

  await requireCampaignOwnership(campaignId);

  switch (kind) {
    case "world":
      await prisma.world.update({
        where: { id, campaignId },
        data: { locked: nextLocked },
      });
      break;
    case "region":
      await prisma.region.update({
        where: { id, campaignId },
        data: { locked: nextLocked },
      });
      break;
    case "location":
      await prisma.location.update({
        where: { id, campaignId },
        data: { locked: nextLocked },
      });
      break;
    case "faction":
      await prisma.faction.update({
        where: { id, campaignId },
        data: { locked: nextLocked },
      });
      break;
    case "npc":
      await prisma.nPC.update({
        where: { id, campaignId },
        data: { locked: nextLocked },
      });
      break;
    case "plotThread":
      await prisma.plotThread.update({
        where: { id, campaignId },
        data: { locked: nextLocked },
      });
      break;
    default:
      throw new Error("Type verrouillable inconnu.");
  }

  revalidatePath(`/campaigns/${campaignId}`);
}

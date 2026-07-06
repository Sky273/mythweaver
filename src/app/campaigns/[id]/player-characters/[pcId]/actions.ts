"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  deleteFile,
  extensionForMimeType,
  saveFile,
} from "@/lib/storage";

export async function savePlayerCharacter(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const pcId = String(formData.get("pcId"));
  const name = String(formData.get("name") ?? "").trim();
  const playerName = String(formData.get("playerName") ?? "").trim();
  const characterClass = String(formData.get("class") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const backstory = String(formData.get("backstory") ?? "").trim();
  const sheet = formData.get("characterSheet");

  if (!name) throw new Error("Le nom est requis.");

  const data: {
    name: string;
    playerName: string | null;
    class: string | null;
    summary: string | null;
    backstory: string | null;
    characterSheetPath?: string;
    characterSheetOriginalName?: string;
    characterSheetMimeType?: string;
  } = {
    name,
    playerName: playerName || null,
    class: characterClass || null,
    summary: summary || null,
    backstory: backstory || null,
  };

  if (sheet instanceof File && sheet.size > 0) {
    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(sheet.type)) {
      throw new Error(
        "Format de fichier non supporté (PDF, PNG, JPEG ou WebP uniquement).",
      );
    }
    if (sheet.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error("Le fichier dépasse la taille maximale de 15 Mo.");
    }

    if (pcId !== "new") {
      const existing = await prisma.playerCharacter.findUnique({
        where: { id: pcId, campaignId },
      });
      if (existing?.characterSheetPath) {
        await deleteFile(existing.characterSheetPath);
      }
    }

    const buffer = Buffer.from(await sheet.arrayBuffer());
    const relativePath = await saveFile(
      campaignId,
      buffer,
      extensionForMimeType(sheet.type),
    );

    data.characterSheetPath = relativePath;
    data.characterSheetOriginalName = sheet.name;
    data.characterSheetMimeType = sheet.type;
  }

  if (pcId === "new") {
    await prisma.playerCharacter.create({ data: { campaignId, ...data } });
  } else {
    await prisma.playerCharacter.update({
      where: { id: pcId, campaignId },
      data,
    });
  }

  redirect(`/campaigns/${campaignId}`);
}

export async function deletePlayerCharacter(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const pcId = String(formData.get("pcId"));

  const existing = await prisma.playerCharacter.findUnique({
    where: { id: pcId, campaignId },
  });
  if (existing?.characterSheetPath) {
    await deleteFile(existing.characterSheetPath);
  }

  await prisma.playerCharacter.delete({ where: { id: pcId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

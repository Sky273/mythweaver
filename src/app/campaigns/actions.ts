"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { persistCampaignBible } from "@/lib/campaign/persist";

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const system = String(formData.get("system") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();
  const themes = String(formData.get("themes") ?? "").trim();
  const parsedPlayerCount = Number(formData.get("playerCount"));
  const playerCount = Number.isFinite(parsedPlayerCount) ? parsedPlayerCount : 4;
  const provider = String(formData.get("provider") ?? "") || undefined;

  if (!name || !system) {
    throw new Error("Le nom et le système de jeu sont requis.");
  }

  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié.");

  await checkGenerationQuota(session.user.id);

  const llm = getLLMProvider(provider);
  const bible = await llm.generateCampaignBible({
    name,
    system,
    tone,
    themes,
    playerCount,
  });
  await recordGeneration(session.user.id, "campaign_bible");

  const campaignId = await persistCampaignBible(bible, {
    name,
    system,
    tone,
    ownerId: session.user.id,
  });

  redirect(`/campaigns/${campaignId}`);
}

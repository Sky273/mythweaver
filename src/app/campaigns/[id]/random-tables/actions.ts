"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { randomTableEntriesSchema } from "@/lib/llm/random-table-schema";
import {
  RANDOM_TABLE_SYSTEM_PROMPT,
  buildRandomTableUserPrompt,
} from "@/lib/llm/random-table-prompt";
import { parseRequiredEnum } from "@/lib/campaign/enum-validation";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import { RandomTableKind } from "@/generated/prisma/enums";

export async function createRandomTable(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const title = String(formData.get("title") ?? "").trim();
  const kind = parseRequiredEnum(
    formData.get("kind"),
    Object.values(RandomTableKind),
    RandomTableKind.MISC,
    "Le type de table",
  );
  const contextNote = String(formData.get("contextNote") ?? "").trim();

  if (!title) throw new Error("Le titre est requis.");

  await checkGenerationQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: campaignBibleInclude,
  });

  const llm = getLLMProvider();
  const result = await llm.generateStructured(
    "generate_random_table",
    randomTableEntriesSchema,
    RANDOM_TABLE_SYSTEM_PROMPT,
    buildRandomTableUserPrompt(campaign, kind, title, contextNote),
  );
  await recordGeneration(ownedCampaign.ownerId, "random_table");

  await prisma.randomTable.create({
    data: { campaignId, kind, title, entries: result.entries },
  });

  redirect(`/campaigns/${campaignId}`);
}

export async function deleteRandomTable(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const tableId = String(formData.get("tableId"));

  await prisma.randomTable.delete({ where: { id: tableId, campaignId } });

  redirect(`/campaigns/${campaignId}`);
}

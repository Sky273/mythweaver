"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getLLMProvider } from "@/lib/llm";
import { checkGenerationQuota, recordGeneration } from "@/lib/llm/quota";
import { askSchema } from "@/lib/llm/ask-schema";
import { ASK_SYSTEM_PROMPT, buildAskUserPrompt } from "@/lib/llm/ask-prompt";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";

export async function askCampaign(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  const askUrl = `/campaigns/${campaignId}/ask`;
  const question = String(formData.get("question") ?? "").trim();
  if (!question) redirect(askUrl);

  let errorMessage: string | null = null;
  try {
    await checkGenerationQuota(ownedCampaign.ownerId);

    const [campaign, recentSessions] = await Promise.all([
      prisma.campaign.findUniqueOrThrow({
        where: { id: campaignId },
        include: campaignBibleInclude,
      }),
      prisma.session.findMany({
        where: { campaignId, NOT: { recap: null } },
        orderBy: { number: "desc" },
        take: 3,
        select: { recap: true },
      }),
    ]);

    const recentRecaps = recentSessions
      .map((session) => session.recap)
      .filter((recap): recap is string => Boolean(recap))
      .reverse();

    const result = await getLLMProvider().generateStructured(
      "ask_campaign",
      askSchema,
      ASK_SYSTEM_PROMPT,
      buildAskUserPrompt(campaign, recentRecaps, question),
    );
    await recordGeneration(ownedCampaign.ownerId, "campaign_qa");

    await prisma.campaignQuestion.create({
      data: { campaignId, question, answer: result.answer },
    });
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "La réponse n'a pas pu être générée. Réessaie dans un instant.";
  }

  redirect(
    errorMessage
      ? `${askUrl}?error=${encodeURIComponent(errorMessage)}`
      : askUrl,
  );
}

export async function deleteCampaignQuestion(formData: FormData) {
  const campaignId = String(formData.get("campaignId"));
  await requireCampaignOwnership(campaignId);

  const questionId = String(formData.get("questionId"));
  await prisma.campaignQuestion.delete({
    where: { id: questionId, campaignId },
  });

  redirect(`/campaigns/${campaignId}/ask`);
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { campaignBibleToMarkdown } from "@/lib/campaign/bible-markdown";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: campaignId } = await params;
  await requireCampaignAccess(campaignId);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { ...campaignBibleInclude, playerCharacters: true },
  });

  if (!campaign) notFound();

  const markdown = campaignBibleToMarkdown(campaign);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${campaign.name}.md"`,
    },
  });
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { sessionPrepSchema } from "@/lib/llm/session-schema";
import { sessionPrepToMarkdown } from "@/lib/campaign/session-markdown";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> },
) {
  const { id: campaignId, sessionId } = await params;
  await requireCampaignAccess(campaignId);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { campaign: true },
  });
  if (!session || session.campaignId !== campaignId || !session.prep) {
    notFound();
  }

  const prep = sessionPrepSchema.parse(session.prep);
  const markdown = sessionPrepToMarkdown(
    session.campaign.name,
    session.number,
    prep,
  );

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${session.number}.md"`,
    },
  });
}

import { Prisma } from "@/generated/prisma/client";

export type CampaignForRecapPrompt = Prisma.CampaignGetPayload<{
  include: { npcs: true; plotThreads: true };
}>;

export const RECAP_ANALYSIS_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master keep their campaign bible in " +
  "sync with what actually happened at the table. You are given the " +
  "campaign's current NPCs and plot threads (with their current status) " +
  "and the GM's freeform recap of what just happened in a session. " +
  "Propose status updates ONLY when the recap clearly supports them — do " +
  "not invent developments that aren't implied by the recap. Entities " +
  "marked as locked (canon) should only be changed if the recap explicitly " +
  "and unambiguously says so. Leave newStatus null for anything unchanged.";

export function buildRecapAnalysisUserPrompt(
  campaign: CampaignForRecapPrompt,
  recap: string,
) {
  const lines: string[] = [];

  if (campaign.npcs.length > 0) {
    lines.push("## Current NPCs");
    for (const npc of campaign.npcs) {
      lines.push(
        `- ${npc.name} [${npc.status}]${npc.locked ? " (canon, locked)" : ""}`,
      );
    }
  }

  if (campaign.plotThreads.length > 0) {
    lines.push("", "## Current plot threads");
    for (const plot of campaign.plotThreads) {
      lines.push(
        `- ${plot.title} [${plot.status}]${plot.locked ? " (canon, locked)" : ""}`,
      );
    }
  }

  lines.push("", "## Session recap (GM's own words)", recap);

  return lines.join("\n");
}

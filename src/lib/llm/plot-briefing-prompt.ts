import { buildCampaignContextLines, CampaignBibleContext } from "./campaign-context";

export const PLOT_BRIEFING_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master run one plot thread of their " +
  "campaign at the table. You are given the full campaign bible for " +
  "consistency and, when available, recaps of recent sessions. Write a " +
  "detailed, immediately usable GM briefing for the given plot thread: what " +
  "is really going on behind the scenes, the stakes, the NPCs/factions " +
  "driving or opposing it and their goals, concrete ways to introduce or " +
  "escalate it, a few possible next scenes, and complications. Stay " +
  "consistent with existing canon (especially anything marked locked) and " +
  "with what the recaps say has already happened. This is for the GM only — " +
  "you may and should include secrets and hidden motivations.";

export function buildPlotBriefingUserPrompt(
  campaign: CampaignBibleContext,
  plotThread: { title: string; description: string | null; status: string },
  recentRecaps: string[],
) {
  const lines = buildCampaignContextLines(campaign);

  lines.push(
    "",
    `## Plot thread to brief: "${plotThread.title}" [${plotThread.status}]`,
    plotThread.description ?? "(no description yet)",
  );

  if (recentRecaps.length > 0) {
    lines.push("", "## Recent session recaps (most recent last)");
    for (const recap of recentRecaps) lines.push("-", recap);
  }

  return lines.join("\n");
}

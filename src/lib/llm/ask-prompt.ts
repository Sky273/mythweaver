import { buildCampaignContextLines, CampaignBibleContext } from "./campaign-context";

export const ASK_SYSTEM_PROMPT =
  "You are the game master's private assistant and you know their whole " +
  "campaign bible. Answer the GM's question using the campaign facts " +
  "provided below. This is for the GM's eyes only, so you may freely use " +
  "secrets, hidden motivations and unrevealed plot points. Ground every " +
  "claim in the given material: clearly distinguish what is established " +
  "canon from what is reasonable inference or a suggestion. If the bible " +
  "doesn't answer the question, say so plainly rather than inventing hard " +
  "facts — you may then offer a clearly-labelled suggestion. Be concise and " +
  "directly useful; answer in the same language as the campaign content.";

export function buildAskUserPrompt(
  campaign: CampaignBibleContext,
  recentRecaps: string[],
  question: string,
) {
  const lines = buildCampaignContextLines(campaign);

  if (recentRecaps.length > 0) {
    lines.push("", "## Recent session recaps (most recent last)");
    for (const recap of recentRecaps) lines.push("-", recap);
  }

  lines.push("", `## GM's question`, question);

  return lines.join("\n");
}

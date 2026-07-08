import { buildCampaignContextLines, CampaignBibleContext } from "./campaign-context";

export const REGENERATE_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master rewrite a single existing " +
  "entity from their campaign bible. You are given the full campaign " +
  "context for consistency and the entity's current data. Keep the " +
  "entity's name/title exactly as given and do not invent new " +
  "relationships — only rewrite the descriptive fields requested. Do not " +
  "contradict other canon entities, especially anything marked as locked. " +
  "If a `publicDescription` field is requested, also produce a spoiler-free, " +
  "player-facing version of it: only what players could plausibly know, " +
  "never secrets or true hidden motivations.";

export function buildRegenerateUserPrompt(
  campaign: CampaignBibleContext,
  entityLabel: string,
  currentData: string,
  instructions: string,
) {
  const lines = buildCampaignContextLines(campaign);

  lines.push("", `## Entity to rewrite: ${entityLabel}`, currentData);

  if (instructions) {
    lines.push("", `## GM's direction for the rewrite: ${instructions}`);
  }

  return lines.join("\n");
}

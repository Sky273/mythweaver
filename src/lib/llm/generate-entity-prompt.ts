import { buildCampaignContextLines, CampaignBibleContext } from "./campaign-context";

export const GENERATE_ENTITY_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master expand their campaign bible " +
  "with a single brand-new entity. You are given the full campaign context " +
  "for consistency. Invent one new entity of the requested type that fits " +
  "the world's tone and established canon, is clearly distinct from every " +
  "entity already listed (no duplicate or near-duplicate names), and does " +
  "not contradict anything marked as canon/locked. Give it an evocative, " +
  "setting-appropriate name and rich, immediately usable descriptive text. " +
  "If a `publicDescription` field is requested, also write a spoiler-free, " +
  "player-facing version (only what players could plausibly know — no " +
  "secrets or true hidden motivations). " +
  "Write in the same language as the existing bible content above.";

export function buildGenerateEntityUserPrompt(
  campaign: CampaignBibleContext,
  entityTypeLabel: string,
) {
  const lines = buildCampaignContextLines(campaign);
  lines.push("", `## Create one new entity of type: ${entityTypeLabel}`);
  return lines.join("\n");
}

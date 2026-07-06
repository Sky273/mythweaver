import { buildCampaignContextLines, CampaignBibleContext } from "./campaign-context";

export const RANDOM_TABLE_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master build a random table they " +
  "can roll on during play (encounters, loot, incidental NPCs, or " +
  "miscellaneous complications). Ground every entry in the campaign's " +
  "actual world, tone, and factions — reuse existing names where it fits, " +
  "but entries can also be generic/reusable filler appropriate to the " +
  "setting. Each entry should be a short, self-contained, table-ready " +
  "line (no numbering, the GM rolls a die to pick one).";

const KIND_LABELS: Record<string, string> = {
  ENCOUNTER: "random encounters",
  LOOT: "loot/treasure",
  NPC: "incidental NPCs to drop into a scene",
  MISC: "miscellaneous complications or rumors",
};

export function buildRandomTableUserPrompt(
  campaign: CampaignBibleContext,
  kind: string,
  title: string,
  contextNote: string,
) {
  const lines = buildCampaignContextLines(campaign);

  lines.push(
    "",
    `## Table to generate: "${title}" — a table of ${KIND_LABELS[kind] ?? kind}`,
  );

  if (contextNote) {
    lines.push(`Specific focus: ${contextNote}`);
  }

  return lines.join("\n");
}

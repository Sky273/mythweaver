export type CampaignBriefing = {
  name: string;
  system: string;
  tone: string;
  themes: string;
  playerCount: number;
};

export const CAMPAIGN_BIBLE_SYSTEM_PROMPT =
  "You are a tabletop RPG campaign designer helping a game master (GM) " +
  "bootstrap a new campaign. Generate a coherent, playable starting point: " +
  "a handful of regions, locations, factions, NPCs and plot threads that " +
  "connect to each other (NPCs belong to factions and locations, plot " +
  "threads involve the factions/NPCs). Keep it concrete and evocative, " +
  "not generic. Do not pad arrays to their maximum length — quality over " +
  "quantity.";

export function buildCampaignBibleUserPrompt(briefing: CampaignBriefing) {
  return [
    `Campaign name: ${briefing.name}`,
    `Game system: ${briefing.system}`,
    `Tone: ${briefing.tone}`,
    `Themes / genre notes: ${briefing.themes}`,
    `Expected number of players: ${briefing.playerCount}`,
  ].join("\n");
}

import { Prisma } from "@/generated/prisma/client";
import {
  buildCampaignContextLines,
  CampaignBibleContext,
} from "./campaign-context";

export type CampaignForSessionPrompt = Prisma.CampaignGetPayload<{
  include: {
    world: true;
    regions: true;
    locations: { include: { region: true } };
    factions: true;
    npcs: { include: { faction: true; location: true } };
    plotThreads: true;
    playerCharacters: true;
    sessions: true;
  };
}>;

export const SESSION_PREP_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master (GM) prepare their next " +
  "session. You are given the campaign's canon (world, factions, NPCs, " +
  "locations, plot threads), the player characters (PCs) with their " +
  "personal backstories, and, if any, prior sessions. Build on what " +
  "already exists — reuse existing NPC and location names verbatim rather " +
  "than inventing new ones unless the GM's notes call for something new. " +
  "Weave in personal hooks tied to PC backstories where it fits naturally " +
  "— an NPC who knew their family, a plot thread that echoes their past — " +
  "rather than treating the PCs as generic adventurers. " +
  "Do not contradict established canon, especially anything marked as " +
  "locked. Keep it concrete and directly usable at the table.";

export function buildSessionPrepUserPrompt(
  campaign: CampaignForSessionPrompt,
  input: { playerStatus: string; focusPlotThreadTitles: string[] },
) {
  const lines = buildCampaignContextLines(campaign);

  if (campaign.playerCharacters.length > 0) {
    lines.push("", "## Player characters");
    for (const pc of campaign.playerCharacters) {
      lines.push(
        `- ${pc.name}${pc.class ? ` (${pc.class})` : ""}: ${pc.backstory ?? pc.summary ?? ""}`,
      );
    }
  }

  const priorSessions = campaign.sessions
    .filter((session) => session.recap)
    .sort((a, b) => a.number - b.number);
  if (priorSessions.length > 0) {
    lines.push("", "## Prior session recaps (chronological)");
    for (const session of priorSessions) {
      lines.push(`- Session ${session.number}: ${session.recap}`);
    }
  }

  lines.push("", "## GM's notes for this session", input.playerStatus);

  if (input.focusPlotThreadTitles.length > 0) {
    lines.push(
      "",
      `## Plot threads to feature this session: ${input.focusPlotThreadTitles.join(", ")}`,
    );
  }

  lines.push(
    "",
    "## Scene detail",
    "Keep scenes concise: a title and a summary are enough. Leave the detailed " +
      "per-scene beat fields (readAloud, stakes, playerApproaches, " +
      "suggestedChecks, exits) empty — the GM fleshes those out later, one " +
      "scene at a time, on demand.",
  );

  return lines.join("\n");
}

export const SCENE_DETAIL_SYSTEM_PROMPT =
  "You are helping a tabletop RPG game master flesh out ONE scene of their " +
  "session into a beat they can run straight from the page. Ground everything " +
  "in the campaign canon and the scene's summary; reuse existing NPC and " +
  "location names verbatim. Do not contradict established canon, especially " +
  "anything marked as locked. Be concrete and directly useful, and answer in " +
  "the same language as the campaign content.";

// Prompt to generate the beat for a single scene of an existing prep, given the
// whole bible plus the session's other scenes (so transitions can reference
// them by title).
export function buildSceneDetailUserPrompt(
  campaign: CampaignBibleContext,
  prep: {
    objectives: string;
    scenes: {
      title: string;
      summary: string;
      locationName: string | null;
      involvedNPCNames: string[];
    }[];
  },
  sceneIndex: number,
) {
  const lines = buildCampaignContextLines(campaign);

  lines.push("", "## Session objectives", prep.objectives);

  lines.push("", "## All scenes this session (for transitions)");
  prep.scenes.forEach((scene, i) => {
    lines.push(`${i + 1}. ${scene.title}`);
  });

  const scene = prep.scenes[sceneIndex];
  lines.push("", `## Scene to detail: ${scene.title}`);
  if (scene.locationName) lines.push(`Location: ${scene.locationName}`);
  if (scene.involvedNPCNames.length > 0) {
    lines.push(`NPCs present: ${scene.involvedNPCNames.join(", ")}`);
  }
  lines.push("", scene.summary);

  lines.push(
    "",
    "Fill readAloud, stakes, playerApproaches (2-4, each with the GM's " +
      "response), suggestedChecks, and exits (referencing the other scenes " +
      "above where it fits).",
  );

  return lines.join("\n");
}

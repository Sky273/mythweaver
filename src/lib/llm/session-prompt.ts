import { Prisma } from "@/generated/prisma/client";
import { buildCampaignContextLines } from "./campaign-context";

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

  return lines.join("\n");
}

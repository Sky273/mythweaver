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
  input: {
    playerStatus: string;
    focusPlotThreadTitles: string[];
    detailLevel: "standard" | "detailed";
  },
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

  if (input.detailLevel === "detailed") {
    lines.push(
      "",
      "## Detail level: DETAILED",
      "Produce an advanced, run-at-the-table prep. Focus on 3-4 strong scenes " +
        "rather than filling all six — each scene is fully fleshed out, so " +
        "depth matters more than breadth. For EACH scene, fill the detailed " +
        "beat fields in addition to the title and summary:",
      "- `readAloud`: a short boxed text (2-4 sentences) to read aloud when " +
        "the scene opens, evoking sights, sounds and mood.",
      "- `stakes`: what is at stake and what happens if the players don't " +
        "engage or fail.",
      "- `playerApproaches`: 2-4 likely ways the players tackle the scene, " +
        "each paired with how the world/NPCs react and the concrete GM move.",
      "- `suggestedChecks`: a few relevant ability checks with a rough " +
        "difficulty, phrased for this system.",
      "- `exits`: how the scene can lead onward (on success, failure, or a " +
        "player choice), pointing to other scenes where possible.",
      "Write these so the GM can run the scene straight from the page, " +
        "without improvising every reaction cold.",
    );
  } else {
    lines.push(
      "",
      "## Detail level: STANDARD",
      "Keep scenes concise: a title and a summary are enough. Leave the " +
        "detailed per-scene beat fields (readAloud, stakes, playerApproaches, " +
        "suggestedChecks, exits) empty.",
    );
  }

  return lines.join("\n");
}

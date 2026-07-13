import { z } from "zod";

// A single anticipated player approach and the GM's response to it — the core
// of the "detailed" per-scene beat: it lets the GM run the scene without
// improvising every reaction cold.
const sceneApproachSchema = z.object({
  approach: z.string().describe("A likely way the players tackle this scene."),
  response: z
    .string()
    .describe(
      "How the NPCs and the world react to that approach, and the concrete GM move to make.",
    ),
});

// Scenes carry a concise base (title/summary/location/NPCs) plus optional
// "detailed" beat fields. The detailed fields are only filled when the GM asks
// for a detailed prep — they're optional so concise preps, older stored preps,
// and the manual editor all remain valid.
const sceneSchema = z.object({
  title: z.string(),
  summary: z.string(),
  locationName: z
    .string()
    .nullable()
    .describe("Should match an existing campaign location name, or null."),
  involvedNPCNames: z
    .array(z.string())
    .describe("Names of existing campaign NPCs appearing in this scene."),
  readAloud: z
    .string()
    .nullish()
    .describe(
      "Boxed text to read aloud to the players when this scene opens. Detailed prep only; null/omitted for a concise prep.",
    ),
  stakes: z
    .string()
    .nullish()
    .describe(
      "What is at stake in this scene and what happens if the players don't engage. Detailed prep only.",
    ),
  playerApproaches: z
    .array(sceneApproachSchema)
    .optional()
    .describe(
      "Two to four anticipated player approaches, each paired with the GM's response. Detailed prep only.",
    ),
  suggestedChecks: z
    .array(z.string())
    .optional()
    .describe(
      "Suggested ability checks with a rough difficulty, e.g. 'Persuasion (DD 15) pour calmer la foule'. Detailed prep only.",
    ),
  exits: z
    .array(z.string())
    .optional()
    .describe(
      "How this scene can transition onward, e.g. 'S'ils refusent → la scène de l'embuscade'. Detailed prep only.",
    ),
});

export const sessionPrepSchema = z.object({
  recapForPlayers: z
    .string()
    .nullable()
    .describe(
      "A short 'previously on...' recap to read aloud at the start of the session, or null for session 1.",
    ),
  objectives: z
    .string()
    .describe(
      "What this session should accomplish narratively. For the GM's eyes only.",
    ),
  openingReadAloud: z
    .string()
    .nullable()
    .describe("Boxed text to read aloud to set the opening scene, or null."),
  scenes: z.array(sceneSchema).max(6),
  keyNPCs: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Should match an existing campaign NPC name when possible."),
        wantsThisSession: z.string(),
        playingTips: z.string(),
      }),
    )
    .max(6),
  hooks: z.array(z.string()).max(5).describe("Hooks to pull players toward the plot."),
  complications: z.array(z.string()).max(5),
});

export type SessionPrep = z.infer<typeof sessionPrepSchema>;
export type SessionScene = z.infer<typeof sceneSchema>;

import { z } from "zod";

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
  scenes: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        locationName: z
          .string()
          .nullable()
          .describe("Should match an existing campaign location name, or null."),
        involvedNPCNames: z
          .array(z.string())
          .describe("Names of existing campaign NPCs appearing in this scene."),
      }),
    )
    .max(6),
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

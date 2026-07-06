import { z } from "zod";

export const sessionUpdateProposalSchema = z.object({
  npcUpdates: z
    .array(
      z.object({
        name: z.string().describe("Must match an existing campaign NPC name."),
        newStatus: z
          .enum(["ALIVE", "DEAD", "MISSING", "UNKNOWN"])
          .nullable()
          .describe("Proposed new status, or null if unchanged."),
        note: z
          .string()
          .nullable()
          .describe("Why this change, or a notable development, or null."),
      }),
    )
    .max(10),
  plotThreadUpdates: z
    .array(
      z.object({
        title: z
          .string()
          .describe("Must match an existing campaign plot thread title."),
        newStatus: z
          .enum(["SEEDED", "ACTIVE", "RESOLVED"])
          .nullable()
          .describe("Proposed new status, or null if unchanged."),
        note: z.string().nullable(),
      }),
    )
    .max(10),
  newNPCs: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        motivations: z.string(),
      }),
    )
    .max(5)
    .describe("Brand new NPCs introduced during play, not yet in the bible."),
  newPlotThreads: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .max(5)
    .describe("Brand new plot threads that emerged during play."),
});

export type SessionUpdateProposal = z.infer<typeof sessionUpdateProposalSchema>;

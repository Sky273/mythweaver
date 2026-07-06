import { z } from "zod";

// Nullable (not optional) throughout: this schema is shared with OpenAI's
// strict structured-output mode, which requires every property to be
// present in `required` — optional fields must be expressed as nullable.
export const campaignBibleSchema = z.object({
  synopsis: z
    .string()
    .describe("A 3-5 sentence pitch of the campaign's central conflict."),
  world: z.object({
    overview: z.string().describe("What the setting is, in a paragraph."),
    history: z.string().nullable().describe("Relevant backstory, or null."),
    cosmology: z
      .string()
      .nullable()
      .describe("Pantheon/cosmic order if relevant to the genre, or null."),
  }),
  regions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .max(6),
  locations: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        regionName: z
          .string()
          .nullable()
          .describe("Must match one of the regions' names above, or null."),
      }),
    )
    .max(10),
  factions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        goals: z.string(),
      }),
    )
    .max(6),
  npcs: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        motivations: z.string(),
        secrets: z.string().nullable(),
        factionName: z
          .string()
          .nullable()
          .describe("Must match one of the factions' names above, or null."),
        locationName: z
          .string()
          .nullable()
          .describe("Must match one of the locations' names above, or null."),
      }),
    )
    .max(12),
  plotThreads: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .max(6),
});

export type CampaignBible = z.infer<typeof campaignBibleSchema>;

import { z } from "zod";

export const regionRegenSchema = z.object({ description: z.string() });
export const locationRegenSchema = z.object({ description: z.string() });
export const factionRegenSchema = z.object({
  description: z.string(),
  goals: z.string(),
});
export const npcRegenSchema = z.object({
  description: z.string(),
  motivations: z.string(),
  secrets: z.string().nullable(),
});
export const plotThreadRegenSchema = z.object({ description: z.string() });

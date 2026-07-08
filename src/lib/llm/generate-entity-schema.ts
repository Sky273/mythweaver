import { z } from "zod";
import { PLAYER_DESCRIPTION_FIELD } from "./player-view";

// Schemas for generating a brand-new bible entity from scratch. Unlike the
// regeneration schemas (which keep the existing name/title), these also ask
// the LLM to invent the name/title for the new entity.
export const regionGenSchema = z.object({
  name: z.string(),
  description: z.string(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const locationGenSchema = z.object({
  name: z.string(),
  description: z.string(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const factionGenSchema = z.object({
  name: z.string(),
  description: z.string(),
  goals: z.string(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const npcGenSchema = z.object({
  name: z.string(),
  description: z.string(),
  motivations: z.string(),
  secrets: z.string().nullable(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const plotThreadGenSchema = z.object({
  title: z.string(),
  description: z.string(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});

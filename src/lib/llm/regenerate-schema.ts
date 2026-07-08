import { z } from "zod";
import { PLAYER_DESCRIPTION_FIELD } from "./player-view";

export const regionRegenSchema = z.object({ description: z.string() });
export const locationRegenSchema = z.object({
  description: z.string(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const factionRegenSchema = z.object({
  description: z.string(),
  goals: z.string(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const npcRegenSchema = z.object({
  description: z.string(),
  motivations: z.string(),
  secrets: z.string().nullable(),
  publicDescription: PLAYER_DESCRIPTION_FIELD,
});
export const plotThreadRegenSchema = z.object({ description: z.string() });

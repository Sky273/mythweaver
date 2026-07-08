import { z } from "zod";

// Shared player-facing description field, produced in the SAME LLM call as the
// GM-facing content (no extra generation). Every entity generation/regeneration
// that supports a player view reuses this field + the instruction below.
export const PLAYER_DESCRIPTION_FIELD = z
  .string()
  .describe(
    "A spoiler-free, player-facing description of this entity: only what " +
      "players could plausibly know or perceive (appearance, public " +
      "reputation, rumours, observable facts). Must NOT reveal secrets, true " +
      "hidden motivations/agendas, or undiscovered plot connections. Written " +
      "in the same language as the rest of the content.",
  );

// Appended to the system prompt of any generation that emits a
// `publicDescription`, so the model knows to author the spoiler-free copy.
export const PLAYER_DESCRIPTION_INSTRUCTION =
  "For the world and every region, location, faction, NPC and plot thread, " +
  "also write a `publicDescription`: a spoiler-free version meant for the " +
  "players' eyes, containing only what they could honestly know or perceive " +
  "(for a plot thread, what the players have heard or suspect — a rumour or " +
  "quest hook, not the resolution). Never leak secrets, true hidden " +
  "motivations, or unrevealed plot twists into `publicDescription`.";

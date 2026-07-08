import { z } from "zod";

// A single rich, GM-facing "how to run this intrigue" text. Kept as one string
// (not structured JSON) so the GM can freely edit it in a plain textarea and
// stays in full control of what ends up in the briefing.
export const plotBriefingSchema = z.object({
  briefing: z
    .string()
    .describe(
      "A SHORT, scannable GM briefing for running this plot thread — about " +
        "200 words, 250 max. Use a few terse lines (bullet-style) under short " +
        "headers such as: Coulisses (what's really going on, incl. secrets), " +
        "Enjeux, Acteurs clés (NPCs/factions + what they want), Faire avancer " +
        "(how to introduce/escalate), Complications. Be dense and actionable, " +
        "no filler, no long prose. GM's eyes only, in the campaign's language.",
    ),
});

import { describe, expect, it } from "vitest";
import { sessionPrepToMarkdown } from "./session-markdown";
import { SessionPrep } from "@/lib/llm/session-schema";

function makePrep(overrides: Partial<SessionPrep>): SessionPrep {
  return {
    recapForPlayers: null,
    objectives: "Installer Valcendre comme capitale mourante.",
    openingReadAloud: null,
    scenes: [],
    keyNPCs: [],
    hooks: [],
    complications: [],
    ...overrides,
  };
}

describe("sessionPrepToMarkdown", () => {
  it("renders the campaign name and session number as a header", () => {
    const markdown = sessionPrepToMarkdown("Les cendres du roi sorcier", 2, makePrep({}));
    expect(markdown).toContain("# Les cendres du roi sorcier — Session 2");
    expect(markdown).toContain("## Objectifs (MJ)");
    expect(markdown).toContain("Installer Valcendre comme capitale mourante.");
  });

  it("omits the players recap and opening read-aloud sections when null", () => {
    const markdown = sessionPrepToMarkdown("Campagne", 1, makePrep({}));
    expect(markdown).not.toContain("## Récap pour les joueurs");
    expect(markdown).not.toContain("## Texte d'ouverture");
  });

  it("blockquotes the opening read-aloud text when present", () => {
    const markdown = sessionPrepToMarkdown(
      "Campagne",
      1,
      makePrep({ openingReadAloud: "La neige grise tombe sur Valcendre." }),
    );
    expect(markdown).toContain("> La neige grise tombe sur Valcendre.");
  });

  it("lists scene titles with their location and involved NPCs", () => {
    const markdown = sessionPrepToMarkdown(
      "Campagne",
      1,
      makePrep({
        scenes: [
          {
            title: "Audience privée",
            summary: "Les PJ rencontrent Ysabeau.",
            locationName: "Le Palais calciné",
            involvedNPCNames: ["Ysabeau", "Odran Vey"],
          },
        ],
      }),
    );

    expect(markdown).toContain("### Audience privée — Le Palais calciné");
    expect(markdown).toContain("PNJ impliqués : Ysabeau, Odran Vey");
  });

  it("lists hooks and complications as bullet points", () => {
    const markdown = sessionPrepToMarkdown(
      "Campagne",
      1,
      makePrep({ hooks: ["Un message urgent"], complications: ["Une trahison"] }),
    );

    expect(markdown).toContain("- Un message urgent");
    expect(markdown).toContain("- Une trahison");
  });
});

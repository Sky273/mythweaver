import { describe, expect, it } from "vitest";
import { buildRandomTableUserPrompt } from "./random-table-prompt";
import { CampaignBibleContext } from "./campaign-context";

function makeCampaign(
  overrides: Partial<CampaignBibleContext>,
): CampaignBibleContext {
  return {
    name: "Les cendres du roi sorcier",
    system: "D&D 5e",
    tone: "Sombre",
    synopsis: null,
    world: null,
    regions: [],
    locations: [],
    factions: [],
    npcs: [],
    plotThreads: [],
    ...overrides,
  } as unknown as CampaignBibleContext;
}

describe("buildRandomTableUserPrompt", () => {
  it("translates a known kind to its English label", () => {
    const prompt = buildRandomTableUserPrompt(
      makeCampaign({}),
      "ENCOUNTER",
      "Rencontres du Bassin des Cendres",
      "",
    );

    expect(prompt).toContain(
      '## Table to generate: "Rencontres du Bassin des Cendres" — a table of random encounters',
    );
  });

  it("falls back to the raw kind string when unrecognized", () => {
    const prompt = buildRandomTableUserPrompt(makeCampaign({}), "WEATHER", "Météo", "");
    expect(prompt).toContain("a table of WEATHER");
  });

  it("includes the specific focus only when provided", () => {
    const withFocus = buildRandomTableUserPrompt(
      makeCampaign({}),
      "LOOT",
      "Butin",
      "Uniquement des reliques funéraires.",
    );
    expect(withFocus).toContain("Specific focus: Uniquement des reliques funéraires.");

    const withoutFocus = buildRandomTableUserPrompt(makeCampaign({}), "LOOT", "Butin", "");
    expect(withoutFocus).not.toContain("Specific focus");
  });
});

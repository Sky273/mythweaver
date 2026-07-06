import { describe, expect, it } from "vitest";
import { buildRegenerateUserPrompt } from "./regenerate-prompt";
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

describe("buildRegenerateUserPrompt", () => {
  it("includes the entity label and its current data", () => {
    const prompt = buildRegenerateUserPrompt(
      makeCampaign({}),
      'NPC "Ysabeau"',
      "Current description: une noble ambitieuse.",
      "",
    );

    expect(prompt).toContain("## Entity to rewrite: NPC \"Ysabeau\"");
    expect(prompt).toContain("Current description: une noble ambitieuse.");
  });

  it("appends the GM's direction only when provided", () => {
    const withInstructions = buildRegenerateUserPrompt(
      makeCampaign({}),
      "Faction \"La Ligue\"",
      "Current description: x",
      "Rends-la plus ambiguë.",
    );
    expect(withInstructions).toContain("## GM's direction for the rewrite: Rends-la plus ambiguë.");

    const withoutInstructions = buildRegenerateUserPrompt(
      makeCampaign({}),
      "Faction \"La Ligue\"",
      "Current description: x",
      "",
    );
    expect(withoutInstructions).not.toContain("GM's direction");
  });

  it("still includes the shared campaign context (locked canon)", () => {
    const campaign = makeCampaign({
      factions: [
        { name: "L'Ordre", description: "Funéraire", goals: "Sceller les morts", locked: true },
      ],
    } as Partial<CampaignBibleContext>);

    const prompt = buildRegenerateUserPrompt(campaign, "NPC \"X\"", "", "");
    expect(prompt).toContain("L'Ordre (canon, locked)");
  });
});

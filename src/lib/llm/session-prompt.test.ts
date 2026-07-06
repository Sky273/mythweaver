import { describe, expect, it } from "vitest";
import { buildSessionPrepUserPrompt, CampaignForSessionPrompt } from "./session-prompt";

function makeCampaign(
  overrides: Partial<CampaignForSessionPrompt>,
): CampaignForSessionPrompt {
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
    playerCharacters: [],
    sessions: [],
    ...overrides,
  } as unknown as CampaignForSessionPrompt;
}

describe("buildSessionPrepUserPrompt", () => {
  it("marks locked entities as canon so the LLM knows not to contradict them", () => {
    const campaign = makeCampaign({
      factions: [
        {
          name: "La Ligue du Lys Noir",
          description: "Milice",
          goals: "Contrôler la ville",
          locked: true,
        },
      ],
    } as Partial<CampaignForSessionPrompt>);

    const prompt = buildSessionPrepUserPrompt(campaign, {
      playerStatus: "Ils arrivent en ville.",
      focusPlotThreadTitles: [],
    });

    expect(prompt).toContain("La Ligue du Lys Noir");
    expect(prompt).toContain("(canon, locked)");
  });

  it("includes player character backstories so sessions can reference them", () => {
    const campaign = makeCampaign({
      playerCharacters: [
        {
          name: "Kael Voss",
          class: "Paladin déchu",
          backstory: "A servi le Roi Sorcier.",
          summary: null,
        },
      ],
    } as Partial<CampaignForSessionPrompt>);

    const prompt = buildSessionPrepUserPrompt(campaign, {
      playerStatus: "Ils arrivent en ville.",
      focusPlotThreadTitles: [],
    });

    expect(prompt).toContain("Kael Voss");
    expect(prompt).toContain("Paladin déchu");
    expect(prompt).toContain("A servi le Roi Sorcier.");
  });

  it("includes the GM notes and focused plot threads", () => {
    const campaign = makeCampaign({});

    const prompt = buildSessionPrepUserPrompt(campaign, {
      playerStatus: "Les joueurs fuient la ville.",
      focusPlotThreadTitles: ["La couronne de suie"],
    });

    expect(prompt).toContain("Les joueurs fuient la ville.");
    expect(prompt).toContain("La couronne de suie");
  });

  it("only includes sessions that have a recap, in chronological order", () => {
    const campaign = makeCampaign({
      sessions: [
        { number: 2, recap: "Deuxième session." },
        { number: 1, recap: "Première session." },
        { number: 3, recap: null },
      ],
    } as Partial<CampaignForSessionPrompt>);

    const prompt = buildSessionPrepUserPrompt(campaign, {
      playerStatus: "",
      focusPlotThreadTitles: [],
    });

    const firstIndex = prompt.indexOf("Première session.");
    const secondIndex = prompt.indexOf("Deuxième session.");
    expect(firstIndex).toBeGreaterThan(-1);
    expect(secondIndex).toBeGreaterThan(firstIndex);
    expect(prompt).not.toContain("Session 3");
  });
});

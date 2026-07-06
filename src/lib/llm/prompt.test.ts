import { describe, expect, it } from "vitest";
import { buildCampaignBibleUserPrompt } from "./prompt";

describe("buildCampaignBibleUserPrompt", () => {
  it("includes every briefing field", () => {
    const prompt = buildCampaignBibleUserPrompt({
      name: "Les cendres du roi sorcier",
      system: "D&D 5e",
      tone: "Sombre",
      themes: "Guerre civile, nécromancie",
      playerCount: 4,
    });

    expect(prompt).toContain("Campaign name: Les cendres du roi sorcier");
    expect(prompt).toContain("Game system: D&D 5e");
    expect(prompt).toContain("Tone: Sombre");
    expect(prompt).toContain("Themes / genre notes: Guerre civile, nécromancie");
    expect(prompt).toContain("Expected number of players: 4");
  });
});

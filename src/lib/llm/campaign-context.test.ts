import { describe, expect, it } from "vitest";
import { buildCampaignContextLines, CampaignBibleContext } from "./campaign-context";

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

describe("buildCampaignContextLines", () => {
  it("includes the campaign name, system and tone", () => {
    const lines = buildCampaignContextLines(makeCampaign({}));
    expect(lines.join("\n")).toContain(
      "Campaign: Les cendres du roi sorcier (D&D 5e)",
    );
    expect(lines.join("\n")).toContain("Tone: Sombre");
  });

  it("marks locked factions/locations/npcs/plot threads as canon", () => {
    const campaign = makeCampaign({
      factions: [
        { name: "La Ligue du Lys Noir", description: "Milice", goals: "Contrôler", locked: true },
      ],
      npcs: [
        { name: "Ysabeau", status: "ALIVE", locked: true, faction: null, location: null, description: "", motivations: "" },
      ],
      plotThreads: [
        { title: "La couronne de suie", status: "ACTIVE", locked: true, description: "" },
      ],
    } as Partial<CampaignBibleContext>);

    const text = buildCampaignContextLines(campaign).join("\n");
    expect(text).toContain("La Ligue du Lys Noir (canon, locked)");
    expect(text).toContain("Ysabeau [ALIVE] (canon, locked)");
    expect(text).toContain("La couronne de suie [ACTIVE] (canon, locked)");
  });

  it("does not mark unlocked entities as canon", () => {
    const campaign = makeCampaign({
      factions: [
        { name: "Les Masques Gris", description: "", goals: "", locked: false },
      ],
    } as Partial<CampaignBibleContext>);

    const text = buildCampaignContextLines(campaign).join("\n");
    expect(text).toContain("Les Masques Gris:");
    expect(text).not.toContain("Les Masques Gris (canon, locked)");
  });

  it("omits sections for empty collections", () => {
    const text = buildCampaignContextLines(makeCampaign({})).join("\n");
    expect(text).not.toContain("## Factions");
    expect(text).not.toContain("## NPCs");
    expect(text).not.toContain("## Plot threads");
  });
});

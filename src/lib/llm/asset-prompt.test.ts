import { describe, expect, it } from "vitest";
import {
  buildDocumentImagePrompt,
  buildMapImagePrompt,
  CampaignForAssetPrompt,
} from "./asset-prompt";

function makeCampaign(
  overrides: Partial<CampaignForAssetPrompt>,
): CampaignForAssetPrompt {
  return {
    name: "Les cendres du roi sorcier",
    system: "D&D 5e",
    tone: "Sombre",
    world: null,
    regions: [],
    locations: [],
    ...overrides,
  } as unknown as CampaignForAssetPrompt;
}

describe("buildMapImagePrompt", () => {
  it("lists every region and its nested locations by name", () => {
    const campaign = makeCampaign({
      regions: [{ id: "r1", name: "La Marche Noire", description: "Frontière brûlée" }],
      locations: [
        {
          name: "La Citadelle Calcinée",
          description: "Ruines noires",
          region: { id: "r1", name: "La Marche Noire" },
        },
      ],
    } as Partial<CampaignForAssetPrompt>);

    const prompt = buildMapImagePrompt(campaign, "");

    expect(prompt).toContain("La Marche Noire");
    expect(prompt).toContain("La Citadelle Calcinée");
  });

  it("lists locations with no region separately", () => {
    const campaign = makeCampaign({
      locations: [
        { name: "Île isolée", description: "Sans région", region: null },
      ],
    } as Partial<CampaignForAssetPrompt>);

    const prompt = buildMapImagePrompt(campaign, "");

    expect(prompt).toContain("Île isolée");
    expect(prompt).toContain("Other notable locations");
  });

  it("appends the GM's additional direction when provided", () => {
    const campaign = makeCampaign({});

    const prompt = buildMapImagePrompt(campaign, "Style aquarelle.");

    expect(prompt).toContain("Style aquarelle.");
  });
});

describe("buildDocumentImagePrompt", () => {
  it("includes the campaign name and the GM's prompt", () => {
    const campaign = makeCampaign({});

    const prompt = buildDocumentImagePrompt(campaign, "Une lettre scellée.");

    expect(prompt).toContain("Les cendres du roi sorcier");
    expect(prompt).toContain("Une lettre scellée.");
  });
});

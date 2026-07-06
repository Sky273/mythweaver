import { describe, expect, it } from "vitest";
import { campaignBibleToMarkdown } from "./bible-markdown";
import { CampaignWithRelations } from "@/app/campaigns/[id]/campaign-bible-view";

function makeCampaign(
  overrides: Partial<CampaignWithRelations>,
): CampaignWithRelations {
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
    ...overrides,
  } as unknown as CampaignWithRelations;
}

describe("campaignBibleToMarkdown", () => {
  it("renders the campaign name, system and tone as a header", () => {
    const markdown = campaignBibleToMarkdown(makeCampaign({}));
    expect(markdown).toContain("# Les cendres du roi sorcier");
    expect(markdown).toContain("D&D 5e");
    expect(markdown).toContain("Ton : Sombre");
  });

  it("labels NPC status and plot thread status in French", () => {
    const campaign = makeCampaign({
      npcs: [
        { name: "Ysabeau", status: "DEAD", description: "", motivations: null, secrets: null, faction: null, location: null },
      ],
      plotThreads: [
        { title: "La couronne de suie", status: "RESOLVED", description: "" },
      ],
    } as Partial<CampaignWithRelations>);

    const markdown = campaignBibleToMarkdown(campaign);
    expect(markdown).toContain("### Ysabeau [Mort]");
    expect(markdown).toContain("### La couronne de suie [Résolue]");
  });

  it("omits sections for empty collections", () => {
    const markdown = campaignBibleToMarkdown(makeCampaign({}));
    expect(markdown).not.toContain("## Factions");
    expect(markdown).not.toContain("## PNJ");
    expect(markdown).not.toContain("## Personnages joueurs");
  });

  it("qualifies locations with their region name", () => {
    const campaign = makeCampaign({
      locations: [
        { name: "Valcendre", description: "Capitale", region: { name: "Le Bassin des Cendres" } },
      ],
    } as Partial<CampaignWithRelations>);

    const markdown = campaignBibleToMarkdown(campaign);
    expect(markdown).toContain("### Valcendre — Le Bassin des Cendres");
  });
});

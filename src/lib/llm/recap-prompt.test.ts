import { describe, expect, it } from "vitest";
import { buildRecapAnalysisUserPrompt, CampaignForRecapPrompt } from "./recap-prompt";

function makeCampaign(
  overrides: Partial<CampaignForRecapPrompt>,
): CampaignForRecapPrompt {
  return {
    npcs: [],
    plotThreads: [],
    ...overrides,
  } as unknown as CampaignForRecapPrompt;
}

describe("buildRecapAnalysisUserPrompt", () => {
  it("marks locked NPCs and plot threads as canon", () => {
    const campaign = makeCampaign({
      npcs: [{ name: "Ysabeau", status: "ALIVE", locked: true }],
      plotThreads: [{ title: "La couronne de suie", status: "ACTIVE", locked: true }],
    } as Partial<CampaignForRecapPrompt>);

    const prompt = buildRecapAnalysisUserPrompt(campaign, "Rien de spécial.");

    expect(prompt).toContain("Ysabeau");
    expect(prompt).toContain("La couronne de suie");
    expect(prompt.match(/\(canon, locked\)/g)).toHaveLength(2);
  });

  it("includes the GM's recap verbatim", () => {
    const campaign = makeCampaign({});
    const recap = "Les joueurs ont vaincu le PNJ et résolu l'intrigue.";

    const prompt = buildRecapAnalysisUserPrompt(campaign, recap);

    expect(prompt).toContain(recap);
  });
});

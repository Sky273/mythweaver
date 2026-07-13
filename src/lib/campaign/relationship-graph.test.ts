import { describe, expect, it } from "vitest";
import { buildRelationshipGraph } from "./relationship-graph";

const campaignId = "camp1";

describe("buildRelationshipGraph", () => {
  it("creates one type-prefixed node per entity", () => {
    const graph = buildRelationshipGraph(campaignId, {
      regions: [{ id: "r1", name: "Nord", parentId: null }],
      locations: [{ id: "l1", name: "Valcendre", regionId: "r1" }],
      factions: [{ id: "f1", name: "La Ligue" }],
      npcs: [
        {
          id: "n1",
          name: "Ysabeau",
          status: "ALIVE",
          factionId: "f1",
          locationId: "l1",
        },
      ],
    });

    expect(graph.nodes.map((n) => n.id).sort()).toEqual([
      "faction:f1",
      "location:l1",
      "npc:n1",
      "region:r1",
    ]);
    const npc = graph.nodes.find((n) => n.id === "npc:n1");
    expect(npc?.sub).toBe("En vie");
    expect(npc?.href).toBe(`/campaigns/${campaignId}/npcs/n1/edit`);
  });

  it("links every real FK relation", () => {
    const graph = buildRelationshipGraph(campaignId, {
      regions: [
        { id: "r1", name: "Nord", parentId: null },
        { id: "r2", name: "Bassin", parentId: "r1" },
      ],
      locations: [{ id: "l1", name: "Valcendre", regionId: "r2" }],
      factions: [{ id: "f1", name: "La Ligue" }],
      npcs: [
        {
          id: "n1",
          name: "Ysabeau",
          status: "ALIVE",
          factionId: "f1",
          locationId: "l1",
        },
      ],
    });

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { source: "region:r2", target: "region:r1", label: "sous-région de" },
        { source: "location:l1", target: "region:r2", label: "situé dans" },
        { source: "npc:n1", target: "faction:f1", label: "membre" },
        { source: "npc:n1", target: "location:l1", label: "présent" },
      ]),
    );
    expect(graph.edges).toHaveLength(4);
  });

  it("skips edges to missing targets and null FKs", () => {
    const graph = buildRelationshipGraph(campaignId, {
      regions: [],
      locations: [{ id: "l1", name: "Orpheline", regionId: "ghost" }],
      factions: [],
      npcs: [
        {
          id: "n1",
          name: "Errant",
          status: "UNKNOWN",
          factionId: null,
          locationId: null,
        },
      ],
    });

    expect(graph.edges).toHaveLength(0);
  });

  it("returns an empty graph for an empty campaign", () => {
    const graph = buildRelationshipGraph(campaignId, {
      regions: [],
      locations: [],
      factions: [],
      npcs: [],
    });
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });
});

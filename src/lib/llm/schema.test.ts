import { describe, expect, it } from "vitest";
import { campaignBibleSchema } from "./schema";
import { sessionPrepSchema } from "./session-schema";
import { sessionUpdateProposalSchema } from "./recap-schema";

describe("campaignBibleSchema", () => {
  it("accepts a minimal valid campaign bible", () => {
    const result = campaignBibleSchema.safeParse({
      synopsis: "Une guerre civile déchire le royaume.",
      world: { overview: "Un royaume gothique.", history: null, cosmology: null },
      regions: [],
      locations: [],
      factions: [],
      npcs: [],
      plotThreads: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a bible missing required fields", () => {
    const result = campaignBibleSchema.safeParse({ synopsis: "Incomplet" });

    expect(result.success).toBe(false);
  });

  it("rejects a location using undefined instead of null for regionName", () => {
    const result = campaignBibleSchema.safeParse({
      synopsis: "x",
      world: { overview: "x", history: null, cosmology: null },
      regions: [],
      locations: [{ name: "Valcendre", description: "x" }],
      factions: [],
      npcs: [],
      plotThreads: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionPrepSchema", () => {
  it("accepts a minimal valid session prep", () => {
    const result = sessionPrepSchema.safeParse({
      recapForPlayers: null,
      objectives: "Introduire Valcendre.",
      openingReadAloud: null,
      scenes: [],
      keyNPCs: [],
      hooks: [],
      complications: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects more than 6 scenes", () => {
    const scene = {
      title: "x",
      summary: "x",
      locationName: null,
      involvedNPCNames: [],
    };
    const result = sessionPrepSchema.safeParse({
      recapForPlayers: null,
      objectives: "x",
      openingReadAloud: null,
      scenes: Array(7).fill(scene),
      keyNPCs: [],
      hooks: [],
      complications: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("sessionUpdateProposalSchema", () => {
  it("accepts a proposal with npc/plot updates and new entities", () => {
    const result = sessionUpdateProposalSchema.safeParse({
      playerRecap: "Les héros ont vaincu la garde de Valcendre.",
      npcUpdates: [
        { name: "Ysabeau", newStatus: "DEAD", note: "Tuée en session." },
      ],
      plotThreadUpdates: [
        { title: "La couronne de suie", newStatus: "RESOLVED", note: null },
      ],
      newNPCs: [],
      newPlotThreads: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid NPC status value", () => {
    const result = sessionUpdateProposalSchema.safeParse({
      npcUpdates: [{ name: "x", newStatus: "ZOMBIFIED", note: null }],
      plotThreadUpdates: [],
      newNPCs: [],
      newPlotThreads: [],
    });

    expect(result.success).toBe(false);
  });
});

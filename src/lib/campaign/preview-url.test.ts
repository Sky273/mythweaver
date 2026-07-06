import { describe, expect, it } from "vitest";
import { buildPreviewUrl } from "./preview-url";

describe("buildPreviewUrl", () => {
  it("strips the campaignId prefix from the stored file path", () => {
    const url = buildPreviewUrl("camp1", "camp1/abc123.png");
    expect(url).toBe("/campaigns/camp1/preview/abc123.png");
  });

  it("appends title/back/backLabel as query params when provided", () => {
    const url = buildPreviewUrl("camp1", "camp1/abc123.png", {
      title: "Ysabeau de Merlefort",
      back: "/campaigns/camp1#npcs",
      backLabel: "Les cendres du roi sorcier",
    });

    const parsed = new URL(url, "http://localhost");
    expect(parsed.pathname).toBe("/campaigns/camp1/preview/abc123.png");
    expect(parsed.searchParams.get("title")).toBe("Ysabeau de Merlefort");
    expect(parsed.searchParams.get("back")).toBe("/campaigns/camp1#npcs");
    expect(parsed.searchParams.get("backLabel")).toBe("Les cendres du roi sorcier");
  });

  it("omits the query string entirely when no options are given", () => {
    const url = buildPreviewUrl("camp1", "camp1/abc123.png");
    expect(url).not.toContain("?");
  });
});

import { describe, expect, it } from "vitest";
import { computeRemainingQuota, startOfCurrentMonth } from "./quota";

describe("computeRemainingQuota", () => {
  it("subtracts used from the limit", () => {
    expect(computeRemainingQuota(10, 50)).toBe(40);
  });

  it("never goes below zero", () => {
    expect(computeRemainingQuota(60, 50)).toBe(0);
  });

  it("returns the full limit when nothing was used", () => {
    expect(computeRemainingQuota(0, 50)).toBe(50);
  });
});

describe("startOfCurrentMonth", () => {
  it("returns midnight on the first day of the given month", () => {
    const result = startOfCurrentMonth(new Date("2026-07-15T14:30:00"));
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getMonth()).toBe(6); // July (0-indexed)
  });
});

import { describe, expect, it } from "vitest";
import { clampHP, computeNextTurn, sortCombatants } from "./encounter-order";

function combatant(id: string, initiative: number, createdAt: string) {
  return { id, initiative, createdAt: new Date(createdAt) };
}

describe("sortCombatants", () => {
  it("orders by initiative descending", () => {
    const combatants = [
      combatant("a", 10, "2026-01-01T00:00:00"),
      combatant("b", 20, "2026-01-01T00:00:01"),
      combatant("c", 15, "2026-01-01T00:00:02"),
    ];
    expect(sortCombatants(combatants).map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by creation order", () => {
    const combatants = [
      combatant("a", 10, "2026-01-01T00:00:02"),
      combatant("b", 10, "2026-01-01T00:00:00"),
      combatant("c", 10, "2026-01-01T00:00:01"),
    ];
    expect(sortCombatants(combatants).map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const combatants = [combatant("a", 10, "2026-01-01"), combatant("b", 20, "2026-01-01")];
    sortCombatants(combatants);
    expect(combatants.map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("computeNextTurn", () => {
  const combatants = [
    combatant("a", 20, "2026-01-01T00:00:00"),
    combatant("b", 15, "2026-01-01T00:00:01"),
    combatant("c", 10, "2026-01-01T00:00:02"),
  ];

  it("picks the highest initiative when there is no current turn", () => {
    expect(computeNextTurn(combatants, null)).toEqual({
      nextId: "a",
      roundIncremented: false,
    });
  });

  it("advances to the next combatant in initiative order", () => {
    expect(computeNextTurn(combatants, "a")).toEqual({
      nextId: "b",
      roundIncremented: false,
    });
  });

  it("wraps to the top of the order and increments the round", () => {
    expect(computeNextTurn(combatants, "c")).toEqual({
      nextId: "a",
      roundIncremented: true,
    });
  });

  it("falls back to the top of the order if the current combatant is gone", () => {
    expect(computeNextTurn(combatants, "missing")).toEqual({
      nextId: "a",
      roundIncremented: false,
    });
  });

  it("returns null when there are no combatants", () => {
    expect(computeNextTurn([], null)).toEqual({
      nextId: null,
      roundIncremented: false,
    });
  });
});

describe("clampHP", () => {
  it("does not go below zero", () => {
    expect(clampHP(-5, 20)).toBe(0);
  });

  it("does not exceed maxHP when set", () => {
    expect(clampHP(25, 20)).toBe(20);
  });

  it("has no upper bound when maxHP is null", () => {
    expect(clampHP(999, null)).toBe(999);
  });

  it("passes through values within range", () => {
    expect(clampHP(12, 20)).toBe(12);
  });
});

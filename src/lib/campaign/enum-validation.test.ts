import { describe, expect, it } from "vitest";
import { parseRequiredEnum } from "./enum-validation";

type Status = "ALIVE" | "DEAD";
const STATUSES: readonly Status[] = ["ALIVE", "DEAD"];

describe("parseRequiredEnum", () => {
  it("returns the value when it is a valid member", () => {
    expect(parseRequiredEnum("DEAD", STATUSES, "ALIVE", "Le statut")).toBe("DEAD");
  });

  it("falls back when the field is missing (null)", () => {
    expect(parseRequiredEnum(null, STATUSES, "ALIVE", "Le statut")).toBe("ALIVE");
  });

  it("throws a labeled error for a tampered/invalid value", () => {
    expect(() => parseRequiredEnum("HAUNTED", STATUSES, "ALIVE", "Le statut")).toThrow(
      "Le statut invalide.",
    );
  });
});

import { describe, expect, it } from "vitest";
import OpenAI from "openai";
import { translateImageGenerationError } from "./image";

// OpenAI's API returns { error: { message, type, code } }; the SDK builds
// APIError#message from that nested `error.message` when the body is present.
function makeAPIError(status: number, message: string) {
  return new OpenAI.APIError(status, { message }, undefined, new Headers());
}

describe("translateImageGenerationError", () => {
  it("extracts the safety category and produces an actionable French message", () => {
    const error = makeAPIError(
      400,
      "Your request was rejected by the safety system. safety_violations=[sexual].",
    );

    const translated = translateImageGenerationError(error);

    expect(translated.message).toContain("sexual");
    expect(translated.message).toContain("Modifie la description");
  });

  it("falls back to a generic message when no category is present", () => {
    const error = makeAPIError(400, "Your request was rejected by the safety system.");

    const translated = translateImageGenerationError(error);

    expect(translated.message).toContain("jugé inapproprié");
  });

  it("translates a 429 rate-limit error into an actionable French message", () => {
    const rateLimitError = makeAPIError(429, "Rate limit exceeded");

    const translated = translateImageGenerationError(rateLimitError);

    expect(translated).not.toBe(rateLimitError);
    expect(translated.message).toContain("Trop de générations");
    expect(translated.message).toContain("Patiente");
  });

  it("translates a 5xx API error into a retry message", () => {
    const serverError = makeAPIError(503, "Service unavailable");

    expect(translateImageGenerationError(serverError).message).toContain(
      "erreur temporaire",
    );
  });

  it("passes through non-API errors unchanged", () => {
    const original = new Error("network down");

    expect(translateImageGenerationError(original)).toBe(original);
  });
});

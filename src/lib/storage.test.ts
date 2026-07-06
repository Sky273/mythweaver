import { describe, expect, it } from "vitest";
import {
  contentTypeForExtension,
  extensionForMimeType,
  resolveUploadPath,
} from "./storage";

describe("resolveUploadPath", () => {
  it("resolves a normal relative path inside the uploads root", () => {
    expect(() => resolveUploadPath("campaign123/file.png")).not.toThrow();
  });

  it("rejects a path-traversal attempt with ..", () => {
    expect(() => resolveUploadPath("../../etc/passwd")).toThrow(
      "Invalid upload path.",
    );
  });

  it("rejects an absolute path escaping the uploads root", () => {
    expect(() => resolveUploadPath("/etc/passwd")).toThrow(
      "Invalid upload path.",
    );
  });

  it("rejects a traversal attempt nested inside a campaign folder", () => {
    expect(() =>
      resolveUploadPath("campaign123/../../../etc/passwd"),
    ).toThrow("Invalid upload path.");
  });
});

describe("contentTypeForExtension", () => {
  it("maps known extensions to their MIME type", () => {
    expect(contentTypeForExtension("pdf")).toBe("application/pdf");
    expect(contentTypeForExtension("PNG")).toBe("image/png");
  });

  it("falls back to octet-stream for unknown extensions", () => {
    expect(contentTypeForExtension("exe")).toBe("application/octet-stream");
  });
});

describe("extensionForMimeType", () => {
  it("maps a known MIME type back to an extension", () => {
    expect(extensionForMimeType("application/pdf")).toBe("pdf");
  });

  it("falls back to bin for unknown MIME types", () => {
    expect(extensionForMimeType("application/x-nonsense")).toBe("bin");
  });
});

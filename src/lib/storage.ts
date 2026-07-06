import { randomUUID } from "node:crypto";
import { del, list, put } from "@vercel/blob";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

export function contentTypeForExtension(extension: string) {
  return CONTENT_TYPES[extension.toLowerCase()] ?? "application/octet-stream";
}

export function extensionForMimeType(mimeType: string) {
  const entry = Object.entries(CONTENT_TYPES).find(
    ([, value]) => value === mimeType,
  );
  return entry?.[0] ?? "bin";
}

// relativePath must be a "<campaignId>/<filename>" path, as returned by
// saveFile. Throws if it looks like a traversal attempt — belt and suspenders
// alongside the same check already done in the files/[...path] route.
export function assertSafeRelativePath(relativePath: string) {
  if (relativePath.includes("..") || relativePath.startsWith("/")) {
    throw new Error("Invalid upload path.");
  }
}

// Stores a file in Vercel Blob under <campaignId>/<uuid>.<ext> and returns
// that pathname to persist on the owning record. Kept as a plain relative
// pathname (not the full blob URL) so every caller that already stores/reads
// this value in the DB and reconstructs `/campaigns/{id}/files/...` URLs
// from it keeps working unchanged.
export async function saveFile(
  campaignId: string,
  buffer: Buffer,
  extension: string,
) {
  const filename = `${randomUUID()}.${extension}`;
  const relativePath = `${campaignId}/${filename}`;
  assertSafeRelativePath(relativePath);

  await put(relativePath, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: contentTypeForExtension(extension),
  });

  return relativePath;
}

async function findBlobUrl(relativePath: string) {
  const { blobs } = await list({ prefix: relativePath, limit: 1 });
  return blobs[0]?.url;
}

export async function readUploadedFile(relativePath: string): Promise<Buffer> {
  assertSafeRelativePath(relativePath);

  const url = await findBlobUrl(relativePath);
  if (!url) throw new Error("File not found.");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch file.");

  return Buffer.from(await response.arrayBuffer());
}

export async function deleteFile(relativePath: string) {
  assertSafeRelativePath(relativePath);

  const url = await findBlobUrl(relativePath);
  if (url) await del(url);
}

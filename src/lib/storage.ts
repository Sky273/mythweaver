import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

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

// Stores a file under uploads/<campaignId>/<uuid>.<ext> and returns the
// relative path to persist on the owning record.
export async function saveFile(
  campaignId: string,
  buffer: Buffer,
  extension: string,
) {
  const dir = path.join(UPLOADS_ROOT, campaignId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(dir, filename), buffer);

  return `${campaignId}/${filename}`;
}

// relativePath must be a "<campaignId>/<filename>" path as returned by
// saveFile. Throws if it tries to escape the uploads root.
export function resolveUploadPath(relativePath: string) {
  const resolved = path.resolve(UPLOADS_ROOT, relativePath);
  if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) {
    throw new Error("Invalid upload path.");
  }
  return resolved;
}

export async function readUploadedFile(relativePath: string) {
  return readFile(resolveUploadPath(relativePath));
}

export async function deleteFile(relativePath: string) {
  await rm(resolveUploadPath(relativePath), { force: true });
}

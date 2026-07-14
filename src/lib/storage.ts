import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Vercel Blob needs a store token, which only exists in the deployed
// environment. When it's absent (local `npm run dev`), fall back to storing
// bytes in Postgres (the StoredFile table) so imagery/uploads work fully
// offline. Same "<campaignId>/<uuid>.<ext>" pathnames either way, so nothing
// downstream (DB records, /files URLs) changes.
function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

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
//
// access: "private" — files are never reachable by a bare public URL; every
// read goes through get() below, which authenticates with the store's token,
// so the app's own requireCampaignAccess() gate (in the files/[...path]
// route) stays the only way in. This also has to match how the Blob store
// itself is provisioned: a store is public-only or private-only, and
// mismatching throws "Cannot use public access on a private store."
export async function saveFile(
  campaignId: string,
  buffer: Buffer,
  extension: string,
) {
  const filename = `${randomUUID()}.${extension}`;
  const relativePath = `${campaignId}/${filename}`;
  assertSafeRelativePath(relativePath);
  const contentType = contentTypeForExtension(extension);

  if (!isBlobConfigured()) {
    await prisma.storedFile.create({
      data: { pathname: relativePath, data: new Uint8Array(buffer), contentType },
    });
    return relativePath;
  }

  await put(relativePath, buffer, {
    access: "private",
    addRandomSuffix: false,
    contentType,
  });

  return relativePath;
}

export async function readUploadedFile(relativePath: string): Promise<Buffer> {
  assertSafeRelativePath(relativePath);

  if (!isBlobConfigured()) {
    const stored = await prisma.storedFile.findUnique({
      where: { pathname: relativePath },
    });
    if (!stored) throw new Error("File not found.");
    return Buffer.from(stored.data);
  }

  const result = await get(relativePath, { access: "private" });
  if (!result) throw new Error("File not found.");

  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFile(relativePath: string) {
  assertSafeRelativePath(relativePath);

  if (!isBlobConfigured()) {
    // Ignore a missing row so deletes stay idempotent, like Blob's del().
    await prisma.storedFile
      .delete({ where: { pathname: relativePath } })
      .catch(() => undefined);
    return;
  }

  await del(relativePath);
}

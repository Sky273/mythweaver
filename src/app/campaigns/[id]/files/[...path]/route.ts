import { notFound } from "next/navigation";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import {
  contentTypeForExtension,
  readUploadedFile,
} from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> },
) {
  const { id: campaignId, path: pathSegments } = await params;
  await requireCampaignAccess(campaignId);

  if (pathSegments.some((segment) => segment.includes(".."))) {
    notFound();
  }

  const relativePath = `${campaignId}/${pathSegments.join("/")}`;
  const extension = pathSegments.at(-1)?.split(".").pop() ?? "";

  let buffer: Buffer;
  try {
    buffer = await readUploadedFile(relativePath);
  } catch {
    notFound();
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypeForExtension(extension),
      // Uploaded files have immutable UUID names, so once fetched they never
      // change. Cache them in the (authenticated) browser for a year — this
      // stops the campaign bible from re-hitting this function (and its auth
      // DB query + Blob fetch) for every portrait/crest on each navigation.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

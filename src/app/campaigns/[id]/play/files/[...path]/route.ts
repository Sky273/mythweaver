import { notFound } from "next/navigation";
import { requirePlayerAccess } from "@/lib/campaign/authorize";
import { prisma } from "@/lib/prisma";
import { contentTypeForExtension, readUploadedFile } from "@/lib/storage";

// Player-facing file route: serves an uploaded image ONLY if it belongs to a
// currently-revealed entity or asset. Unlike the GM file route, being a
// collaborator is not enough — the path must map to revealed, player-safe
// content, so unrevealed portraits/crests/handouts never leak to players.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> },
) {
  const { id: campaignId, path: pathSegments } = await params;
  await requirePlayerAccess(campaignId);

  if (pathSegments.some((segment) => segment.includes(".."))) {
    notFound();
  }

  const relativePath = `${campaignId}/${pathSegments.join("/")}`;

  const [npc, faction, location, asset] = await Promise.all([
    prisma.nPC.findFirst({
      where: { campaignId, revealed: true, portraitPath: relativePath },
      select: { id: true },
    }),
    prisma.faction.findFirst({
      where: { campaignId, revealed: true, crestPath: relativePath },
      select: { id: true },
    }),
    prisma.location.findFirst({
      where: { campaignId, revealed: true, imagePath: relativePath },
      select: { id: true },
    }),
    prisma.campaignAsset.findFirst({
      where: { campaignId, revealed: true, filePath: relativePath },
      select: { id: true },
    }),
  ]);

  if (!npc && !faction && !location && !asset) notFound();

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
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

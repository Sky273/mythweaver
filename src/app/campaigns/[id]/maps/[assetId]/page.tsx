import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { prisma } from "@/lib/prisma";
import { BackLink } from "@/components/back-link";
import { MapPinEditor } from "./map-pin-editor";

export default async function CampaignMapPage({
  params,
}: {
  params: Promise<{ id: string; assetId: string }>;
}) {
  const { id: campaignId, assetId } = await params;
  const campaign = await requireCampaignOwnership(campaignId);

  const asset = await prisma.campaignAsset.findUnique({
    where: { id: assetId, campaignId },
    include: {
      pins: { include: { location: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!asset) notFound();

  const locations = await prisma.location.findMany({
    where: { campaignId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const imageSrc = `/campaigns/${campaignId}/files/${asset.filePath.split("/")[1]}`;
  const pins = asset.pins.map((pin) => ({
    id: pin.id,
    x: pin.x,
    y: pin.y,
    label: pin.label,
    revealed: pin.revealed,
    location: { id: pin.location.id, name: pin.location.name },
  }));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <BackLink href={`/campaigns/${campaignId}`} label={campaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">{asset.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Place des points sur la carte et relie-les aux lieux de ta bible — ils
        deviennent cliquables.
      </p>

      {locations.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Ajoute d&apos;abord des lieux à ta{" "}
          <Link
            href={`/campaigns/${campaignId}#locations`}
            className="text-primary hover:underline"
          >
            bible
          </Link>{" "}
          pour pouvoir les épingler.
        </p>
      ) : (
        <div className="mt-6">
          <MapPinEditor
            campaignId={campaignId}
            assetId={assetId}
            imageSrc={imageSrc}
            pins={pins}
            locations={locations}
          />
        </div>
      )}
    </main>
  );
}

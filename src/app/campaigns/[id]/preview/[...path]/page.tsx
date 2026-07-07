import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { BackLink } from "@/components/back-link";
import { ImageLightbox } from "@/components/image-lightbox";

export default async function ImagePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; path: string[] }>;
  searchParams: Promise<{ title?: string; back?: string; backLabel?: string }>;
}) {
  const { id: campaignId, path: pathSegments } = await params;
  const { title, back, backLabel } = await searchParams;
  await requireCampaignAccess(campaignId);

  const src = `/campaigns/${campaignId}/files/${pathSegments.join("/")}`;
  const backHref = back || `/campaigns/${campaignId}`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <BackLink href={backHref} label={backLabel || "Retour"} />
      {title && <h1 className="mt-4 text-xl font-semibold">{title}</h1>}
      <ImageLightbox src={src} alt={title ?? ""} />
      <p className="mt-2 text-xs text-muted print:hidden">
        Clique sur l&apos;image pour l&apos;ouvrir en plein écran.
      </p>
    </main>
  );
}

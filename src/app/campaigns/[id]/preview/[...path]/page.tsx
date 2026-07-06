import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { BackLink } from "@/components/back-link";

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title ?? ""}
        className="mt-6 w-full rounded-lg border border-gray-200 dark:border-gray-800"
      />
    </main>
  );
}

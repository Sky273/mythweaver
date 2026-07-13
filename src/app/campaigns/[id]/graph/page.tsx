import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { BackLink } from "@/components/back-link";
import { buildRelationshipGraph } from "@/lib/campaign/relationship-graph";
import { RelationshipGraphView } from "./relationship-graph-view";

// GM / co-GM tool: an interactive map of how the bible's entities connect
// (NPCs to their factions and locations, locations to their regions, region
// hierarchy). Reads only structural relations, no secrets, but stays behind
// requireCampaignAccess like the rest of the GM bible.
export default async function RelationshipGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  await requireCampaignAccess(campaignId);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      name: true,
      regions: { select: { id: true, name: true, parentId: true } },
      locations: { select: { id: true, name: true, regionId: true } },
      factions: { select: { id: true, name: true } },
      npcs: {
        select: {
          id: true,
          name: true,
          status: true,
          factionId: true,
          locationId: true,
        },
      },
    },
  });

  if (!campaign) notFound();

  const graph = buildRelationshipGraph(campaignId, campaign);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <BackLink href={`/campaigns/${campaignId}`} label={campaign.name} />
      <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
        Graphe des relations
      </h1>
      <p className="mt-2 text-sm text-muted">
        La toile des liens de la campagne : qui appartient à quelle faction, qui
        se trouve où, et comment s&apos;imbriquent régions et lieux.
      </p>

      <RelationshipGraphView graph={graph} />
    </main>
  );
}

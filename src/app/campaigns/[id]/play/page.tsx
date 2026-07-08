import Link from "next/link";
import { requirePlayerAccess } from "@/lib/campaign/authorize";
import { prisma } from "@/lib/prisma";

// The player view: a spoiler-free window on the campaign showing ONLY content
// the GM has revealed, and only its player-facing (public) copy. Never renders
// GM fields (secrets, motivations, GM descriptions, unrevealed entities).
export default async function PlayerViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const { campaign, isOwner } = await requirePlayerAccess(campaignId);

  const [factions, locations, npcs, assets, sessions] = await Promise.all([
    prisma.faction.findMany({
      where: { campaignId, revealed: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { campaignId, revealed: true },
      orderBy: { name: "asc" },
    }),
    prisma.nPC.findMany({
      where: { campaignId, revealed: true },
      orderBy: { name: "asc" },
    }),
    prisma.campaignAsset.findMany({
      where: { campaignId, revealed: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.session.findMany({
      where: { campaignId, playerRecapRevealed: true, NOT: { playerRecap: null } },
      orderBy: { number: "asc" },
    }),
  ]);

  const fileSrc = (path: string) =>
    `/campaigns/${campaignId}/play/files/${path.split("/")[1]}`;

  const nothingRevealed =
    factions.length === 0 &&
    locations.length === 0 &&
    npcs.length === 0 &&
    assets.length === 0 &&
    sessions.length === 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      {isOwner && (
        <Link
          href={`/campaigns/${campaignId}`}
          className="text-sm text-primary hover:underline"
        >
          ← Retour à la campagne (vue MJ)
        </Link>
      )}

      <h1 className="mt-2 font-display text-3xl font-semibold">
        {campaign.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Ce que vous savez du monde{isOwner ? " (aperçu joueurs)" : ""}.
      </p>

      {nothingRevealed && (
        <p className="mt-10 text-muted">
          Rien n&apos;a encore été dévoilé. Le contenu apparaîtra ici au fur et
          à mesure que le MJ le révélera.
        </p>
      )}

      {sessions.length > 0 && (
        <PlayerSection title="Journal de campagne">
          <ol className="space-y-6">
            {sessions.map((session) => (
              <li key={session.id}>
                <h3 className="font-medium">Session {session.number}</h3>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted">
                  {session.playerRecap}
                </p>
              </li>
            ))}
          </ol>
        </PlayerSection>
      )}

      {npcs.length > 0 && (
        <PlayerSection title="Personnages rencontrés">
          <ul className="space-y-5">
            {npcs.map((npc) => (
              <li key={npc.id} className="flex items-start gap-3">
                {npc.portraitPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileSrc(npc.portraitPath)}
                    alt={npc.name}
                    className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-border"
                  />
                )}
                <div>
                  <p className="font-medium">{npc.name}</p>
                  {npc.publicDescription && (
                    <p className="text-sm leading-relaxed text-muted">
                      {npc.publicDescription}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </PlayerSection>
      )}

      {factions.length > 0 && (
        <PlayerSection title="Factions">
          <ul className="space-y-5">
            {factions.map((faction) => (
              <li key={faction.id} className="flex items-start gap-3">
                {faction.crestPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileSrc(faction.crestPath)}
                    alt={faction.name}
                    className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-border"
                  />
                )}
                <div>
                  <p className="font-medium">{faction.name}</p>
                  {faction.publicDescription && (
                    <p className="text-sm leading-relaxed text-muted">
                      {faction.publicDescription}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </PlayerSection>
      )}

      {locations.length > 0 && (
        <PlayerSection title="Lieux">
          <ul className="space-y-4">
            {locations.map((location) => (
              <li key={location.id}>
                <p className="font-medium">{location.name}</p>
                {location.publicDescription && (
                  <p className="text-sm leading-relaxed text-muted">
                    {location.publicDescription}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </PlayerSection>
      )}

      {assets.length > 0 && (
        <PlayerSection title="Documents & cartes">
          <ul className="grid gap-4 sm:grid-cols-2">
            {assets.map((asset) => (
              <li key={asset.id} className="card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileSrc(asset.filePath)}
                  alt={asset.title}
                  className="w-full"
                />
                <p className="p-3 text-sm font-medium">{asset.title}</p>
              </li>
            ))}
          </ul>
        </PlayerSection>
      )}
    </main>
  );
}

function PlayerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold border-b border-border pb-2">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

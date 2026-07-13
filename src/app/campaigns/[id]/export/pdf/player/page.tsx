import { prisma } from "@/lib/prisma";
import { requirePlayerAccess } from "@/lib/campaign/authorize";
import { PrintToolbar } from "@/components/print-toolbar";
import {
  PrintSection as Section,
  PrintEntry as Entry,
  PrintProse as Prose,
} from "@/components/print-document";

// Printable player handout: ONLY revealed entities and their player-facing
// (public) copy — never secrets, motivations, GM descriptions or unrevealed
// content. Mirrors the /play view. Available to the owner, a CO_GM (preview) or
// a PLAYER collaborator (requirePlayerAccess).
export default async function PlayerPdfExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const { campaign } = await requirePlayerAccess(campaignId);

  const [world, regions, plotThreads, factions, locations, npcs, sessions] =
    await Promise.all([
      prisma.world.findFirst({ where: { campaignId, revealed: true } }),
      prisma.region.findMany({
        where: { campaignId, revealed: true },
        orderBy: { name: "asc" },
      }),
      prisma.plotThread.findMany({
        where: { campaignId, revealed: true },
        orderBy: { title: "asc" },
      }),
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
      prisma.session.findMany({
        where: {
          campaignId,
          playerRecapRevealed: true,
          NOT: { playerRecap: null },
        },
        orderBy: { number: "asc" },
      }),
    ]);

  const fileUrl = (path: string) =>
    `/campaigns/${campaignId}/play/files/${path.split("/")[1]}`;

  const nothingRevealed =
    !world?.publicDescription &&
    regions.length === 0 &&
    plotThreads.length === 0 &&
    factions.length === 0 &&
    locations.length === 0 &&
    npcs.length === 0 &&
    sessions.length === 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <style>{`@media print { @page { margin: 1.4cm; } }`}</style>

      <PrintToolbar hint="Version joueurs — ne contient que le contenu déjà dévoilé, sans aucun secret. Dans la boîte d'impression, choisis « Enregistrer au format PDF »." />

      <header className="border-b border-border pb-4">
        <h1 className="font-display text-4xl font-semibold text-foreground">
          {campaign.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {campaign.system}
          {campaign.tone ? ` · ${campaign.tone}` : ""} — Ce que vous savez du
          monde
        </p>
      </header>

      {nothingRevealed && (
        <p className="mt-8 text-muted">
          Rien n&apos;a encore été dévoilé aux joueurs.
        </p>
      )}

      {world?.publicDescription && (
        <Section title="Le monde">
          <Prose text={world.publicDescription} />
        </Section>
      )}

      {sessions.length > 0 && (
        <Section title="Journal de campagne">
          {sessions.map((session) => (
            <Entry key={session.id} title={`Session ${session.number}`}>
              <Prose text={session.playerRecap} />
            </Entry>
          ))}
        </Section>
      )}

      {npcs.length > 0 && (
        <Section title="Personnages rencontrés">
          {npcs.map((npc) => (
            <Entry
              key={npc.id}
              title={npc.name}
              image={npc.portraitPath ? fileUrl(npc.portraitPath) : undefined}
            >
              <Prose text={npc.publicDescription} />
            </Entry>
          ))}
        </Section>
      )}

      {factions.length > 0 && (
        <Section title="Factions">
          {factions.map((faction) => (
            <Entry
              key={faction.id}
              title={faction.name}
              image={faction.crestPath ? fileUrl(faction.crestPath) : undefined}
            >
              <Prose text={faction.publicDescription} />
            </Entry>
          ))}
        </Section>
      )}

      {locations.length > 0 && (
        <Section title="Lieux">
          {locations.map((location) => (
            <Entry
              key={location.id}
              title={location.name}
              image={location.imagePath ? fileUrl(location.imagePath) : undefined}
            >
              <Prose text={location.publicDescription} />
            </Entry>
          ))}
        </Section>
      )}

      {regions.length > 0 && (
        <Section title="Régions">
          {regions.map((region) => (
            <Entry key={region.id} title={region.name}>
              <Prose text={region.publicDescription} />
            </Entry>
          ))}
        </Section>
      )}

      {plotThreads.length > 0 && (
        <Section title="Rumeurs & intrigues">
          {plotThreads.map((plot) => (
            <Entry key={plot.id} title={plot.title}>
              <Prose text={plot.publicDescription} />
            </Entry>
          ))}
        </Section>
      )}
    </main>
  );
}

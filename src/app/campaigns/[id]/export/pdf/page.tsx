import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import {
  NPC_STATUS_LABELS,
  PLOT_STATUS_LABELS,
} from "@/lib/campaign/labels";
import { PrintToolbar } from "@/components/print-toolbar";
import {
  PrintSection as Section,
  PrintEntry as Entry,
  PrintProse as Prose,
  PrintField as Field,
} from "@/components/print-document";

// Dedicated, print-optimised full bible (GM version — includes secrets,
// motivations and GM descriptions). The user prints it to PDF from the browser.
// Owner or CO_GM only (requireCampaignAccess), never PLAYER collaborators.
export default async function GmPdfExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  await requireCampaignAccess(campaignId);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { ...campaignBibleInclude, playerCharacters: true },
  });
  if (!campaign) notFound();

  const fileUrl = (path: string) =>
    `/campaigns/${campaignId}/files/${path.split("/")[1]}`;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
      <style>{`@media print { @page { margin: 1.4cm; } }`}</style>

      <PrintToolbar hint="Version MJ — contient les secrets et informations réservées au meneur. Dans la boîte d'impression, choisis « Enregistrer au format PDF »." />

      <header className="border-b border-border pb-4">
        <h1 className="font-display text-4xl font-semibold text-foreground">
          {campaign.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {campaign.system}
          {campaign.tone ? ` · ${campaign.tone}` : ""} — Bible du MJ
        </p>
        {campaign.synopsis && (
          <p className="mt-3 leading-relaxed text-foreground/90">
            {campaign.synopsis}
          </p>
        )}
      </header>

      {campaign.playerCharacters.length > 0 && (
        <Section title="Personnages joueurs">
          {campaign.playerCharacters.map((pc) => (
            <Entry
              key={pc.id}
              title={`${pc.name}${pc.class ? ` — ${pc.class}` : ""}`}
              subtitle={pc.playerName ? `Joué par ${pc.playerName}` : undefined}
            >
              <Prose text={pc.summary} />
              <Prose text={pc.backstory} />
            </Entry>
          ))}
        </Section>
      )}

      {campaign.world && (
        <Section title="Le monde">
          <Prose text={campaign.world.overview} />
          <Prose text={campaign.world.history} />
          <Prose text={campaign.world.cosmology} />
        </Section>
      )}

      {campaign.regions.length > 0 && (
        <Section title="Régions">
          {campaign.regions.map((region) => (
            <Entry key={region.id} title={region.name}>
              <Prose text={region.description} />
            </Entry>
          ))}
        </Section>
      )}

      {campaign.locations.length > 0 && (
        <Section title="Lieux">
          {campaign.locations.map((location) => (
            <Entry
              key={location.id}
              title={location.name}
              subtitle={location.region?.name}
              image={location.imagePath ? fileUrl(location.imagePath) : undefined}
            >
              <Prose text={location.description} />
            </Entry>
          ))}
        </Section>
      )}

      {campaign.factions.length > 0 && (
        <Section title="Factions">
          {campaign.factions.map((faction) => (
            <Entry
              key={faction.id}
              title={faction.name}
              image={faction.crestPath ? fileUrl(faction.crestPath) : undefined}
            >
              <Prose text={faction.description} />
              {faction.goals && <Field label="Objectifs" value={faction.goals} />}
            </Entry>
          ))}
        </Section>
      )}

      {campaign.npcs.length > 0 && (
        <Section title="PNJ">
          {campaign.npcs.map((npc) => (
            <Entry
              key={npc.id}
              title={npc.name}
              subtitle={[
                NPC_STATUS_LABELS[npc.status],
                npc.faction?.name,
                npc.location?.name,
              ]
                .filter(Boolean)
                .join(" · ")}
              image={npc.portraitPath ? fileUrl(npc.portraitPath) : undefined}
            >
              <Prose text={npc.description} />
              {npc.motivations && (
                <Field label="Motivations" value={npc.motivations} />
              )}
              {npc.secrets && <Field label="Secret" value={npc.secrets} />}
            </Entry>
          ))}
        </Section>
      )}

      {campaign.plotThreads.length > 0 && (
        <Section title="Intrigues">
          {campaign.plotThreads.map((plot) => (
            <Entry
              key={plot.id}
              title={plot.title}
              subtitle={PLOT_STATUS_LABELS[plot.status]}
            >
              <Prose text={plot.description} />
              {plot.gmBriefing && (
                <Field label="Briefing MJ" value={plot.gmBriefing} />
              )}
            </Entry>
          ))}
        </Section>
      )}
    </main>
  );
}

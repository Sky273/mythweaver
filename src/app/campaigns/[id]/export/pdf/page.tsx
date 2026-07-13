import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { campaignBibleInclude } from "@/lib/campaign/campaign-include";
import {
  NPC_STATUS_LABELS,
  PLOT_STATUS_LABELS,
  SESSION_STATUS_LABELS,
} from "@/lib/campaign/labels";
import { sessionPrepSchema, SessionScene } from "@/lib/llm/session-schema";
import { PrintToolbar } from "@/components/print-toolbar";
import {
  PrintSection as Section,
  PrintEntry as Entry,
  PrintProse as Prose,
  PrintField as Field,
} from "@/components/print-document";

const sessionDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
});

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
    include: {
      ...campaignBibleInclude,
      playerCharacters: true,
      sessions: { orderBy: { number: "asc" } },
    },
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

      {campaign.sessions.length > 0 && (
        <Section title="Sessions">
          {campaign.sessions.map((session) => {
            const prep = session.prep
              ? sessionPrepSchema.parse(session.prep)
              : null;
            const subtitle = [
              SESSION_STATUS_LABELS[session.status],
              session.scheduledFor
                ? sessionDateFormatter.format(session.scheduledFor)
                : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <Entry
                key={session.id}
                title={`Session ${session.number}`}
                subtitle={subtitle}
              >
                {!prep && !session.recap && (
                  <p className="text-sm text-muted">
                    Session pas encore préparée.
                  </p>
                )}

                {prep && (
                  <>
                    {prep.objectives && (
                      <Field label="Objectifs" value={prep.objectives} />
                    )}
                    {prep.recapForPlayers && (
                      <Field
                        label="Récap joueurs"
                        value={prep.recapForPlayers}
                      />
                    )}
                    {prep.openingReadAloud && (
                      <blockquote className="border-l-2 border-primary/50 pl-4 text-sm italic leading-relaxed text-foreground/80">
                        {prep.openingReadAloud}
                      </blockquote>
                    )}

                    {prep.scenes.length > 0 && (
                      <div className="mt-2 space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Scènes
                        </p>
                        {prep.scenes.map((scene, i) => (
                          <PrintScene key={i} scene={scene} />
                        ))}
                      </div>
                    )}

                    {prep.keyNPCs.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          PNJ clés
                        </p>
                        {prep.keyNPCs.map((npc, i) => (
                          <p
                            key={i}
                            className="mt-1 text-sm leading-relaxed text-foreground/90"
                          >
                            <span className="font-medium">{npc.name}</span> —{" "}
                            {npc.wantsThisSession}
                            {npc.playingTips ? ` (${npc.playingTips})` : ""}
                          </p>
                        ))}
                      </div>
                    )}

                    {prep.hooks.length > 0 && (
                      <PrintList label="Accroches" items={prep.hooks} />
                    )}
                    {prep.complications.length > 0 && (
                      <PrintList
                        label="Complications"
                        items={prep.complications}
                      />
                    )}
                  </>
                )}

                {session.recap && (
                  <Field label="Journal de session" value={session.recap} />
                )}
              </Entry>
            );
          })}
        </Section>
      )}
    </main>
  );
}

// One scene of a session prep, with its detailed beat if it was fleshed out.
function PrintScene({ scene }: { scene: SessionScene }) {
  return (
    <div className="break-inside-avoid">
      <p className="font-medium text-foreground">
        {scene.title}
        {scene.locationName && (
          <span className="ml-2 text-xs font-normal text-muted">
            {scene.locationName}
          </span>
        )}
      </p>
      <Prose text={scene.summary} />
      {scene.involvedNPCNames.length > 0 && (
        <p className="text-xs text-muted">
          PNJ : {scene.involvedNPCNames.join(", ")}
        </p>
      )}
      {scene.readAloud && (
        <blockquote className="mt-2 border-l-2 border-primary/50 pl-4 text-sm italic leading-relaxed text-foreground/80">
          {scene.readAloud}
        </blockquote>
      )}
      {scene.stakes && <Field label="Enjeu" value={scene.stakes} />}
      {scene.playerApproaches && scene.playerApproaches.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Si les joueurs…
          </p>
          <ul className="mt-1 space-y-1 text-sm text-foreground/90">
            {scene.playerApproaches.map((pa, i) => (
              <li key={i}>
                <span className="font-medium">{pa.approach}</span> → {pa.response}
              </li>
            ))}
          </ul>
        </div>
      )}
      {scene.suggestedChecks && scene.suggestedChecks.length > 0 && (
        <PrintList label="Tests suggérés" items={scene.suggestedChecks} />
      )}
      {scene.exits && scene.exits.length > 0 && (
        <PrintList label="Transitions" items={scene.exits} />
      )}
    </div>
  );
}

function PrintList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground/90">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

import Link from "next/link";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { prisma } from "@/lib/prisma";
import { sessionPrepSchema } from "@/lib/llm/session-schema";
import { Badge } from "@/components/badge";
import { BackLink } from "@/components/back-link";
import {
  NPC_STATUS_LABELS,
  PLOT_STATUS_LABELS,
} from "@/lib/campaign/labels";
import { SceneChecklist } from "./scene-checklist";

const NPC_STATUS_TONE: Record<string, "neutral" | "success" | "danger"> = {
  ALIVE: "success",
  DEAD: "danger",
  MISSING: "neutral",
  UNKNOWN: "neutral",
};

// GM "run" screen — everything needed at the table on one page: the current
// session's prep (scenes as a live checklist), the active intrigues with their
// detailed GM briefings, a quick NPC reference, and shortcuts to combat and
// random tables. Owner-only.
export default async function RunScreenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const campaign = await requireCampaignOwnership(campaignId);

  const [session, plotThreads, npcs, encounters] = await Promise.all([
    prisma.session.findFirst({
      where: { campaignId },
      orderBy: { number: "desc" },
    }),
    prisma.plotThread.findMany({
      where: { campaignId, status: { in: ["ACTIVE", "SEEDED"] } },
      orderBy: [{ status: "asc" }, { title: "asc" }],
    }),
    prisma.nPC.findMany({
      where: { campaignId },
      include: { faction: true, location: true },
      orderBy: { name: "asc" },
    }),
    prisma.encounter.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const prep = session?.prep ? sessionPrepSchema.parse(session.prep) : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <BackLink href={`/campaigns/${campaignId}`} label={campaign.name} />
      <h1 className="mt-2 font-display text-3xl font-semibold">
        Écran de MJ — en jeu
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        {/* Left column: current session + intrigues */}
        <div className="space-y-8">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">
                {session ? `Session ${session.number}` : "Aucune session"}
              </h2>
              {session && (
                <Link
                  href={`/campaigns/${campaignId}/sessions/${session.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Voir la fiche
                </Link>
              )}
            </div>

            {!prep && (
              <p className="mt-3 text-sm text-muted">
                Pas de préparation pour la session en cours.{" "}
                <Link
                  href={`/campaigns/${campaignId}/sessions/new`}
                  className="text-primary hover:underline"
                >
                  Préparer une session
                </Link>
                .
              </p>
            )}

            {prep && session && (
              <div className="mt-4 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-muted">Objectifs</h3>
                  <p className="mt-1 leading-relaxed">{prep.objectives}</p>
                </div>

                {prep.openingReadAloud && (
                  <blockquote className="border-l-2 border-primary/60 pl-4 italic leading-relaxed text-muted">
                    {prep.openingReadAloud}
                  </blockquote>
                )}

                {prep.scenes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted">Scènes</h3>
                    <div className="mt-2">
                      <SceneChecklist sessionId={session.id} scenes={prep.scenes} />
                    </div>
                  </div>
                )}

                {prep.hooks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted">Accroches</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {prep.hooks.map((hook, i) => (
                        <li key={i}>{hook}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prep.complications.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted">
                      Complications
                    </h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {prep.complications.map((complication, i) => (
                        <li key={i}>{complication}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold border-b border-border pb-2">
              Intrigues actives
            </h2>
            {plotThreads.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Aucune intrigue active pour l&apos;instant.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {plotThreads.map((plot) => (
                  <details key={plot.id} className="card p-4">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-medium">
                      {plot.title}
                      <Badge tone={plot.status === "ACTIVE" ? "primary" : "neutral"}>
                        {PLOT_STATUS_LABELS[plot.status]}
                      </Badge>
                    </summary>
                    {plot.gmBriefing ? (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                        {plot.gmBriefing}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted">
                        {plot.description}{" "}
                        <Link
                          href={`/campaigns/${campaignId}/plot-threads/${plot.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          Générer un briefing détaillé
                        </Link>
                        .
                      </p>
                    )}
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: quick references + shortcuts */}
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold border-b border-border pb-2">
              Outils
            </h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link
                href={`/campaigns/${campaignId}#encounters`}
                className="text-primary hover:underline"
              >
                Tracker de combat
              </Link>
              {encounters.map((encounter) => (
                <Link
                  key={encounter.id}
                  href={`/campaigns/${campaignId}/encounters/${encounter.id}`}
                  className="pl-4 text-muted hover:text-primary hover:underline"
                >
                  → {encounter.name}
                </Link>
              ))}
              <Link
                href={`/campaigns/${campaignId}#random-tables`}
                className="text-primary hover:underline"
              >
                Tables aléatoires
              </Link>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold border-b border-border pb-2">
              PNJ ({npcs.length})
            </h2>
            <ul className="mt-3 space-y-3">
              {npcs.map((npc) => (
                <li key={npc.id}>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {npc.name}
                    <Badge tone={NPC_STATUS_TONE[npc.status]}>
                      {NPC_STATUS_LABELS[npc.status]}
                    </Badge>
                    {(npc.faction?.name || npc.location?.name) && (
                      <span className="text-xs font-normal text-muted">
                        {[npc.faction?.name, npc.location?.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </p>
                  {npc.motivations && (
                    <p className="text-xs text-muted">Veut : {npc.motivations}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { getRemainingQuota } from "@/lib/llm/quota";
import { sessionPrepSchema } from "@/lib/llm/session-schema";
import { storedProposalSchema } from "@/lib/llm/recap-schema";
import { NPC_STATUS_LABELS, PLOT_STATUS_LABELS } from "@/lib/campaign/labels";
import { PrintButton } from "@/components/print-button";
import { submitRecap, applyProposal } from "./actions";
import { toggleReveal } from "@/lib/campaign/revealable";
import { RecapSubmitButton } from "./recap-submit-button";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-styles";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: campaignId, sessionId } = await params;
  const { campaign: ownedCampaign, isOwner } = await requireCampaignAccess(campaignId);
  const remainingQuota = isOwner
    ? await getRemainingQuota(ownedCampaign.ownerId)
    : 0;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { campaign: true },
  });
  if (!session || session.campaignId !== campaignId) notFound();

  const prep = session.prep ? sessionPrepSchema.parse(session.prep) : null;
  const proposal = session.changeProposal
    ? storedProposalSchema.parse(session.changeProposal)
    : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/campaigns/${campaignId}`}
          className="text-sm text-indigo-500 hover:underline"
        >
          ← {session.campaign.name}
        </Link>
        <div className="flex gap-3">
          {isOwner && (
            <Link
              href={`/campaigns/${campaignId}/sessions/${sessionId}/edit`}
              className="text-sm text-indigo-500 hover:underline"
            >
              Éditer
            </Link>
          )}
          <PrintButton />
          <a
            href={`/campaigns/${campaignId}/sessions/${sessionId}/export`}
            className="text-sm text-indigo-500 hover:underline"
          >
            Télécharger en Markdown
          </a>
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-semibold">
        Session {session.number}
      </h1>

      {!prep && (
        <p className="mt-4 text-sm text-gray-500">
          Cette session n&apos;a pas encore été préparée.
        </p>
      )}

      {prep && (
        <div className="mt-6 space-y-8">
          {prep.recapForPlayers && (
            <Section title="Récap pour les joueurs">
              <p className="leading-relaxed">{prep.recapForPlayers}</p>
            </Section>
          )}

          <Section title="Objectifs (MJ)">
            <p className="leading-relaxed">{prep.objectives}</p>
          </Section>

          {prep.openingReadAloud && (
            <Section title="Texte d'ouverture">
              <blockquote className="border-l-2 border-indigo-400 pl-4 italic leading-relaxed">
                {prep.openingReadAloud}
              </blockquote>
            </Section>
          )}

          {prep.scenes.length > 0 && (
            <Section title="Scènes">
              <ol className="space-y-4">
                {prep.scenes.map((scene, index) => (
                  <li key={index}>
                    <p className="font-medium">
                      {scene.title}
                      {scene.locationName && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          {scene.locationName}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {scene.summary}
                    </p>
                    {scene.involvedNPCNames.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        PNJ : {scene.involvedNPCNames.join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {prep.keyNPCs.length > 0 && (
            <Section title="PNJ clés">
              <ul className="space-y-4">
                {prep.keyNPCs.map((npc, index) => (
                  <li key={index}>
                    <p className="font-medium">{npc.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Veut cette session : {npc.wantsThisSession}
                    </p>
                    <p className="text-sm text-gray-500">
                      Comment le jouer : {npc.playingTips}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {prep.hooks.length > 0 && (
            <Section title="Accroches">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {prep.hooks.map((hook, index) => (
                  <li key={index}>{hook}</li>
                ))}
              </ul>
            </Section>
          )}

          {prep.complications.length > 0 && (
            <Section title="Complications">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {prep.complications.map((complication, index) => (
                  <li key={index}>{complication}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}

      <div className="mt-10 border-t border-gray-200 pt-8 print:hidden dark:border-gray-800">
        <h2 className="text-lg font-semibold">Journal de session</h2>

        {!session.recap && !isOwner && (
          <p className="mt-4 text-sm text-gray-500">
            En attente du journal de session par le MJ.
          </p>
        )}

        {!session.recap && isOwner && (
          <form action={submitRecap} className="mt-4 space-y-4">
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="sessionId" value={sessionId} />
            <div>
              <label htmlFor="recap" className={labelClass}>
                Que s&apos;est-il passé ?
              </label>
              <textarea
                id="recap"
                name="recap"
                rows={5}
                required
                className={inputClass}
                placeholder="Ce que les joueurs ont fait, décidé, découvert ou raté…"
              />
            </div>
            <p className="text-xs text-gray-400">
              {remainingQuota} génération{remainingQuota === 1 ? "" : "s"}{" "}
              restante{remainingQuota === 1 ? "" : "s"} ce mois-ci.
            </p>
            <RecapSubmitButton />
          </form>
        )}

        {session.recap && proposal && !isOwner && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {session.recap}
          </p>
        )}

        {session.recap && proposal && isOwner && (
          <form action={applyProposal} className="mt-4 space-y-6">
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="sessionId" value={sessionId} />
            <p className="text-sm text-gray-500">
              Coche les changements à appliquer à la bible de campagne.
            </p>

            {proposal.npcUpdates.filter((u) => u.newStatus).length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">PNJ</legend>
                {proposal.npcUpdates.map((update, index) =>
                  update.newStatus ? (
                    <label key={index} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="include"
                        value={`npcUpdates:${index}`}
                        defaultChecked
                        className="mt-1 h-5 w-5 shrink-0"
                      />
                      <span>
                        <strong>{update.name}</strong> →{" "}
                        {NPC_STATUS_LABELS[update.newStatus]}
                        {update.note && (
                          <span className="block text-gray-500">{update.note}</span>
                        )}
                      </span>
                    </label>
                  ) : null,
                )}
              </fieldset>
            )}

            {proposal.plotThreadUpdates.filter((u) => u.newStatus).length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Intrigues</legend>
                {proposal.plotThreadUpdates.map((update, index) =>
                  update.newStatus ? (
                    <label key={index} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="include"
                        value={`plotThreadUpdates:${index}`}
                        defaultChecked
                        className="mt-1 h-5 w-5 shrink-0"
                      />
                      <span>
                        <strong>{update.title}</strong> →{" "}
                        {PLOT_STATUS_LABELS[update.newStatus]}
                        {update.note && (
                          <span className="block text-gray-500">{update.note}</span>
                        )}
                      </span>
                    </label>
                  ) : null,
                )}
              </fieldset>
            )}

            {proposal.newNPCs.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Nouveaux PNJ</legend>
                {proposal.newNPCs.map((npc, index) => (
                  <label key={index} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="include"
                      value={`newNPCs:${index}`}
                      defaultChecked
                      className="mt-1 h-5 w-5 shrink-0"
                    />
                    <span>
                      <strong>{npc.name}</strong>
                      <span className="block text-gray-500">{npc.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            {proposal.newPlotThreads.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Nouvelles intrigues</legend>
                {proposal.newPlotThreads.map((plot, index) => (
                  <label key={index} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="include"
                      value={`newPlotThreads:${index}`}
                      defaultChecked
                      className="mt-1 h-5 w-5 shrink-0"
                    />
                    <span>
                      <strong>{plot.title}</strong>
                      <span className="block text-gray-500">{plot.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}

            <button type="submit" className={primaryButtonClass}>
              Appliquer les changements cochés
            </button>
          </form>
        )}

        {session.recap && !proposal && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {session.recap}
          </p>
        )}
      </div>

      {isOwner && (
        <div className="mt-10 border-t border-gray-200 pt-8 print:hidden dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Récap joueurs</h2>
            {session.playerRecap && (
              <form action={toggleReveal}>
                <input type="hidden" name="kind" value="session" />
                <input type="hidden" name="id" value={sessionId} />
                <input type="hidden" name="campaignId" value={campaignId} />
                <input
                  type="hidden"
                  name="nextRevealed"
                  value={(!session.playerRecapRevealed).toString()}
                />
                <button type="submit" className={secondaryButtonClass}>
                  {session.playerRecapRevealed
                    ? "Retirer des joueurs"
                    : "Diffuser aux joueurs"}
                </button>
              </form>
            )}
          </div>

          {session.playerRecap ? (
            <>
              <p className="mt-1 text-xs text-muted">
                {session.playerRecapRevealed
                  ? "Visible dans la vue joueurs."
                  : "Pas encore diffusé aux joueurs."}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {session.playerRecap}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Aucun récap joueurs pour l&apos;instant. Il est généré à la
              soumission du récap, ou rédige-le depuis{" "}
              <Link
                href={`/campaigns/${campaignId}/sessions/${sessionId}/edit`}
                className="text-indigo-500 hover:underline"
              >
                l&apos;édition de la session
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

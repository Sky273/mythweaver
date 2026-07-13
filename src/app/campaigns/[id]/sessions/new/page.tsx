import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getRemainingQuota } from "@/lib/llm/quota";
import { createSessionPrep } from "../actions";
import { SubmitButton } from "./submit-button";
import { labelClass, inputClass } from "@/components/form-styles";
import { BackLink } from "@/components/back-link";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const remainingQuota = await getRemainingQuota(ownedCampaign.ownerId);

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      plotThreads: { orderBy: { title: "asc" } },
      sessions: { orderBy: { number: "desc" }, take: 1 },
    },
  });
  if (!campaign) notFound();

  const nextNumber = (campaign.sessions[0]?.number ?? 0) + 1;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        Préparer la session {nextNumber}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Mythweaver s&apos;appuie sur toute la bible de campagne (canon compris)
        et sur le récap des sessions précédentes pour générer un kit de
        session prêt à jouer.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {remainingQuota} génération{remainingQuota === 1 ? "" : "s"} restante
        {remainingQuota === 1 ? "" : "s"} ce mois-ci.
      </p>

      <form action={createSessionPrep} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />

        <div>
          <label htmlFor="playerStatus" className={labelClass}>
            Où en sont les joueurs ?
          </label>
          <textarea
            id="playerStatus"
            name="playerStatus"
            rows={5}
            required
            className={inputClass}
            placeholder="Ce qu'ils ont accompli, où ils se trouvent, ce qu'ils ignorent encore, une décision en suspens…"
          />
        </div>

        {campaign.plotThreads.length > 0 && (
          <div>
            <span className={labelClass}>Intrigues à mettre en avant</span>
            <div className="mt-2 space-y-2">
              {campaign.plotThreads.map((plot) => (
                <label key={plot.id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    name="focusPlotThreadIds"
                    value={plot.id}
                    className="h-5 w-5"
                  />
                  {plot.title}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className={labelClass}>Niveau de détail</span>
          <div className="mt-2 space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="detailLevel"
                value="standard"
                defaultChecked
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                <span className="font-medium">Standard</span> — un plan concis :
                objectifs, scènes résumées, PNJ clés, accroches. Génération
                rapide.
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="detailLevel"
                value="detailed"
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                <span className="font-medium">Détaillé</span> — chaque scène
                devient un vrai support jouable : texte à lire à voix haute,
                enjeu, approches probables des joueurs et réactions du MJ, tests
                suggérés, transitions. Génération plus longue.
              </span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="provider" className={labelClass}>
            Moteur de génération
          </label>
          <select
            id="provider"
            name="provider"
            defaultValue=""
            className={inputClass}
          >
            <option value="">Par défaut (configuré côté serveur)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <SubmitButton />
      </form>
    </main>
  );
}

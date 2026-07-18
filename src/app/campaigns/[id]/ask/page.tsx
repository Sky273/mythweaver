import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getRemainingQuota } from "@/lib/llm/quota";
import { BackLink } from "@/components/back-link";
import { AskForm } from "./ask-form";
import { deleteCampaignQuestion } from "./actions";

export const maxDuration = 300;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AskCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: campaignId } = await params;
  const { error } = await searchParams;

  const campaign = await requireCampaignOwnership(campaignId);
  const [questions, remaining] = await Promise.all([
    prisma.campaignQuestion.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getRemainingQuota(campaign.ownerId),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <BackLink href={`/campaigns/${campaignId}`} label={campaign.name} />

      <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
        Interroger la campagne
      </h1>
      <p className="mt-2 text-sm text-muted">
        Pose une question en langage naturel — la réponse s&apos;appuie sur
        toute la bible et les récaps de session récents. Réservé au MJ : les
        réponses peuvent révéler des secrets et intentions cachées.
      </p>
      <p className="mt-1 text-xs text-muted">
        {remaining} génération(s) restante(s) ce mois-ci.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      <div className="mt-6">
        <AskForm campaignId={campaignId} />
      </div>

      <div className="mt-10 space-y-4">
        {questions.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune question pour l&apos;instant. Pose la première ci-dessus.
          </p>
        ) : (
          questions.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-foreground">{entry.question}</p>
                <form action={deleteCampaignQuestion}>
                  <input type="hidden" name="campaignId" value={campaignId} />
                  <input type="hidden" name="questionId" value={entry.id} />
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-danger hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {entry.answer}
              </p>
              <p className="mt-3 text-xs text-muted">
                {dateFormatter.format(entry.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

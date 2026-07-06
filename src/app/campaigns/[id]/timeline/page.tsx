import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { sessionPrepSchema } from "@/lib/llm/session-schema";

const SESSION_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planifiée",
  PREPPED: "Préparée",
  PLAYED: "Jouée",
};

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  await requireCampaignAccess(campaignId);

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { sessions: { orderBy: { number: "asc" } } },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/campaigns/${campaignId}`}
        className="text-sm text-indigo-500 hover:underline"
      >
        ← {campaign.name}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Chronologie</h1>
      <p className="mt-1 text-sm text-gray-500">
        Le déroulé de la campagne, session après session.
      </p>

      {campaign.sessions.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          Aucune session préparée pour l&apos;instant.
        </p>
      ) : (
        <ol className="mt-8 space-y-8 border-l border-gray-200 pl-6 dark:border-gray-800">
          {campaign.sessions.map((session) => {
            const prep = session.prep
              ? sessionPrepSchema.parse(session.prep)
              : null;

            return (
              <li key={session.id} className="relative">
                <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-indigo-500" />
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/campaigns/${campaignId}/sessions/${session.id}`}
                    className="font-medium hover:underline"
                  >
                    Session {session.number}
                  </Link>
                  <span className="text-xs text-gray-500">
                    {SESSION_STATUS_LABELS[session.status]}
                  </span>
                  {session.scheduledFor && (
                    <span className="text-xs text-gray-400">
                      {new Date(session.scheduledFor).toLocaleDateString(
                        "fr-FR",
                      )}
                    </span>
                  )}
                </div>

                {prep && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Prévu : </span>
                    {prep.objectives}
                  </p>
                )}

                {session.recap ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    <span className="font-medium">Joué : </span>
                    {session.recap}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-400 italic">
                    Pas encore jouée.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { updateSession, deleteSession } from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "@/components/form-styles";
import { BackLink } from "@/components/back-link";
import { SESSION_STATUS_LABELS } from "@/lib/campaign/labels";
import { SessionStatus } from "@/generated/prisma/enums";
import { sessionPrepSchema } from "@/lib/llm/session-schema";
import { SessionPrepEditor } from "../session-prep-editor";

export default async function SessionEditPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id: campaignId, sessionId } = await params;
  await requireCampaignOwnership(campaignId);

  const session = await prisma.session.findUnique({
    where: { id: sessionId, campaignId },
  });
  if (!session) notFound();

  const scheduledForValue = session.scheduledFor
    ? session.scheduledFor.toISOString().slice(0, 10)
    : "";

  const prep = session.prep ? sessionPrepSchema.parse(session.prep) : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink
        href={`/campaigns/${campaignId}/sessions/${sessionId}`}
        label={`Session ${session.number}`}
      />
      <h1 className="mt-2 text-2xl font-semibold">
        Éditer la session {session.number}
      </h1>

      <form action={updateSession} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="sessionId" value={sessionId} />

        <div className="flex flex-wrap gap-6">
          <div className="w-28">
            <label htmlFor="number" className={labelClass}>
              Numéro
            </label>
            <input
              id="number"
              name="number"
              type="number"
              min={1}
              required
              defaultValue={session.number}
              className={inputClass}
            />
          </div>

          <div className="min-w-40 flex-1">
            <label htmlFor="status" className={labelClass}>
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={session.status}
              className={inputClass}
            >
              {Object.values(SessionStatus).map((status) => (
                <option key={status} value={status}>
                  {SESSION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-40 flex-1">
            <label htmlFor="scheduledFor" className={labelClass}>
              Date prévue (optionnel)
            </label>
            <input
              id="scheduledFor"
              name="scheduledFor"
              type="date"
              defaultValue={scheduledForValue}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="playerStatus" className={labelClass}>
            Où en sont les joueurs ? (optionnel)
          </label>
          <textarea
            id="playerStatus"
            name="playerStatus"
            rows={4}
            defaultValue={session.playerStatus ?? ""}
            className={inputClass}
            placeholder="Ce qu'ils ont accompli, où ils se trouvent, une décision en suspens…"
          />
        </div>

        <div>
          <label htmlFor="recap" className={labelClass}>
            Journal de session / récap (optionnel)
          </label>
          <textarea
            id="recap"
            name="recap"
            rows={6}
            defaultValue={session.recap ?? ""}
            className={inputClass}
            placeholder="Ce que les joueurs ont fait, décidé, découvert ou raté…"
          />
        </div>

        <SessionPrepEditor initial={prep} />

        <div className="flex gap-3">
          <button type="submit" className={primaryButtonClass}>
            Enregistrer
          </button>
          <Link
            href={`/campaigns/${campaignId}/sessions/${sessionId}`}
            className={secondaryButtonClass}
          >
            Annuler
          </Link>
        </div>
      </form>

      <form action={deleteSession} className="mt-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="sessionId" value={sessionId} />
        <button type="submit" className={dangerButtonClass}>
          Supprimer cette session
        </button>
      </form>
    </main>
  );
}

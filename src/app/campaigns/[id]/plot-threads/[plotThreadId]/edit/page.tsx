import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { savePlotThread, deletePlotThread, regeneratePlotThread } from "../actions";
import { PlotStatus } from "@/generated/prisma/enums";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "@/components/form-styles";
import { RegenerateButton } from "@/components/regenerate-button";
import { BackLink } from "@/components/back-link";
import { PLOT_STATUS_LABELS as STATUS_LABELS } from "@/lib/campaign/labels";

export default async function PlotThreadEditPage({
  params,
}: {
  params: Promise<{ id: string; plotThreadId: string }>;
}) {
  const { id: campaignId, plotThreadId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const isNew = plotThreadId === "new";

  const plotThread = isNew
    ? null
    : await prisma.plotThread.findUnique({ where: { id: plotThreadId } });
  if (!isNew && !plotThread) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "Nouvelle intrigue" : "Éditer l'intrigue"}
      </h1>

      <form action={savePlotThread} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="plotThreadId" value={plotThreadId} />

        <div>
          <label htmlFor="title" className={labelClass}>
            Titre
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={plotThread?.title ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={plotThread?.description ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={plotThread?.status ?? PlotStatus.SEEDED}
            className={inputClass}
          >
            {Object.values(PlotStatus).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="publicDescription" className={labelClass}>
            Version joueurs (sans spoiler)
          </label>
          <textarea
            id="publicDescription"
            name="publicDescription"
            rows={3}
            defaultValue={plotThread?.publicDescription ?? ""}
            className={inputClass}
            placeholder="Ce que les joueurs ont entendu ou soupçonnent (rumeur, quête) — jamais le dénouement. Pré-remplie par l'IA ; diffusée via 👁️ dans la bible."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className={primaryButtonClass}>
            Enregistrer
          </button>
          <Link
            href={`/campaigns/${campaignId}`}
            className={secondaryButtonClass}
          >
            Annuler
          </Link>
        </div>
      </form>

      {!isNew && !plotThread?.locked && (
        <form action={regeneratePlotThread} className="mt-8 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <div>
            <label htmlFor="instructions" className={labelClass}>
              Régénérer la description (optionnel : direction à donner)
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              className={inputClass}
              placeholder="Complique l'enjeu moral…"
            />
          </div>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="plotThreadId" value={plotThreadId} />
          <RegenerateButton />
        </form>
      )}

      {!isNew && (
        <form action={deletePlotThread} className="mt-6">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="plotThreadId" value={plotThreadId} />
          <button type="submit" className={dangerButtonClass}>
            Supprimer cette intrigue
          </button>
        </form>
      )}
    </main>
  );
}

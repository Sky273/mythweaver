import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { saveFaction, deleteFaction, regenerateFaction, generateFactionCrest } from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "@/components/form-styles";
import { RegenerateButton } from "@/components/regenerate-button";
import { BackLink } from "@/components/back-link";
import { GeneratingOverlay } from "@/components/generating-overlay";
import { buildPreviewUrl } from "@/lib/campaign/preview-url";

export default async function FactionEditPage({
  params,
}: {
  params: Promise<{ id: string; factionId: string }>;
}) {
  const { id: campaignId, factionId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const isNew = factionId === "new";

  const faction = isNew
    ? null
    : await prisma.faction.findUnique({ where: { id: factionId } });
  if (!isNew && !faction) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "Nouvelle faction" : "Éditer la faction"}
      </h1>

      {!isNew && (
        <div className="mt-6 flex items-center gap-4">
          {faction?.crestPath && (
            <Link
              href={buildPreviewUrl(campaignId, faction.crestPath, {
                title: faction.name,
                back: `/campaigns/${campaignId}/factions/${factionId}/edit`,
                backLabel: "Éditer la faction",
              })}
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/campaigns/${campaignId}/files/${faction.crestPath.split("/")[1]}`}
                alt={`Blason de ${faction.name}`}
                className="h-24 w-24 rounded-md object-cover"
              />
            </Link>
          )}
          <form action={generateFactionCrest}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="factionId" value={factionId} />
            <button type="submit" className={secondaryButtonClass}>
              {faction?.crestPath ? "Régénérer le blason" : "Générer un blason"}
            </button>
            <GeneratingOverlay message="Génération du blason en cours…" />
          </form>
        </div>
      )}

      <form action={saveFaction} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="factionId" value={factionId} />

        <div>
          <label htmlFor="name" className={labelClass}>
            Nom
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={faction?.name ?? ""}
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
            defaultValue={faction?.description ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="goals" className={labelClass}>
            Objectifs
          </label>
          <textarea
            id="goals"
            name="goals"
            rows={3}
            defaultValue={faction?.goals ?? ""}
            className={inputClass}
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

      {!isNew && !faction?.locked && (
        <form action={regenerateFaction} className="mt-8 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <div>
            <label htmlFor="instructions" className={labelClass}>
              Régénérer la description/objectifs (optionnel : direction à donner)
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              className={inputClass}
              placeholder="Rends-la plus ambiguë moralement…"
            />
          </div>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="factionId" value={factionId} />
          <RegenerateButton />
        </form>
      )}

      {!isNew && (
        <form action={deleteFaction} className="mt-6">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="factionId" value={factionId} />
          <button type="submit" className={dangerButtonClass}>
            Supprimer cette faction
          </button>
        </form>
      )}
    </main>
  );
}

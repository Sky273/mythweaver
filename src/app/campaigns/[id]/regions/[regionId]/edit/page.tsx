import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { saveRegion, deleteRegion, regenerateRegion } from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "@/components/form-styles";
import { RegenerateButton } from "@/components/regenerate-button";
import { BackLink } from "@/components/back-link";

export default async function RegionEditPage({
  params,
}: {
  params: Promise<{ id: string; regionId: string }>;
}) {
  const { id: campaignId, regionId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const isNew = regionId === "new";

  const region = isNew
    ? null
    : await prisma.region.findUnique({ where: { id: regionId } });
  if (!isNew && !region) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "Nouvelle région" : "Éditer la région"}
      </h1>

      <form action={saveRegion} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="regionId" value={regionId} />

        <div>
          <label htmlFor="name" className={labelClass}>
            Nom
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={region?.name ?? ""}
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
            defaultValue={region?.description ?? ""}
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

      {!isNew && !region?.locked && (
        <form action={regenerateRegion} className="mt-8 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <div>
            <label htmlFor="instructions" className={labelClass}>
              Régénérer la description (optionnel : direction à donner)
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              className={inputClass}
              placeholder="Insiste sur l'aspect hostile du terrain…"
            />
          </div>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="regionId" value={regionId} />
          <RegenerateButton />
        </form>
      )}

      {!isNew && (
        <form action={deleteRegion} className="mt-6">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="regionId" value={regionId} />
          <button type="submit" className={dangerButtonClass}>
            Supprimer cette région
          </button>
        </form>
      )}
    </main>
  );
}

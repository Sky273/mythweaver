import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import {
  saveLocation,
  deleteLocation,
  regenerateLocation,
  generateLocationImage,
} from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "@/components/form-styles";
import { RegenerateButton } from "@/components/regenerate-button";
import { GeneratingOverlay } from "@/components/generating-overlay";
import { BackLink } from "@/components/back-link";
import { buildPreviewUrl } from "@/lib/campaign/preview-url";

export default async function LocationEditPage({
  params,
}: {
  params: Promise<{ id: string; locationId: string }>;
}) {
  const { id: campaignId, locationId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const isNew = locationId === "new";

  const [location, regions] = await Promise.all([
    isNew
      ? Promise.resolve(null)
      : prisma.location.findUnique({ where: { id: locationId } }),
    prisma.region.findMany({ where: { campaignId }, orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !location) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "Nouveau lieu" : "Éditer le lieu"}
      </h1>

      {!isNew && (
        <div className="mt-6 flex items-center gap-4">
          {location?.imagePath && (
            <Link
              href={buildPreviewUrl(campaignId, location.imagePath, {
                title: location.name,
                back: `/campaigns/${campaignId}/locations/${locationId}/edit`,
                backLabel: "Éditer le lieu",
              })}
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/campaigns/${campaignId}/files/${location.imagePath.split("/")[1]}`}
                alt={`Illustration de ${location.name}`}
                className="h-24 w-24 rounded-md object-cover"
              />
            </Link>
          )}
          <form action={generateLocationImage}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="locationId" value={locationId} />
            <button type="submit" className={secondaryButtonClass}>
              {location?.imagePath ? "Régénérer l'image" : "Générer une image"}
            </button>
            <GeneratingOverlay message="Génération de l'image du lieu en cours…" />
          </form>
        </div>
      )}

      <form action={saveLocation} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="locationId" value={locationId} />

        <div>
          <label htmlFor="name" className={labelClass}>
            Nom
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={location?.name ?? ""}
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
            defaultValue={location?.description ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="publicDescription" className={labelClass}>
            Version joueurs (sans spoiler)
          </label>
          <textarea
            id="publicDescription"
            name="publicDescription"
            rows={3}
            defaultValue={location?.publicDescription ?? ""}
            className={inputClass}
            placeholder="Ce que les joueurs savent de ce lieu. Pré-remplie par l'IA à la génération ; diffusée via 👁️ dans la bible."
          />
        </div>

        <div>
          <label htmlFor="regionId" className={labelClass}>
            Région
          </label>
          <select
            id="regionId"
            name="regionId"
            defaultValue={location?.regionId ?? ""}
            className={inputClass}
          >
            <option value="">Aucune</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
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

      {!isNew && !location?.locked && (
        <form action={regenerateLocation} className="mt-8 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <div>
            <label htmlFor="instructions" className={labelClass}>
              Régénérer la description (optionnel : direction à donner)
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              className={inputClass}
              placeholder="Ajoute un détail inquiétant…"
            />
          </div>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="locationId" value={locationId} />
          <RegenerateButton />
        </form>
      )}

      {!isNew && (
        <form action={deleteLocation} className="mt-6">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="locationId" value={locationId} />
          <button type="submit" className={dangerButtonClass}>
            Supprimer ce lieu
          </button>
        </form>
      )}
    </main>
  );
}

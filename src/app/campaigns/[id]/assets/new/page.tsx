import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getRemainingQuota } from "@/lib/llm/quota";
import { createCampaignAsset, uploadCampaignAsset } from "../actions";
import { SubmitButton } from "./submit-button";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
} from "@/components/form-styles";
import { BackLink } from "@/components/back-link";
import { GeneratingOverlay } from "@/components/generating-overlay";

// Map/document image generation (gpt-image-1) can run tens of seconds — set
// explicitly here in addition to the /campaigns layout.
export const maxDuration = 60;

export default async function NewCampaignAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const remainingQuota = await getRemainingQuota(ownedCampaign.ownerId);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">Nouveau document visuel</h1>
      <p className="mt-2 text-sm text-gray-500">
        Génère une carte ou un document à montrer à table. Généré via
        l&apos;API image d&apos;OpenAI, quel que soit le moteur configuré
        pour le texte.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Pour une carte, les régions et lieux de la bible de campagne sont
        automatiquement inclus et étiquetés — la description ci-dessous sert
        surtout à préciser le style artistique.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {remainingQuota} génération{remainingQuota === 1 ? "" : "s"} restante
        {remainingQuota === 1 ? "" : "s"} ce mois-ci.
      </p>

      <form action={createCampaignAsset} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />

        <div>
          <label htmlFor="title" className={labelClass}>
            Titre
          </label>
          <input
            id="title"
            name="title"
            required
            className={inputClass}
            placeholder="Carte du royaume de Valbrume"
          />
        </div>

        <div>
          <label htmlFor="kind" className={labelClass}>
            Type
          </label>
          <select id="kind" name="kind" defaultValue="MAP" className={inputClass}>
            <option value="MAP">Carte</option>
            <option value="DOCUMENT">Document</option>
          </select>
        </div>

        <div>
          <label htmlFor="prompt" className={labelClass}>
            Description de l&apos;image
          </label>
          <textarea
            id="prompt"
            name="prompt"
            rows={5}
            required
            className={inputClass}
            placeholder="Style parchemin ancien, encre sépia, vue du dessus, ambiance sombre…"
          />
        </div>

        <SubmitButton />
        <GeneratingOverlay message="Génération du document en cours…" />
      </form>

      <div className="mt-12 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          ou uploade ta propre image
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        action={uploadCampaignAsset}
        encType="multipart/form-data"
        className="mt-8 space-y-6"
      >
        <input type="hidden" name="campaignId" value={campaignId} />

        <div>
          <label htmlFor="uploadTitle" className={labelClass}>
            Titre
          </label>
          <input
            id="uploadTitle"
            name="title"
            required
            className={inputClass}
            placeholder="Plan de la crypte (scanné)"
          />
        </div>

        <div>
          <label htmlFor="uploadKind" className={labelClass}>
            Type
          </label>
          <select
            id="uploadKind"
            name="kind"
            defaultValue="MAP"
            className={inputClass}
          >
            <option value="MAP">Carte</option>
            <option value="DOCUMENT">Document</option>
          </select>
        </div>

        <div>
          <label htmlFor="file" className={labelClass}>
            Image (PNG, JPEG ou WebP, 15 Mo max)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept="image/png,image/jpeg,image/webp"
            className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1 file:text-sm dark:file:bg-gray-700`}
          />
        </div>

        <button type="submit" className={primaryButtonClass}>
          Uploader
        </button>
      </form>
    </main>
  );
}

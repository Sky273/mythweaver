import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getRemainingQuota } from "@/lib/llm/quota";
import { createCampaignAsset } from "../actions";
import { SubmitButton } from "./submit-button";
import { labelClass, inputClass } from "@/components/form-styles";
import { BackLink } from "@/components/back-link";
import { GeneratingOverlay } from "@/components/generating-overlay";
import { ImageErrorBanner } from "@/components/image-error-banner";

// Map/document image generation (gpt-image-1) can run tens of seconds — set
// explicitly here in addition to the /campaigns layout.
export const maxDuration = 60;

export default async function NewCampaignAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imageError?: string }>;
}) {
  const { id: campaignId } = await params;
  const { imageError } = await searchParams;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const remainingQuota = await getRemainingQuota(ownedCampaign.ownerId);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">Générer un document</h1>
      <p className="mt-2 text-sm text-gray-500">
        Génère une carte ou un document à montrer à table via l&apos;API image
        d&apos;OpenAI. Tu préfères utiliser ta propre image ?{" "}
        <a
          href={`/campaigns/${campaignId}/assets/upload`}
          className="text-primary hover:underline"
        >
          Uploader une image
        </a>
        .
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

      <ImageErrorBanner message={imageError} />

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
    </main>
  );
}

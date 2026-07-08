import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { uploadCampaignAsset } from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
} from "@/components/form-styles";
import { BackLink } from "@/components/back-link";

export default async function UploadCampaignAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">Uploader une image</h1>
      <p className="mt-2 text-sm text-gray-500">
        Ajoute ta propre carte ou document (image scannée, illustration…) à
        montrer à table. Tu préfères en générer une par IA ?{" "}
        <a
          href={`/campaigns/${campaignId}/assets/new`}
          className="text-primary hover:underline"
        >
          Générer un document
        </a>
        .
      </p>

      <form
        action={uploadCampaignAsset}
        encType="multipart/form-data"
        className="mt-8 space-y-6"
      >
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
            placeholder="Plan de la crypte (scanné)"
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

import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { getRemainingQuota } from "@/lib/llm/quota";
import { createRandomTable } from "../actions";
import { SubmitButton } from "./submit-button";
import { labelClass, inputClass } from "@/components/form-styles";
import { BackLink } from "@/components/back-link";

export default async function NewRandomTablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const remainingQuota = await getRemainingQuota(ownedCampaign.ownerId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">Nouvelle table aléatoire</h1>
      <p className="mt-2 text-sm text-gray-500">
        Génère une table à tirer au sort en pleine partie, ancrée dans la
        bible de campagne.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {remainingQuota} génération{remainingQuota === 1 ? "" : "s"} restante
        {remainingQuota === 1 ? "" : "s"} ce mois-ci.
      </p>

      <form action={createRandomTable} className="mt-8 space-y-6">
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
            placeholder="Rencontres dans la Marche Noire"
          />
        </div>

        <div>
          <label htmlFor="kind" className={labelClass}>
            Type
          </label>
          <select id="kind" name="kind" defaultValue="ENCOUNTER" className={inputClass}>
            <option value="ENCOUNTER">Rencontres</option>
            <option value="LOOT">Butin</option>
            <option value="NPC">PNJ de circonstance</option>
            <option value="MISC">Divers / complications</option>
          </select>
        </div>

        <div>
          <label htmlFor="contextNote" className={labelClass}>
            Précision (optionnel)
          </label>
          <textarea
            id="contextNote"
            name="contextNote"
            rows={3}
            className={inputClass}
            placeholder="Rencontres pour la région de la Marche Noire spécifiquement…"
          />
        </div>

        <SubmitButton />
      </form>
    </main>
  );
}

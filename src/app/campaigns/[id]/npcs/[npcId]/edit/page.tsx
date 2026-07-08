import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { saveNPC, deleteNPC, regenerateNPC, generateNPCPortrait } from "../actions";
import { NPCStatus } from "@/generated/prisma/enums";
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
import { NPC_STATUS_LABELS as STATUS_LABELS } from "@/lib/campaign/labels";

// Portrait generation (gpt-image-1) can run tens of seconds — set explicitly
// here in addition to the /campaigns layout so this critical path never falls
// back to Vercel's short default timeout.
export const maxDuration = 60;

export default async function NPCEditPage({
  params,
}: {
  params: Promise<{ id: string; npcId: string }>;
}) {
  const { id: campaignId, npcId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const isNew = npcId === "new";

  const [npc, factions, locations] = await Promise.all([
    isNew ? Promise.resolve(null) : prisma.nPC.findUnique({ where: { id: npcId } }),
    prisma.faction.findMany({ where: { campaignId }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { campaignId }, orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !npc) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "Nouveau PNJ" : "Éditer le PNJ"}
      </h1>

      {!isNew && (
        <div className="mt-6 flex items-center gap-4">
          {npc?.portraitPath && (
            <Link
              href={buildPreviewUrl(campaignId, npc.portraitPath, {
                title: npc.name,
                back: `/campaigns/${campaignId}/npcs/${npcId}/edit`,
                backLabel: "Éditer le PNJ",
              })}
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/campaigns/${campaignId}/files/${npc.portraitPath.split("/")[1]}`}
                alt={`Portrait de ${npc.name}`}
                className="h-24 w-24 rounded-md object-cover"
              />
            </Link>
          )}
          <form action={generateNPCPortrait}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="npcId" value={npcId} />
            <button type="submit" className={secondaryButtonClass}>
              {npc?.portraitPath ? "Régénérer le portrait" : "Générer un portrait"}
            </button>
            <GeneratingOverlay message="Génération du portrait en cours…" />
          </form>
        </div>
      )}

      <form action={saveNPC} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="npcId" value={npcId} />

        <div>
          <label htmlFor="name" className={labelClass}>
            Nom
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={npc?.name ?? ""}
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
            rows={3}
            defaultValue={npc?.description ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="motivations" className={labelClass}>
            Motivations
          </label>
          <textarea
            id="motivations"
            name="motivations"
            rows={3}
            defaultValue={npc?.motivations ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="secrets" className={labelClass}>
            Secret
          </label>
          <textarea
            id="secrets"
            name="secrets"
            rows={2}
            defaultValue={npc?.secrets ?? ""}
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
            defaultValue={npc?.publicDescription ?? ""}
            className={inputClass}
            placeholder="Ce que les joueurs perçoivent de ce PNJ (apparence, réputation) — jamais ses secrets ni ses vraies intentions. Pré-remplie par l'IA ; diffusée via 👁️ dans la bible."
          />
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={npc?.status ?? NPCStatus.ALIVE}
            className={inputClass}
          >
            {Object.values(NPCStatus).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="factionId" className={labelClass}>
            Faction
          </label>
          <select
            id="factionId"
            name="factionId"
            defaultValue={npc?.factionId ?? ""}
            className={inputClass}
          >
            <option value="">Aucune</option>
            {factions.map((faction) => (
              <option key={faction.id} value={faction.id}>
                {faction.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="locationId" className={labelClass}>
            Lieu
          </label>
          <select
            id="locationId"
            name="locationId"
            defaultValue={npc?.locationId ?? ""}
            className={inputClass}
          >
            <option value="">Aucun</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
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

      {!isNew && !npc?.locked && (
        <form action={regenerateNPC} className="mt-8 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          <div>
            <label htmlFor="instructions" className={labelClass}>
              Régénérer la description/motivations/secret (optionnel : direction à donner)
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={2}
              className={inputClass}
              placeholder="Rends-le plus sympathique, insiste sur son lien avec telle faction…"
            />
          </div>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="npcId" value={npcId} />
          <RegenerateButton />
        </form>
      )}

      {!isNew && (
        <form action={deleteNPC} className="mt-6">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="npcId" value={npcId} />
          <button type="submit" className={dangerButtonClass}>
            Supprimer ce PNJ
          </button>
        </form>
      )}
    </main>
  );
}

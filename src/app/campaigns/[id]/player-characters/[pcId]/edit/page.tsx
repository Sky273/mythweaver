import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { savePlayerCharacter, deletePlayerCharacter } from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "@/components/form-styles";
import { BackLink } from "@/components/back-link";

export default async function PlayerCharacterEditPage({
  params,
}: {
  params: Promise<{ id: string; pcId: string }>;
}) {
  const { id: campaignId, pcId } = await params;
  const ownedCampaign = await requireCampaignOwnership(campaignId);
  const isNew = pcId === "new";

  const pc = isNew
    ? null
    : await prisma.playerCharacter.findUnique({ where: { id: pcId, campaignId } });
  if (!isNew && !pc) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${campaignId}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">
        {isNew ? "Nouveau personnage joueur" : "Éditer le personnage joueur"}
      </h1>

      <form
        action={savePlayerCharacter}
        encType="multipart/form-data"
        className="mt-8 space-y-6"
      >
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="pcId" value={pcId} />

        <div>
          <label htmlFor="name" className={labelClass}>
            Nom du personnage
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={pc?.name ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="playerName" className={labelClass}>
            Joueur
          </label>
          <input
            id="playerName"
            name="playerName"
            defaultValue={pc?.playerName ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="class" className={labelClass}>
            Classe
          </label>
          <input
            id="class"
            name="class"
            defaultValue={pc?.class ?? ""}
            placeholder="Guerrier, Magicien, Roublard…"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="summary" className={labelClass}>
            Résumé
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={2}
            defaultValue={pc?.summary ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="backstory" className={labelClass}>
            Histoire personnelle
          </label>
          <textarea
            id="backstory"
            name="backstory"
            rows={6}
            defaultValue={pc?.backstory ?? ""}
            placeholder="Passé, motivations, liens avec le monde… Mythweaver s'en sert pour générer des accroches personnelles en session."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="characterSheet" className={labelClass}>
            Feuille de personnage (PDF, PNG, JPEG ou WebP, 15 Mo max)
          </label>
          {pc?.characterSheetPath && (
            <p className="mt-1 text-xs text-gray-500">
              Actuelle :{" "}
              <a
                href={`/campaigns/${campaignId}/files/${pc.characterSheetPath.split("/")[1]}`}
                className="text-indigo-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {pc.characterSheetOriginalName}
              </a>
              {" "}(remplacer ci-dessous si besoin)
            </p>
          )}
          <input
            id="characterSheet"
            name="characterSheet"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1 file:text-sm dark:file:bg-gray-700`}
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

      {!isNew && (
        <form action={deletePlayerCharacter} className="mt-6">
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="pcId" value={pcId} />
          <button type="submit" className={dangerButtonClass}>
            Supprimer ce personnage
          </button>
        </form>
      )}
    </main>
  );
}

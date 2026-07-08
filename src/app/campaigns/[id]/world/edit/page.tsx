import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignOwnership } from "@/lib/campaign/authorize";
import { updateWorld } from "../actions";
import {
  labelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form-styles";
import { BackLink } from "@/components/back-link";

export default async function WorldEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ownedCampaign = await requireCampaignOwnership(id);
  const world = await prisma.world.findUnique({ where: { campaignId: id } });
  if (!world) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <BackLink href={`/campaigns/${id}`} label={ownedCampaign.name} />
      <h1 className="mt-2 text-2xl font-semibold">Éditer le monde</h1>

      <form action={updateWorld} className="mt-8 space-y-6">
        <input type="hidden" name="campaignId" value={id} />

        <div>
          <label htmlFor="overview" className={labelClass}>
            Aperçu
          </label>
          <textarea
            id="overview"
            name="overview"
            rows={5}
            required
            defaultValue={world.overview}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="history" className={labelClass}>
            Histoire
          </label>
          <textarea
            id="history"
            name="history"
            rows={4}
            defaultValue={world.history ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="cosmology" className={labelClass}>
            Cosmologie
          </label>
          <textarea
            id="cosmology"
            name="cosmology"
            rows={4}
            defaultValue={world.cosmology ?? ""}
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
            rows={4}
            defaultValue={world.publicDescription ?? ""}
            className={inputClass}
            placeholder="Ce que les joueurs savent du monde. Pré-remplie par l'IA à la génération ; diffusée via 👁️ dans la bible."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className={primaryButtonClass}>
            Enregistrer
          </button>
          <Link href={`/campaigns/${id}`} className={secondaryButtonClass}>
            Annuler
          </Link>
        </div>
      </form>
    </main>
  );
}

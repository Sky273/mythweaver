import { auth } from "@/auth";
import { getRemainingQuota } from "@/lib/llm/quota";
import { createCampaign } from "@/app/campaigns/actions";
import { SubmitButton } from "./submit-button";
import { BackLink } from "@/components/back-link";

export default async function NewCampaignPage() {
  const session = await auth();
  const remainingQuota = await getRemainingQuota(session!.user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <BackLink href="/" label="Mes campagnes" />
      <h1 className="mt-2 text-2xl font-semibold">Nouvelle campagne</h1>
      <p className="mt-2 text-sm text-gray-500">
        Réponds à quelques questions, Mythweaver génère un premier jet de
        bible de campagne (monde, factions, PNJ, intrigues).
      </p>
      <p className="mt-1 text-xs text-gray-400">
        {remainingQuota} génération{remainingQuota === 1 ? "" : "s"} restante
        {remainingQuota === 1 ? "" : "s"} ce mois-ci.
      </p>

      <form action={createCampaign} className="mt-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Nom de la campagne
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Les Cendres du Roi-Sorcier"
          />
        </div>

        <div>
          <label htmlFor="system" className="block text-sm font-medium">
            Système de jeu
          </label>
          <input
            id="system"
            name="system"
            required
            list="system-suggestions"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="D&D 5e, Pathfinder 2e, Call of Cthulhu, générique…"
          />
          <datalist id="system-suggestions">
            <option value="D&D 5e" />
            <option value="Pathfinder 2e" />
            <option value="Call of Cthulhu" />
            <option value="Générique / système maison" />
          </datalist>
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-medium">
            Ton
          </label>
          <input
            id="tone"
            name="tone"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Sombre et politique, héroïque et léger, horrifique…"
          />
        </div>

        <div>
          <label htmlFor="themes" className="block text-sm font-medium">
            Thèmes / notes de genre
          </label>
          <textarea
            id="themes"
            name="themes"
            rows={4}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Guerre civile entre factions, corruption d'une cité portuaire, un ancien mal qui se réveille…"
          />
        </div>

        <div>
          <label htmlFor="playerCount" className="block text-sm font-medium">
            Nombre de joueurs
          </label>
          <input
            id="playerCount"
            name="playerCount"
            type="number"
            min={1}
            max={10}
            defaultValue={4}
            className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div>
          <label htmlFor="provider" className="block text-sm font-medium">
            Moteur de génération
          </label>
          <select
            id="provider"
            name="provider"
            defaultValue=""
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Par défaut (configuré côté serveur)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <SubmitButton />
      </form>
    </main>
  );
}

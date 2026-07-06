import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCampaignAccess } from "@/lib/campaign/authorize";
import { sortCombatants } from "@/lib/campaign/encounter-order";
import {
  addCombatant,
  removeCombatant,
  adjustCombatantHP,
  setCombatantInitiative,
  addCondition,
  removeCondition,
  advanceTurn,
  endEncounter,
  reopenEncounter,
  deleteEncounter,
} from "./actions";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
  dangerActionLinkClass,
} from "@/components/form-styles";

export default async function EncounterPage({
  params,
}: {
  params: Promise<{ id: string; encounterId: string }>;
}) {
  const { id: campaignId, encounterId } = await params;
  const { isOwner } = await requireCampaignAccess(campaignId);

  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: {
      combatants: true,
      campaign: { include: { npcs: true, playerCharacters: true } },
    },
  });
  if (!encounter || encounter.campaignId !== campaignId) notFound();

  const combatants = sortCombatants(encounter.combatants);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/campaigns/${campaignId}`}
        className="text-sm text-indigo-500 hover:underline"
      >
        ← {encounter.campaign.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{encounter.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Round {encounter.round} — {encounter.active ? "En cours" : "Terminé"}
          </p>
        </div>

        {isOwner && (
          <div className="flex flex-wrap gap-2">
            {encounter.active && (
              <form action={advanceTurn}>
                <input type="hidden" name="campaignId" value={campaignId} />
                <input type="hidden" name="encounterId" value={encounterId} />
                <button type="submit" className={primaryButtonClass}>
                  Tour suivant
                </button>
              </form>
            )}
            {encounter.active ? (
              <form action={endEncounter}>
                <input type="hidden" name="campaignId" value={campaignId} />
                <input type="hidden" name="encounterId" value={encounterId} />
                <button type="submit" className={secondaryButtonClass}>
                  Terminer le combat
                </button>
              </form>
            ) : (
              <form action={reopenEncounter}>
                <input type="hidden" name="campaignId" value={campaignId} />
                <input type="hidden" name="encounterId" value={encounterId} />
                <button type="submit" className={secondaryButtonClass}>
                  Reprendre le combat
                </button>
              </form>
            )}
            <form action={deleteEncounter}>
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="encounterId" value={encounterId} />
              <button type="submit" className={dangerButtonClass}>
                Supprimer
              </button>
            </form>
          </div>
        )}
      </div>

      {combatants.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">
          Aucun combattant pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {combatants.map((combatant) => {
            const isCurrentTurn = combatant.id === encounter.currentTurnCombatantId;
            const hasHP = combatant.maxHP !== null || combatant.currentHP !== null;

            return (
              <li
                key={combatant.id}
                className={`rounded-md border p-4 ${
                  isCurrentTurn
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {combatant.name}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {combatant.isPC ? "PJ" : "PNJ"}
                    </span>
                    {isCurrentTurn && (
                      <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                        Tour actuel
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Init.</span>
                    {isOwner ? (
                      <form action={setCombatantInitiative} className="flex items-center gap-1">
                        <input type="hidden" name="campaignId" value={campaignId} />
                        <input type="hidden" name="encounterId" value={encounterId} />
                        <input type="hidden" name="combatantId" value={combatant.id} />
                        <input
                          type="number"
                          name="initiative"
                          defaultValue={combatant.initiative}
                          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                        />
                        <button type="submit" className={secondaryButtonClass}>
                          OK
                        </button>
                      </form>
                    ) : (
                      <span className="font-medium">{combatant.initiative}</span>
                    )}
                  </div>
                </div>

                {hasHP && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-gray-500">PV</span>
                    <span className="font-medium">
                      {combatant.currentHP ?? "—"} / {combatant.maxHP ?? "—"}
                    </span>
                    {isOwner && (
                      <div className="flex gap-1">
                        {[-5, -1, 1, 5].map((delta) => (
                          <form key={delta} action={adjustCombatantHP}>
                            <input type="hidden" name="campaignId" value={campaignId} />
                            <input type="hidden" name="encounterId" value={encounterId} />
                            <input type="hidden" name="combatantId" value={combatant.id} />
                            <input type="hidden" name="delta" value={delta} />
                            <button type="submit" className={secondaryButtonClass}>
                              {delta > 0 ? `+${delta}` : delta}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {combatant.conditions.map((condition) => (
                    <span
                      key={condition}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    >
                      {condition}
                      {isOwner && (
                        <form action={removeCondition} className="inline">
                          <input type="hidden" name="campaignId" value={campaignId} />
                          <input type="hidden" name="encounterId" value={encounterId} />
                          <input type="hidden" name="combatantId" value={combatant.id} />
                          <input type="hidden" name="condition" value={condition} />
                          <button type="submit" aria-label={`Retirer ${condition}`}>
                            ×
                          </button>
                        </form>
                      )}
                    </span>
                  ))}
                  {isOwner && (
                    <form action={addCondition} className="flex items-center gap-1">
                      <input type="hidden" name="campaignId" value={campaignId} />
                      <input type="hidden" name="encounterId" value={encounterId} />
                      <input type="hidden" name="combatantId" value={combatant.id} />
                      <input
                        type="text"
                        name="condition"
                        placeholder="+ état (ex. Étourdi)"
                        className="w-36 rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                      />
                      <button type="submit" className={secondaryButtonClass}>
                        Ajouter
                      </button>
                    </form>
                  )}
                </div>

                {isOwner && (
                  <form action={removeCombatant} className="mt-3">
                    <input type="hidden" name="campaignId" value={campaignId} />
                    <input type="hidden" name="encounterId" value={encounterId} />
                    <input type="hidden" name="combatantId" value={combatant.id} />
                    <button type="submit" className={dangerActionLinkClass}>
                      Retirer du combat
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isOwner && encounter.active && (
        <div className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Ajouter un combattant</h2>
          <form action={addCombatant} className="mt-4 space-y-4">
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="encounterId" value={encounterId} />

            {(encounter.campaign.npcs.length > 0 ||
              encounter.campaign.playerCharacters.length > 0) && (
              <div>
                <label htmlFor="prefill" className={labelClass}>
                  Depuis la campagne (optionnel)
                </label>
                <select id="prefill" name="prefill" className={inputClass} defaultValue="">
                  <option value="">— Combattant personnalisé —</option>
                  {encounter.campaign.playerCharacters.length > 0 && (
                    <optgroup label="Personnages joueurs">
                      {encounter.campaign.playerCharacters.map((pc) => (
                        <option key={pc.id} value={`pc:${pc.id}`}>
                          {pc.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {encounter.campaign.npcs.length > 0 && (
                    <optgroup label="PNJ">
                      {encounter.campaign.npcs.map((npc) => (
                        <option key={npc.id} value={`npc:${npc.id}`}>
                          {npc.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="name" className={labelClass}>
                Nom (si combattant personnalisé)
              </label>
              <input
                id="name"
                name="name"
                className={inputClass}
                placeholder="Gobelin éclaireur"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="initiative" className={labelClass}>
                  Initiative
                </label>
                <input
                  id="initiative"
                  name="initiative"
                  type="number"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="maxHP" className={labelClass}>
                  PV max (optionnel)
                </label>
                <input id="maxHP" name="maxHP" type="number" className={inputClass} />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPC" className="h-5 w-5" />
                Personnage joueur
              </label>
            </div>

            <button type="submit" className={primaryButtonClass}>
              Ajouter au combat
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import type { SessionPrep } from "@/lib/llm/session-schema";
import {
  labelClass,
  inputClass,
  secondaryButtonClass,
  dangerActionLinkClass,
} from "@/components/form-styles";

// Draft shapes mirror SessionPrep but keep the string-array fields as
// plain text in the UI (comma / newline separated), converted back to
// arrays when serialized into the hidden `prepJson` field the server action
// reads. The server re-validates with sessionPrepSchema, so this editor only
// has to produce the right shape.
type SceneDraft = {
  title: string;
  summary: string;
  locationName: string;
  involvedNPCNames: string;
};
type NPCDraft = { name: string; wantsThisSession: string; playingTips: string };

const MAX_SCENES = 6;
const MAX_NPCS = 6;

export function SessionPrepEditor({ initial }: { initial: SessionPrep | null }) {
  const [recapForPlayers, setRecapForPlayers] = useState(
    initial?.recapForPlayers ?? "",
  );
  const [objectives, setObjectives] = useState(initial?.objectives ?? "");
  const [openingReadAloud, setOpeningReadAloud] = useState(
    initial?.openingReadAloud ?? "",
  );
  const [scenes, setScenes] = useState<SceneDraft[]>(
    (initial?.scenes ?? []).map((scene) => ({
      title: scene.title,
      summary: scene.summary,
      locationName: scene.locationName ?? "",
      involvedNPCNames: scene.involvedNPCNames.join(", "),
    })),
  );
  const [keyNPCs, setKeyNPCs] = useState<NPCDraft[]>(
    (initial?.keyNPCs ?? []).map((npc) => ({
      name: npc.name,
      wantsThisSession: npc.wantsThisSession,
      playingTips: npc.playingTips,
    })),
  );
  const [hooks, setHooks] = useState((initial?.hooks ?? []).join("\n"));
  const [complications, setComplications] = useState(
    (initial?.complications ?? []).join("\n"),
  );

  const payload = {
    recapForPlayers: recapForPlayers.trim() || null,
    objectives: objectives.trim(),
    openingReadAloud: openingReadAloud.trim() || null,
    scenes: scenes.map((scene) => ({
      title: scene.title.trim(),
      summary: scene.summary.trim(),
      locationName: scene.locationName.trim() || null,
      involvedNPCNames: splitList(scene.involvedNPCNames, ","),
    })),
    keyNPCs: keyNPCs.map((npc) => ({
      name: npc.name.trim(),
      wantsThisSession: npc.wantsThisSession.trim(),
      playingTips: npc.playingTips.trim(),
    })),
    hooks: splitList(hooks, "\n"),
    complications: splitList(complications, "\n"),
  };

  return (
    <fieldset className="space-y-6 rounded-lg border border-border p-5">
      <legend className="px-2 text-sm font-medium text-muted">
        Préparation de la session (optionnel)
      </legend>

      <input type="hidden" name="prepJson" value={JSON.stringify(payload)} />

      <div>
        <label htmlFor="objectives" className={labelClass}>
          Objectifs (MJ)
        </label>
        <textarea
          id="objectives"
          rows={3}
          value={objectives}
          onChange={(event) => setObjectives(event.target.value)}
          className={inputClass}
          placeholder="Ce que cette session doit accomplir sur le plan narratif."
        />
      </div>

      <div>
        <label htmlFor="recapForPlayers" className={labelClass}>
          Récap pour les joueurs
        </label>
        <textarea
          id="recapForPlayers"
          rows={2}
          value={recapForPlayers}
          onChange={(event) => setRecapForPlayers(event.target.value)}
          className={inputClass}
          placeholder="« Précédemment… » à lire à voix haute en ouverture."
        />
      </div>

      <div>
        <label htmlFor="openingReadAloud" className={labelClass}>
          Texte d&apos;ouverture
        </label>
        <textarea
          id="openingReadAloud"
          rows={3}
          value={openingReadAloud}
          onChange={(event) => setOpeningReadAloud(event.target.value)}
          className={inputClass}
          placeholder="Texte d'ambiance à lire pour planter la scène d'ouverture."
        />
      </div>

      {/* Scenes */}
      <div className="space-y-3">
        <span className={labelClass}>Scènes</span>
        {scenes.map((scene, index) => (
          <div key={index} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                Scène {index + 1}
              </span>
              <button
                type="button"
                onClick={() => setScenes((prev) => prev.filter((_, i) => i !== index))}
                className={dangerActionLinkClass}
              >
                Retirer
              </button>
            </div>
            <input
              value={scene.title}
              onChange={(event) =>
                setScenes((prev) =>
                  prev.map((s, i) => (i === index ? { ...s, title: event.target.value } : s)),
                )
              }
              className={inputClass}
              placeholder="Titre de la scène"
            />
            <textarea
              value={scene.summary}
              onChange={(event) =>
                setScenes((prev) =>
                  prev.map((s, i) => (i === index ? { ...s, summary: event.target.value } : s)),
                )
              }
              rows={2}
              className={inputClass}
              placeholder="Résumé de la scène"
            />
            <input
              value={scene.locationName}
              onChange={(event) =>
                setScenes((prev) =>
                  prev.map((s, i) =>
                    i === index ? { ...s, locationName: event.target.value } : s,
                  ),
                )
              }
              className={inputClass}
              placeholder="Lieu (optionnel)"
            />
            <input
              value={scene.involvedNPCNames}
              onChange={(event) =>
                setScenes((prev) =>
                  prev.map((s, i) =>
                    i === index ? { ...s, involvedNPCNames: event.target.value } : s,
                  ),
                )
              }
              className={inputClass}
              placeholder="PNJ impliqués (séparés par des virgules)"
            />
          </div>
        ))}
        {scenes.length < MAX_SCENES && (
          <button
            type="button"
            onClick={() =>
              setScenes((prev) => [
                ...prev,
                { title: "", summary: "", locationName: "", involvedNPCNames: "" },
              ])
            }
            className={secondaryButtonClass}
          >
            + Ajouter une scène
          </button>
        )}
      </div>

      {/* Key NPCs */}
      <div className="space-y-3">
        <span className={labelClass}>PNJ clés</span>
        {keyNPCs.map((npc, index) => (
          <div key={index} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">
                PNJ {index + 1}
              </span>
              <button
                type="button"
                onClick={() => setKeyNPCs((prev) => prev.filter((_, i) => i !== index))}
                className={dangerActionLinkClass}
              >
                Retirer
              </button>
            </div>
            <input
              value={npc.name}
              onChange={(event) =>
                setKeyNPCs((prev) =>
                  prev.map((n, i) => (i === index ? { ...n, name: event.target.value } : n)),
                )
              }
              className={inputClass}
              placeholder="Nom du PNJ"
            />
            <textarea
              value={npc.wantsThisSession}
              onChange={(event) =>
                setKeyNPCs((prev) =>
                  prev.map((n, i) =>
                    i === index ? { ...n, wantsThisSession: event.target.value } : n,
                  ),
                )
              }
              rows={2}
              className={inputClass}
              placeholder="Ce qu'il veut cette session"
            />
            <textarea
              value={npc.playingTips}
              onChange={(event) =>
                setKeyNPCs((prev) =>
                  prev.map((n, i) =>
                    i === index ? { ...n, playingTips: event.target.value } : n,
                  ),
                )
              }
              rows={2}
              className={inputClass}
              placeholder="Comment le jouer"
            />
          </div>
        ))}
        {keyNPCs.length < MAX_NPCS && (
          <button
            type="button"
            onClick={() =>
              setKeyNPCs((prev) => [
                ...prev,
                { name: "", wantsThisSession: "", playingTips: "" },
              ])
            }
            className={secondaryButtonClass}
          >
            + Ajouter un PNJ
          </button>
        )}
      </div>

      <div>
        <label htmlFor="hooks" className={labelClass}>
          Accroches (une par ligne)
        </label>
        <textarea
          id="hooks"
          rows={3}
          value={hooks}
          onChange={(event) => setHooks(event.target.value)}
          className={inputClass}
          placeholder={"Une accroche par ligne…"}
        />
      </div>

      <div>
        <label htmlFor="complications" className={labelClass}>
          Complications (une par ligne)
        </label>
        <textarea
          id="complications"
          rows={3}
          value={complications}
          onChange={(event) => setComplications(event.target.value)}
          className={inputClass}
          placeholder={"Une complication par ligne…"}
        />
      </div>
    </fieldset>
  );
}

function splitList(value: string, separator: string): string[] {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

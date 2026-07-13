"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { detailScene } from "./actions";
import { secondaryButtonClass } from "@/components/form-styles";

function buildFormData(
  campaignId: string,
  sessionId: string,
  sceneIndex: number,
) {
  const fd = new FormData();
  fd.set("campaignId", campaignId);
  fd.set("sessionId", sessionId);
  fd.set("sceneIndex", String(sceneIndex));
  return fd;
}

// Per-scene "Approfondir" — one short call that fleshes out a single scene.
export function DetailSceneButton({
  campaignId,
  sessionId,
  sceneIndex,
}: {
  campaignId: string;
  sessionId: string;
  sceneIndex: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    const result = await detailScene(
      buildFormData(campaignId, sessionId, sceneIndex),
    );
    setPending(false);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Échec.");
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={secondaryButtonClass}
      >
        {pending ? "Génération…" : "✨ Approfondir cette scène"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

// "Tout approfondir" — fires one request per not-yet-detailed scene in
// parallel. Each request is its own short server call, so none approaches the
// serverless timeout; failures (e.g. rate limits) are isolated and the GM can
// retry those scenes individually.
export function DetailAllScenesButton({
  campaignId,
  sessionId,
  sceneIndexes,
}: {
  campaignId: string;
  sessionId: string;
  sceneIndexes: number[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setMessage(null);
    const results = await Promise.all(
      sceneIndexes.map((index) =>
        detailScene(buildFormData(campaignId, sessionId, index)),
      ),
    );
    setPending(false);
    router.refresh();
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) {
      setMessage(
        `${failed} scène(s) n'ont pas pu être approfondies — réessaie-les individuellement.`,
      );
    }
  }

  return (
    <div className="mb-4 print:hidden">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={secondaryButtonClass}
      >
        {pending
          ? `Génération de ${sceneIndexes.length} scène(s)…`
          : `✨ Tout approfondir (${sceneIndexes.length})`}
      </button>
      {message && <p className="mt-1 text-xs text-danger">{message}</p>}
    </div>
  );
}

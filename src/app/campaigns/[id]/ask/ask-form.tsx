"use client";

import { useState } from "react";
import { askCampaign } from "./actions";
import { inputClass, primaryButtonClass } from "@/components/form-styles";
import { GeneratingOverlay } from "@/components/generating-overlay";

const SUGGESTIONS = [
  "Quels PNJ ont un motif de nuire aux joueurs ?",
  "Résume les intrigues actives et leurs enjeux.",
  "Quels secrets ne sont pas encore connus des joueurs ?",
  "Quelles accroches proposer pour la prochaine session ?",
  "Rappelle-moi les liens entre les factions.",
];

export function AskForm({ campaignId }: { campaignId: string }) {
  const [question, setQuestion] = useState("");

  return (
    <form action={askCampaign} className="space-y-3">
      <input type="hidden" name="campaignId" value={campaignId} />

      <textarea
        name="question"
        required
        rows={3}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className={inputClass}
        placeholder="Pose une question sur ta campagne…"
      />

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuestion(suggestion)}
            className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted transition hover:border-primary hover:text-primary"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <button type="submit" className={primaryButtonClass}>
        Interroger
      </button>
      <GeneratingOverlay message="Consultation de la bible en cours…" />
    </form>
  );
}

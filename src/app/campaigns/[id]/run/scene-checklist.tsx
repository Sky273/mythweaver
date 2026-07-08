"use client";

import { useEffect, useState } from "react";
import type { SessionPrep } from "@/lib/llm/session-schema";

// Check scenes off as you run them. State is kept in the browser (localStorage,
// keyed by session) so it survives a refresh mid-session without needing any
// DB writes — it's a live play aid, not persisted campaign data.
export function SceneChecklist({
  sessionId,
  scenes,
}: {
  sessionId: string;
  scenes: SessionPrep["scenes"];
}) {
  const storageKey = `mw-run-scenes-${sessionId}`;
  const [done, setDone] = useState<boolean[]>(() => scenes.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === scenes.length) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDone(parsed.map(Boolean));
      }
    } catch {
      /* ignore malformed/unavailable storage */
    }
  }, [storageKey, scenes.length]);

  function toggle(index: number) {
    setDone((prev) => {
      const next = prev.map((value, i) => (i === index ? !value : value));
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <ol className="space-y-3">
      {scenes.map((scene, index) => (
        <li key={index} className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={done[index] ?? false}
            onChange={() => toggle(index)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          <div className={done[index] ? "opacity-50 line-through" : ""}>
            <p className="font-medium">
              {scene.title}
              {scene.locationName && (
                <span className="ml-2 text-xs font-normal text-muted no-underline">
                  {scene.locationName}
                </span>
              )}
            </p>
            {scene.summary && (
              <p className="text-sm text-muted">{scene.summary}</p>
            )}
            {scene.involvedNPCNames.length > 0 && (
              <p className="mt-1 text-xs text-muted">
                PNJ : {scene.involvedNPCNames.join(", ")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

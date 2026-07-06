"use client";

import { useState } from "react";
import { primaryButtonClass } from "@/components/form-styles";

export function RandomTableRoller({ entries }: { entries: string[] }) {
  const [rolled, setRolled] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => setRolled(entries[Math.floor(Math.random() * entries.length)])}
        className={primaryButtonClass}
      >
        Tirer au sort
      </button>
      {rolled && (
        <p className="mt-3 text-sm font-medium">{rolled}</p>
      )}
    </div>
  );
}

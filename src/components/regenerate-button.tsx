"use client";

import { useFormStatus } from "react-dom";
import { secondaryButtonClass } from "@/components/form-styles";

export function RegenerateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${secondaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Régénération en cours…" : "Régénérer"}
    </button>
  );
}

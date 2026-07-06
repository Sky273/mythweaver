"use client";

import { useFormStatus } from "react-dom";
import { primaryButtonClass } from "@/components/form-styles";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Génération en cours…" : "Générer le kit de session"}
    </button>
  );
}

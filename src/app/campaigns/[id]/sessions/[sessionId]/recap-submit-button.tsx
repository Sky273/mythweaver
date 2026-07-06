"use client";

import { useFormStatus } from "react-dom";
import { primaryButtonClass } from "@/components/form-styles";

export function RecapSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Analyse en cours…" : "Analyser et proposer des mises à jour"}
    </button>
  );
}

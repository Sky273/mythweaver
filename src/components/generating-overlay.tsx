"use client";

import { useFormStatus } from "react-dom";

// Must be rendered inside the <form> it watches (useFormStatus only sees the
// nearest enclosing form). Covers the whole viewport while the form's action
// is pending, so the user can't click away or navigate off mid-generation.
export function GeneratingOverlay({
  message = "Génération en cours…",
}: {
  message?: string;
}) {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-indigo-400" />
      <p className="max-w-xs text-center text-sm font-medium text-white">
        {message}
      </p>
    </div>
  );
}

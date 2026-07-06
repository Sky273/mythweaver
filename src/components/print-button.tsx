"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-sm text-indigo-500 hover:underline"
    >
      Imprimer
    </button>
  );
}

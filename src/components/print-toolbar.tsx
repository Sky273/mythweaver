"use client";

// A print/export bar shown on the dedicated printable pages. Hidden from the
// printed output itself (print:hidden). Clicking triggers the browser's print
// dialog, where the user picks "Enregistrer au format PDF".
export function PrintToolbar({ hint }: { hint: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 print:hidden">
      <p className="text-sm text-muted">{hint}</p>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-[0.98]"
      >
        🖨️ Enregistrer en PDF
      </button>
    </div>
  );
}

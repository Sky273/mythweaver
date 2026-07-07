export const labelClass = "block text-sm font-medium text-foreground";

export const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/70 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/30 focus-visible:outline-none";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-surface-hover active:scale-[0.98]";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-danger/40 bg-transparent px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft active:scale-[0.98]";

// Larger tap target than a bare text-xs link — meant for touch use (tablet at
// the table), not just mouse hover.
export const actionLinkClass =
  "inline-flex items-center rounded-md px-2.5 py-2 text-sm font-medium text-primary hover:bg-primary/10";

export const dangerActionLinkClass =
  "inline-flex items-center rounded-md px-2.5 py-2 text-sm font-medium text-danger hover:bg-danger-soft";

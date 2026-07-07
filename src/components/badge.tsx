type BadgeTone = "neutral" | "primary" | "accent" | "success" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-hover text-muted border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/12 text-accent border-accent/25",
  success: "bg-success/12 text-success border-success/25",
  danger: "bg-danger-soft text-danger border-danger/25",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

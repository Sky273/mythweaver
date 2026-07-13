// Presentational primitives shared by the printable GM and player bible pages.
// Server components (no interactivity) — the only client piece is PrintToolbar.

export function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-5">{children}</div>
    </section>
  );
}

export function PrintEntry({
  title,
  subtitle,
  image,
  children,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="break-inside-avoid border-b border-border/60 pb-4 last:border-b-0">
      <div className="flex items-start gap-3">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="h-16 w-16 shrink-0 rounded-md object-cover ring-1 ring-border"
          />
        )}
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </article>
  );
}

export function PrintProse({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
      {text}
    </p>
  );
}

export function PrintField({ label, value }: { label: string; value: string }) {
  return (
    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
      <span className="font-medium">{label} : </span>
      {value}
    </p>
  );
}

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-3">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-md"
          aria-label="Mythweaver — accueil"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <MarkGlyph />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Mythweaver
          </span>
        </Link>
      </div>
    </header>
  );
}

// A small arcane star/compass glyph used as the app's logo mark.
function MarkGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l2.4 6.9L21 12l-6.6 3.1L12 22l-2.4-6.9L3 12l6.6-3.1z" />
    </svg>
  );
}

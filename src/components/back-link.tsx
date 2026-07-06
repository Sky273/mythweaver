import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-block text-sm text-indigo-500 hover:underline print:hidden"
    >
      ← {label}
    </Link>
  );
}

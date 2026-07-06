import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 py-4">
        <Link href="/" className="text-lg font-semibold hover:opacity-80">
          Mythweaver
        </Link>
      </div>
    </header>
  );
}

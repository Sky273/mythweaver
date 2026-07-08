import { toggleReveal, RevealableKind } from "@/lib/campaign/revealable";

// One-click "reveal to players / hide from players" toggle, sitting next to
// the lock toggle in the bible. Owner-only (the action re-checks ownership).
export function RevealToggle({
  kind,
  id,
  campaignId,
  revealed,
}: {
  kind: RevealableKind;
  id: string;
  campaignId: string;
  revealed: boolean;
}) {
  return (
    <form action={toggleReveal} className="inline">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="nextRevealed" value={(!revealed).toString()} />
      <button
        type="submit"
        title={
          revealed
            ? "Visible par les joueurs — cliquer pour masquer"
            : "Masqué aux joueurs — cliquer pour révéler"
        }
        className="flex h-9 w-9 items-center justify-center rounded-md text-base opacity-70 hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-800 print:hidden"
      >
        {revealed ? "👁️" : "🙈"}
      </button>
    </form>
  );
}

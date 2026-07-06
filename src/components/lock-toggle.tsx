import { toggleLocked, LockableKind } from "@/lib/campaign/lockable";

export function LockToggle({
  kind,
  id,
  campaignId,
  locked,
}: {
  kind: LockableKind;
  id: string;
  campaignId: string;
  locked: boolean;
}) {
  return (
    <form action={toggleLocked} className="inline">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="nextLocked" value={(!locked).toString()} />
      <button
        type="submit"
        title={
          locked
            ? "Verrouillé (canon) — cliquer pour déverrouiller"
            : "Non verrouillé — cliquer pour verrouiller comme canon"
        }
        className="flex h-9 w-9 items-center justify-center rounded-md text-base opacity-70 hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-800 print:hidden"
      >
        {locked ? "🔒" : "🔓"}
      </button>
    </form>
  );
}

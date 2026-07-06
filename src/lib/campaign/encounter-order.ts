export type OrderableCombatant = {
  id: string;
  initiative: number;
  createdAt: Date;
};

export function sortCombatants<T extends OrderableCombatant>(combatants: T[]): T[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export function computeNextTurn(
  combatants: OrderableCombatant[],
  currentId: string | null,
): { nextId: string | null; roundIncremented: boolean } {
  if (combatants.length === 0) return { nextId: null, roundIncremented: false };

  const sorted = sortCombatants(combatants);
  if (!currentId) return { nextId: sorted[0].id, roundIncremented: false };

  const index = sorted.findIndex((c) => c.id === currentId);
  if (index === -1) return { nextId: sorted[0].id, roundIncremented: false };

  const nextIndex = (index + 1) % sorted.length;
  return { nextId: sorted[nextIndex].id, roundIncremented: nextIndex === 0 };
}

export function clampHP(value: number, maxHP: number | null): number {
  const min = 0;
  if (maxHP === null) return Math.max(min, value);
  return Math.max(min, Math.min(maxHP, value));
}

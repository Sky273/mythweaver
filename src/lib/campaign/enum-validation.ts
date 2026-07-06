export function parseRequiredEnum<T extends string>(
  raw: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
  fieldLabel: string,
): T {
  const value = String(raw ?? fallback);
  if (!(allowed as readonly string[]).includes(value)) {
    throw new Error(`${fieldLabel} invalide.`);
  }
  return value as T;
}

export function normalizeCategoryDescription(raw: unknown): string | null {
  const description = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");

  return description || null;
}

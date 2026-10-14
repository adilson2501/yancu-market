export type SuggestionCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type CategoryExample = {
  name: string;
  category_id: string;
};

const noiseTokens = new Set([
  "a",
  "de",
  "del",
  "el",
  "en",
  "g",
  "gr",
  "gramos",
  "kg",
  "kilo",
  "l",
  "litro",
  "litros",
  "ml",
  "mililitros",
  "unidad",
  "unidades",
]);

const strongRules = [
  { category: "gaseosas", terms: ["gaseosa", "gaseosas", "coca cola", "inca kola", "pepsi", "cola"] },
  { category: "leches", terms: ["leche", "leche evaporada", "leche condensada"] },
  { category: "mascotas", terms: ["mascota", "mascotas", "perro", "gato", "croquetas", "ricocan", "can alimento"] },
  { category: "utiles y papeleria", terms: ["pegamento", "adhesivo", "uhu", "cuaderno", "lapicero", "lapiz", "papeleria"] },
  { category: "cervezas", terms: ["cerveza", "cervezas"] },
  { category: "agua", terms: ["agua mineral", "agua sin gas", "agua con gas"] },
  { category: "jugos y nectares", terms: ["jugo", "jugos", "nectar", "nectares"] },
  { category: "galletas", terms: ["galleta", "galletas"] },
  { category: "chocolates y golosinas", terms: ["chocolate", "chocolates", "caramelo", "golosina", "golosinas"] },
  { category: "limpieza del hogar", terms: ["detergente", "lejia", "desinfectante", "limpiador"] },
  { category: "accesorios de limpieza", terms: ["escoba", "escobilla", "esponja", "paño", "panos"] },
  { category: "higiene personal", terms: ["shampoo", "jabón", "jabon", "desodorante", "pasta dental"] },
];

export function normalizeSuggestionText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulTokens(value: string): string[] {
  return normalizeSuggestionText(value)
    .split(" ")
    .filter((token) => token && !noiseTokens.has(token) && !/^\d+$/.test(token));
}

function categoryForKey(
  categories: SuggestionCategory[],
  key: string,
): SuggestionCategory | undefined {
  return categories.find((category) => normalizeSuggestionText(category.name) === key);
}

function containsPhrase(text: string, phrase: string): boolean {
  const textTokens = text.split(" ");
  const phraseTokens = phrase.split(" ");
  return textTokens.some((_, index) =>
    phraseTokens.every((token, offset) => textTokens[index + offset] === token),
  );
}

function chooseWinner(
  scores: Map<string, number>,
  minimum: number,
  minimumMargin: number,
): string | null {
  const ordered = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (!ordered[0] || ordered[0][1] < minimum) return null;
  if (ordered[1] && ordered[0][1] - ordered[1][1] < minimumMargin) return null;
  return ordered[0][0];
}

export function suggestProductCategory({
  productName,
  categories,
  existingProducts,
}: {
  productName: string;
  categories: SuggestionCategory[];
  existingProducts: CategoryExample[];
}): string | null {
  const activeCategories = categories.filter((category) => category.is_active);
  const activeIds = new Set(activeCategories.map((category) => category.id));
  const normalizedName = normalizeSuggestionText(productName);
  if (!normalizedName) return null;

  const strongScores = new Map<string, number>();
  for (const rule of strongRules) {
    const category = categoryForKey(activeCategories, rule.category);
    if (!category) continue;
    for (const term of rule.terms) {
      const normalizedTerm = normalizeSuggestionText(term);
      if (containsPhrase(normalizedName, normalizedTerm)) {
        strongScores.set(category.id, Math.max(strongScores.get(category.id) ?? 0, 100 + normalizedTerm.length));
      }
    }
  }

  const strongWinner = chooseWinner(strongScores, 100, 8);
  if (strongWinner) return strongWinner;
  if (strongScores.size > 0) return null;

  const productTokens = new Set(meaningfulTokens(productName));
  const evidenceScores = new Map<string, number>();
  for (const product of existingProducts) {
    if (!activeIds.has(product.category_id)) continue;
    const shared = meaningfulTokens(product.name).filter((token) => productTokens.has(token));
    if (shared.length === 0) continue;
    const score = shared.length * 25 + (shared.length >= 2 ? 15 : 0);
    evidenceScores.set(product.category_id, (evidenceScores.get(product.category_id) ?? 0) + score);
  }

  const evidenceWinner = chooseWinner(evidenceScores, 50, 20);
  if (evidenceWinner) return evidenceWinner;
  if (evidenceScores.size > 0) return null;

  const metadataScores = new Map<string, number>();
  for (const category of activeCategories) {
    const categoryTokens = new Set([
      ...meaningfulTokens(category.name),
      ...meaningfulTokens(category.description ?? ""),
    ]);
    const shared = [...productTokens].filter((token) => categoryTokens.has(token));
    if (shared.length > 0) metadataScores.set(category.id, shared.length * 10);
  }

  return chooseWinner(metadataScores, 20, 10);
}

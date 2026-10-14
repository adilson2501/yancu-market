import { describe, expect, it } from "vitest";
import {
  normalizeSuggestionText,
  suggestProductCategory,
  type CategoryExample,
  type SuggestionCategory,
} from "@/features/catalog/products/category-suggestion";

const categories: SuggestionCategory[] = [
  { id: "soda-id", name: "Gaseosas", description: "Bebidas gaseosas y colas.", is_active: true },
  { id: "milk-id", name: "Leches", description: "Leches evaporadas y condensadas.", is_active: true },
  { id: "pet-id", name: "Mascotas", description: "Alimentos para perros y gatos.", is_active: true },
  { id: "stationery-id", name: "Útiles y papelería", description: "Pegamentos, cuadernos y artículos escolares.", is_active: true },
  { id: "cleaning-id", name: "Limpieza del hogar", description: "Productos para limpiar la casa.", is_active: true },
  { id: "inactive-id", name: "Cervezas", description: null, is_active: false },
];

function suggest(productName: string, existingProducts: CategoryExample[] = []) {
  return suggestProductCategory({ productName, categories, existingProducts });
}

describe("product category suggestion", () => {
  it("normalizes case, accents, punctuation, and whitespace", () => {
    expect(normalizeSuggestionText("  Útiles,  y PAPELERÍA! ")).toBe("utiles y papeleria");
  });

  it.each([
    ["Inca Kola Original 3 L", "soda-id"],
    ["Coca-Cola Original 500 ml", "soda-id"],
    ["Gloria Leche Evaporada Entera 390 g", "milk-id"],
    ["Ricocan Adultos Carne 1 kg", "pet-id"],
    ["UHU Pegamento Universal 35 ml", "stationery-id"],
  ])("classifies %s using strong rules", (name, categoryId) => {
    expect(suggest(name)).toBe(categoryId);
  });

  it("ignores packaging differences when using existing products", () => {
    expect(
      suggest("Marca Especial Original 3 L", [
        { name: "Marca Especial Original 500 ml", category_id: "soda-id" },
      ]),
    ).toBe("soda-id");
  });

  it("gives deterministic rules priority over existing product evidence", () => {
    expect(
      suggest("Inca Kola Original 3 L", [
        { name: "Inca Kola Original 500 ml", category_id: "milk-id" },
      ]),
    ).toBe("soda-id");
  });

  it("uses category descriptions as weaker fallback evidence", () => {
    expect(suggest("Limpiar la casa con productos", [])).toBe("cleaning-id");
  });

  it("returns null for generic or ambiguous products", () => {
    expect(suggest("Producto premium")).toBeNull();
    expect(
      suggest("Especial original", [
        { name: "Especial original", category_id: "soda-id" },
        { name: "Especial original", category_id: "milk-id" },
      ]),
    ).toBeNull();
  });

  it("uses runtime IDs and ignores inactive or invalid evidence", () => {
    expect(suggest("Cerveza lager")).toBeNull();
    expect(
      suggest("Marca Especial Original", [
        { name: "Marca Especial Original", category_id: "missing-id" },
        { name: "Marca Especial Original", category_id: "inactive-id" },
      ]),
    ).toBeNull();
  });

  it("supports categories with null descriptions and missing expected categories", () => {
    expect(suggest("Producto sin contexto")).toBeNull();
    expect(
      suggestProductCategory({
        productName: "Inca Kola Original 3 L",
        categories: categories.filter((category) => category.id !== "soda-id"),
        existingProducts: [],
      }),
    ).toBeNull();
  });
});

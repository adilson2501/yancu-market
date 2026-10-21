import { describe, expect, it } from "vitest";

import {
  filterCategories,
  normalizeCategoryListText,
  paginateCategories,
} from "@/features/catalog/categories/category-list-utils";
import type { Category } from "@/features/catalog/categories/types";

const categories: Category[] = Array.from({ length: 25 }, (_, index) => ({
  id: `category-${index + 1}`,
  name: index === 0 ? "Lácteos" : `Categoría ${index + 1}`,
  description: index === 1 ? "Productos para el hogar" : null,
  is_active: true,
  created_at: `2026-10-${String(25 - index).padStart(2, "0")}T00:00:00Z`,
  updated_at: "2026-10-14T00:00:00Z",
}));

describe("category list utilities", () => {
  it("normalizes case, accents, punctuation, and whitespace", () => {
    expect(normalizeCategoryListText("  Lácteos,   y derivados ")).toBe("lacteos y derivados");
  });

  it("searches names and descriptions, including null descriptions", () => {
    expect(filterCategories(categories, "LACTEOS").map((category) => category.id)).toEqual(["category-1"]);
    expect(filterCategories(categories, "HOGAR").map((category) => category.id)).toEqual(["category-2"]);
    expect(filterCategories(categories, "inexistente")).toEqual([]);
  });

  it("paginates with the default page size and clamps invalid pages", () => {
    const firstPage = paginateCategories(categories, 1, 10);
    expect(firstPage.items).toHaveLength(10);
    expect(firstPage.totalPages).toBe(3);
    expect(paginateCategories(categories, 99, 10).page).toBe(3);
  });

  it("supports page sizes of 20 and 50", () => {
    expect(paginateCategories(categories, 1, 20).items).toHaveLength(20);
    expect(paginateCategories(categories, 1, 50).items).toHaveLength(25);
  });

  it("handles an empty collection", () => {
    expect(paginateCategories([], 4, 10)).toEqual({ items: [], page: 1, totalPages: 0 });
  });
});

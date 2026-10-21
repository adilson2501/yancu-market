import type { Category } from "@/features/catalog/categories/types";

export function normalizeCategoryListText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterCategories(categories: Category[], search: string): Category[] {
  const query = normalizeCategoryListText(search);
  if (!query) return categories;

  return categories.filter((category) =>
    normalizeCategoryListText(`${category.name} ${category.description ?? ""}`).includes(query),
  );
}

export function paginateCategories(
  categories: Category[],
  page: number,
  pageSize: number,
): { items: Category[]; page: number; totalPages: number } {
  const totalPages = categories.length === 0 ? 0 : Math.ceil(categories.length / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: categories.slice(start, start + pageSize),
    page: currentPage,
    totalPages,
  };
}

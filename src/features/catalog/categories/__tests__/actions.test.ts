import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeCategoryDescription } from "@/features/catalog/categories/normalization";

const insert = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const from = vi.fn(() => ({ insert, update }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

const { createCategory, updateCategory } = await import("@/features/catalog/categories/actions");

function formData(values: Record<string, string>): FormData {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

describe("category descriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insert.mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });
    eq.mockResolvedValue({ error: null });
  });

  it("collapses whitespace and keeps a description", () => {
    expect(normalizeCategoryDescription("  Productos   para\n limpiar  ")).toBe(
      "Productos para limpiar",
    );
  });

  it("converts blank descriptions to null", () => {
    expect(normalizeCategoryDescription("  ")).toBeNull();
    expect(normalizeCategoryDescription(null)).toBeNull();
  });

  it("allows existing categories with null descriptions", () => {
    expect(normalizeCategoryDescription(undefined)).toBeNull();
  });

  it("persists a normalized description on create", async () => {
    await createCategory({}, formData({
      name: "Limpieza",
      description: "  Productos   para\n limpiar ",
    }));

    expect(insert).toHaveBeenCalledWith({
      name: "Limpieza",
      description: "Productos para limpiar",
      is_active: true,
    });
  });

  it("persists null when an existing description is cleared", async () => {
    await updateCategory({}, formData({
      id: "category-id",
      name: "Limpieza",
      description: "   ",
      is_active: "on",
    }));

    expect(update).toHaveBeenCalledWith({
      name: "Limpieza",
      description: null,
      is_active: true,
    });
    expect(eq).toHaveBeenCalledWith("id", "category-id");
  });
});

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import { normalizeCategoryDescription } from "@/features/catalog/categories/normalization";

export type CategoryFormState = {
  error?: string;
  success?: boolean;
};

function normalizeName(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function categorySaveError(): string {
  return "No se pudo guardar la categoría. Intenta nuevamente.";
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const name = normalizeName(formData.get("name"));
  const description = normalizeCategoryDescription(formData.get("description"));

  if (!name) {
    return { error: "El nombre de la categoría es obligatorio." };
  }
  if (description && description.length > 500) {
    return { error: "La descripción admite máximo 500 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name, description, is_active: true });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese nombre." };
    }
    return { error: categorySaveError() };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = normalizeName(formData.get("name"));
  const description = normalizeCategoryDescription(formData.get("description"));
  const isActive = formData.get("is_active") === "on";

  if (!id) {
    return { error: "La categoría es obligatoria." };
  }
  if (!name) {
    return { error: "El nombre de la categoría es obligatorio." };
  }
  if (description && description.length > 500) {
    return { error: "La descripción admite máximo 500 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name, description, is_active: isActive })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya existe una categoría con ese nombre." };
    }
    return { error: categorySaveError() };
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCategory } from "@/features/catalog/categories/actions";

export function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(createCategory, {});

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="category-name">Nombre</Label>
        <Input
          id="category-name"
          name="name"
          type="text"
          required
          placeholder="Ej.: Bebidas"
        />
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">{state.error}</p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="category-description">Descripción (opcional)</Label>
        <Textarea
          id="category-description"
          name="description"
          maxLength={500}
          placeholder="Qué productos pertenecen aquí"
        />
      </div>
      <Button type="submit" disabled={pending} className="sm:shrink-0">
        {pending ? "Agregando…" : "Agregar categoría"}
      </Button>
    </form>
  );
}

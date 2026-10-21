"use client";

import { Pencil, Search } from "lucide-react";
import { useState } from "react";
import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { updateCategory, type CategoryFormState } from "@/features/catalog/categories/actions";
import { normalizeCategoryDescription } from "@/features/catalog/categories/normalization";
import {
  filterCategories,
  paginateCategories,
} from "@/features/catalog/categories/category-list-utils";
import type { Category } from "@/features/catalog/categories/types";

const pageSizes = [10, 20, 50] as const;

function normalizeCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function CategoryEditDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
}) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [isActive, setIsActive] = useState(category.is_active);
  const action = async (prevState: CategoryFormState, formData: FormData) => {
    const result = await updateCategory(prevState, formData);
    if (result.success) {
      onSaved({
        ...category,
        name: normalizeCategoryName(name),
        description: normalizeCategoryDescription(description),
        is_active: isActive,
      });
    }
    return result;
  };
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar categoría</DialogTitle>
        <DialogDescription>Actualiza los datos de esta categoría.</DialogDescription>
      </DialogHeader>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={category.id} />
        <div className="space-y-2">
          <Label htmlFor="edit-category-name">Nombre</Label>
          <Input
            id="edit-category-name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category-description">Descripción (opcional)</Label>
          <Textarea
            id="edit-category-description"
            name="description"
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            name="is_active"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={pending}
            className="size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          Activa
        </label>
        {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </DialogContent>
  );
}

export function CategoryAdminList({ categories }: { categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Category>>({});
  const currentCategories = categories.map((category) => overrides[category.id] ?? category);
  const filteredCategories = filterCategories(currentCategories, search);
  const pagination = paginateCategories(filteredCategories, page, pageSize);
  const hasCategories = categories.length > 0;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePageSize(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  function handleSaved(category: Category) {
    setOverrides((current) => ({ ...current, [category.id]: category }));
    setSelectedCategory(null);
  }

  if (!hasCategories) {
    return (
      <div className="py-10 text-center">
        <Badge variant="secondary">Catálogo sin categorías</Badge>
        <p className="mt-3 text-sm text-muted-foreground">Crea la primera categoría para comenzar a organizar productos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="category-search" className="sr-only">Buscar por nombre o descripción</label>
        <Input
          id="category-search"
          type="search"
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="pl-9"
        />
      </div>

      {pagination.items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No hay categorías que coincidan con tu búsqueda.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-full">Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((category) => (
                  <CategoryTableRow key={category.id} category={category} onEdit={setSelectedCategory} />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 sm:hidden">
            {pagination.items.map((category) => (
              <div key={category.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{category.name}</p>
                  <Badge variant={category.is_active ? "success" : "secondary"}>{category.is_active ? "Activa" : "Inactiva"}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{category.description || "Sin descripción"}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setSelectedCategory(category)}>
                  <Pencil aria-hidden="true" />Editar
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          Filas por página
          <select value={pageSize} onChange={(event) => handlePageSize(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <nav aria-label="Paginación de categorías" className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
          <span className="text-muted-foreground">Página {pagination.page} de {pagination.totalPages || 1}</span>
          <Button type="button" variant="outline" size="sm" disabled={pagination.totalPages === 0 || pagination.page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
        </nav>
      </div>

      <Dialog open={selectedCategory !== null} onOpenChange={(open) => { if (!open) setSelectedCategory(null); }}>
        {selectedCategory ? (
          <CategoryEditDialog
            key={selectedCategory.id}
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onSaved={handleSaved}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function CategoryTableRow({ category, onEdit }: { category: Category; onEdit: (category: Category) => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">{category.name}</TableCell>
      <TableCell className="max-w-0">
        <p className="line-clamp-2 text-muted-foreground">{category.description || "Sin descripción"}</p>
      </TableCell>
      <TableCell>
        <Badge variant={category.is_active ? "success" : "secondary"}>{category.is_active ? "Activa" : "Inactiva"}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(category)}>
          <Pencil aria-hidden="true" />Editar
        </Button>
      </TableCell>
    </TableRow>
  );
}

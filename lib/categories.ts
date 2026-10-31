import { apiRequest } from "./api";

export type Category = { id: string; name: string };
export type Subcategory = { id: string; name: string; category_id: string };

/** Catalog structure changes rarely; cache it for a few minutes. */
const CATALOG_CACHE = { revalidate: 300 };

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await apiRequest<{ categories: Category[] }>("/categories", {
      auth: false,
      next: CATALOG_CACHE,
    });
    return res.categories ?? [];
  } catch {
    return [];
  }
}

export async function fetchSubcategoriesFor(categoryId: string): Promise<Subcategory[]> {
  try {
    const res = await apiRequest<{ subcategories: Omit<Subcategory, "category_id">[] }>(
      `/categories/${encodeURIComponent(categoryId)}/subcategories`,
      { auth: false, next: CATALOG_CACHE }
    );
    return (res.subcategories ?? []).map((s) => ({ ...s, category_id: categoryId }));
  } catch {
    return [];
  }
}

/** Every subcategory across all categories. */
export async function fetchSubcategories(): Promise<Subcategory[]> {
  const categories = await fetchCategories();
  const lists = await Promise.all(categories.map((c) => fetchSubcategoriesFor(c.id)));
  return lists.flat().sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  return (await fetchCategories()).find((c) => c.id === id) ?? null;
}

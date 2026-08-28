import { createClient } from "./supabase/server";

export type Category = { id: string; name: string };
export type Subcategory = { id: string; name: string; category_id: string };

export async function fetchCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) return [];
  return data ?? [];
}

export async function fetchSubcategories(): Promise<Subcategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, name, category_id")
    .order("name");
  if (error) return [];
  return data ?? [];
}

export async function fetchCategoryById(
  id: string
): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

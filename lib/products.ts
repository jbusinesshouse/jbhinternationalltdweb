import { BATCH_SIZE, fisherYatesShuffle, formatProducts, PRODUCT_SELECT, ProductFeedItem } from "./productFeed";
import { fetchActiveAdvertisedProducts } from "./productAds";
import { createClient } from "./supabase/server";

export async function fetchProductFeed(options: {
  categoryId?: string;
  subcategoryId?: string;
  limit?: number;
} = {}): Promise<ProductFeedItem[]> {
  const { categoryId, subcategoryId, limit = BATCH_SIZE * 2 } = options;
  const supabase = await createClient();

  const advertised = await fetchActiveAdvertisedProducts({
    categoryId,
    subcategoryId,
  });
  const adIds = new Set(advertised.map((p) => p.id));

  let idQuery = supabase
    .from("products")
    .select("id")
    .eq("is_deleted", false)
    .eq("status", "active");

  if (categoryId) idQuery = idQuery.eq("category_id", categoryId);
  if (subcategoryId) idQuery = idQuery.eq("subcategory_id", subcategoryId);

  const { data: idRows, error } = await idQuery;
  if (error) return advertised;

  const organicIds = fisherYatesShuffle(
    (idRows ?? [])
      .map((r) => r.id)
      .filter((id) => !adIds.has(id))
  ).slice(0, limit);

  if (!organicIds.length) return advertised;

  const { data: products, error: prodError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", organicIds)
    .eq("is_deleted", false)
    .eq("status", "active");

  if (prodError || !products) return advertised;

  const productMap = new Map(products.map((p) => [p.id, p]));
  const organic = organicIds
    .map((id) => productMap.get(id))
    .filter(Boolean)
    .flatMap((p) => formatProducts([p!]));

  return [...advertised, ...organic];
}

export type ProductDetail = {
  id: string;
  name: string;
  price: string;
  moq: number;
  description: string;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  product_images: { image_url: string; is_main: boolean }[];
  seller: { id: string; store_name: string; avatar_url: string | null } | null;
  categories: { id: string; name: string } | null;
  subcategories: { id: string; name: string } | null;
};

export async function fetchProductById(
  id: string
): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      moq,
      description,
      seller_id,
      category_id,
      subcategory_id,
      product_images (image_url, is_main),
      seller:profiles (id, store_name, avatar_url),
      categories (id, name),
      subcategories (id, name)
    `
    )
    .eq("id", id)
    .eq("is_deleted", false)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as unknown as ProductDetail;
}

export async function searchProducts(query: string): Promise<ProductFeedItem[]> {
  const supabase = await createClient();
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  let q = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_deleted", false)
    .eq("status", "active");

  for (const term of terms) {
    q = q.ilike("name", `%${term}%`);
  }

  const { data, error } = await q.limit(48);
  if (error || !data) return [];
  return formatProducts(data);
}

export async function fetchStoreProducts(
  sellerId: string
): Promise<ProductFeedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("seller_id", sellerId)
    .eq("is_deleted", false)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(48);

  if (error || !data) return [];
  return formatProducts(data);
}

export async function fetchStoreProfile(sellerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, store_name, avatar_url, address, district, store_type")
    .eq("id", sellerId)
    .single();
  if (error) return null;
  return data;
}

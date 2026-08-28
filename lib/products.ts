import { BATCH_SIZE, fisherYatesShuffle, formatProducts, PRODUCT_SELECT, ProductFeedItem } from "./productFeed";
import { fetchActiveAdvertisedProducts } from "./productAds";
import { createClient } from "./supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const ID_PAGE_SIZE = 1000;

async function fetchAllActiveProductIds(
  supabase: SupabaseClient,
  options: {
    categoryId?: string;
    subcategoryId?: string;
    excludeIds?: Set<string>;
  } = {}
): Promise<string[]> {
  const { categoryId, subcategoryId, excludeIds = new Set() } = options;
  const allIds: string[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("products")
      .select("id")
      .eq("is_deleted", false)
      .eq("status", "active")
      .range(from, from + ID_PAGE_SIZE - 1);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);

    const { data, error } = await query;
    if (error || !data?.length) break;

    for (const row of data) {
      if (!excludeIds.has(row.id)) allIds.push(row.id);
    }

    if (data.length < ID_PAGE_SIZE) break;
    from += ID_PAGE_SIZE;
  }

  return allIds;
}

export async function fetchProductsByIds(
  ids: string[]
): Promise<ProductFeedItem[]> {
  if (!ids.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("is_deleted", false)
    .eq("status", "active");

  if (error || !data) return [];

  const productMap = new Map(data.map((p) => [p.id, p]));
  return ids
    .map((id) => productMap.get(id))
    .filter(Boolean)
    .flatMap((p) => formatProducts([p!]));
}

export async function fetchInitialProductFeed(options: {
  categoryId?: string;
  subcategoryId?: string;
} = {}) {
  const { categoryId, subcategoryId } = options;
  const supabase = await createClient();

  const advertised = await fetchActiveAdvertisedProducts({
    categoryId,
    subcategoryId,
  });
  const adIds = new Set(advertised.map((p) => p.id));

  const organicIds = fisherYatesShuffle(
    await fetchAllActiveProductIds(supabase, {
      categoryId,
      subcategoryId,
      excludeIds: adIds,
    })
  );

  const firstBatchIds = organicIds.slice(0, BATCH_SIZE);
  const organic = await fetchProductsByIds(firstBatchIds);

  return {
    products: [...advertised, ...organic],
    organicIds,
    nextOffset: firstBatchIds.length,
  };
}

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

  const organicIds = fisherYatesShuffle(
    await fetchAllActiveProductIds(supabase, {
      categoryId,
      subcategoryId,
      excludeIds: adIds,
    })
  ).slice(0, limit);

  if (!organicIds.length) return advertised;

  const organic = await fetchProductsByIds(organicIds);
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

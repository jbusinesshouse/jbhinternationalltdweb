import {
  fisherYatesShuffle,
  formatProducts,
  PRODUCT_SELECT,
  ProductFeedItem,
} from "./productFeed";
import { createClient } from "./supabase/server";

export const AD_FEED_ALL_MAX = 30;
export const AD_FEED_ALL_MIN = 20;
export const AD_FEED_CATEGORY_MAX = 20;

export type AdvertisedProduct = ProductFeedItem & { isSponsored: true };

function resolveLimit(categoryId?: string, explicit?: number): number {
  if (typeof explicit === "number" && explicit > 0) return explicit;
  if (categoryId) return AD_FEED_CATEGORY_MAX;
  return (
    AD_FEED_ALL_MIN +
    Math.floor(Math.random() * (AD_FEED_ALL_MAX - AD_FEED_ALL_MIN + 1))
  );
}

export async function fetchActiveAdvertisedProducts(options: {
  categoryId?: string;
  subcategoryId?: string;
  limit?: number;
} = {}): Promise<AdvertisedProduct[]> {
  const { categoryId, subcategoryId, limit: explicitLimit } = options;
  const supabase = await createClient();
  const now = new Date().toISOString();
  const limit = resolveLimit(categoryId, explicitLimit);

  const { data: adRows, error: adError } = await supabase
    .from("product_ads")
    .select("product_id")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now);

  if (adError || !adRows?.length) return [];

  const productIds = [...new Set(adRows.map((r) => r.product_id))];
  const shuffled = fisherYatesShuffle(productIds).slice(0, limit);

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", shuffled)
    .eq("is_deleted", false)
    .eq("status", "active");

  if (categoryId) query = query.eq("category_id", categoryId);
  if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);

  const { data, error } = await query;
  if (error || !data) return [];

  const productMap = new Map(data.map((p) => [p.id, p]));
  return shuffled
    .map((id) => productMap.get(id))
    .filter(Boolean)
    .map((p) => {
      const formatted = formatProducts([p!])[0];
      return { ...formatted, isSponsored: true as const };
    });
}

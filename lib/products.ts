import { serverApi } from "./api-server";
import { fetchCategories } from "./categories";
import { fetchActiveAdvertisedProducts } from "./productAds";
import { BATCH_SIZE, type ProductFeedItem } from "./productFeed";

export type CatalogStoreTypeFilter = "all" | "retail" | "wholesale";

export function parseCatalogStoreType(
  raw: string | undefined | null
): CatalogStoreTypeFilter {
  if (raw === "retail" || raw === "wholesale") return raw;
  return "all";
}

type FeedFilter = {
  categoryId?: string;
  subcategoryId?: string;
  sellerId?: string;
  storeType?: CatalogStoreTypeFilter;
  excludeIds?: string[];
};

function feedQuery(f: FeedFilter): string {
  const params = new URLSearchParams();
  if (f.categoryId) params.set("categoryId", f.categoryId);
  if (f.subcategoryId) params.set("subcategoryId", f.subcategoryId);
  if (f.sellerId) params.set("sellerId", f.sellerId);
  if (f.storeType && f.storeType !== "all") params.set("storeType", f.storeType);
  if (f.excludeIds?.length) params.set("exclude", f.excludeIds.join(","));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Shuffled ids of every listable product for a filter (the API applies seller/status rules). */
export async function fetchFeedIds(filter: FeedFilter = {}): Promise<string[]> {
  try {
    const res = await serverApi<{ ids: string[] }>(`/feed/ids${feedQuery(filter)}`);
    return res.ids ?? [];
  } catch {
    return [];
  }
}

export async function fetchProductsByIds(ids: string[]): Promise<ProductFeedItem[]> {
  if (!ids.length) return [];
  try {
    const res = await serverApi<{ products: ProductFeedItem[] }>("/feed/batch", {
      method: "POST",
      body: { ids },
    });
    return res.products ?? [];
  } catch {
    return [];
  }
}

/** Sponsored products first, then the first organic batch; `organicIds` drives "load more". */
export async function fetchInitialProductFeed(
  options: { categoryId?: string; subcategoryId?: string; storeType?: CatalogStoreTypeFilter } = {}
) {
  // Ads and the id list are independent: fetch together, then drop sponsored ids.
  const [advertised, allIds] = await Promise.all([
    fetchActiveAdvertisedProducts(options),
    fetchFeedIds(options),
  ]);
  const adIds = new Set(advertised.map((p) => p.id));
  const organicIds = allIds.filter((id) => !adIds.has(id));
  const firstBatchIds = organicIds.slice(0, BATCH_SIZE);
  const organic = await fetchProductsByIds(firstBatchIds);

  return {
    products: [...advertised, ...organic],
    organicIds,
    nextOffset: firstBatchIds.length,
  };
}

export async function fetchProductFeed(
  options: { categoryId?: string; subcategoryId?: string; limit?: number } = {}
): Promise<ProductFeedItem[]> {
  const { limit = BATCH_SIZE * 2, ...filter } = options;
  const [advertised, allIds] = await Promise.all([
    fetchActiveAdvertisedProducts(filter),
    fetchFeedIds(filter),
  ]);
  const adIds = new Set(advertised.map((p) => p.id));
  const ids = allIds.filter((id) => !adIds.has(id)).slice(0, limit);
  const organic = await fetchProductsByIds(ids);
  return [...advertised, ...organic];
}

export type ProductSizeOption = {
  id: string;
  size_id: string;
  size: string | null;
  stock: number;
  sizes?: { id: string; label: string } | null;
};

export type ProductVariantOption = {
  id: string;
  color: string;
  product_sizes: ProductSizeOption[];
};

export type ProductReview = {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type ProductDetail = {
  id: string;
  name: string;
  /** Buyer-facing (VAT-inclusive). */
  price: number | string;
  price_base: number;
  vat_rate: number;
  vat_amount: number;
  seller_store_type?: string | null;
  moq: number;
  description: string;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  product_images: { image_url: string; is_main: boolean; sort_order?: number }[];
  product_variants: ProductVariantOption[];
  seller: { id: string; store_name: string; avatar_url: string | null; district?: string | null } | null;
  categories: { id: string; name: string } | null;
  subcategories: { id: string; name: string } | null;
  rating: { average: number; count: number };
  reviews: ProductReview[];
};

type ApiProduct = Omit<ProductDetail, "seller" | "categories" | "subcategories" | "rating" | "reviews"> & {
  profiles?: ProductDetail["seller"];
};

export async function fetchProductById(id: string): Promise<ProductDetail | null> {
  try {
    const res = await serverApi<{
      product: ApiProduct;
      rating: ProductDetail["rating"];
      reviews: ProductReview[];
    }>(`/products/${encodeURIComponent(id)}`);
    const p = res.product;
    const categories = p.category_id ? await fetchCategories() : [];
    const category = categories.find((c) => c.id === p.category_id) ?? null;
    return {
      ...p,
      product_images: [...(p.product_images ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
      product_variants: p.product_variants ?? [],
      seller: p.profiles ?? null,
      categories: category,
      subcategories: null,
      rating: res.rating ?? { average: 0, count: 0 },
      reviews: res.reviews ?? [],
    };
  } catch {
    return null;
  }
}

export async function searchProducts(
  query: string,
  options?: { storeType?: CatalogStoreTypeFilter }
): Promise<ProductFeedItem[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({ q });
  if (options?.storeType && options.storeType !== "all") {
    params.set("storeType", options.storeType);
  }
  try {
    const res = await serverApi<{ products: ProductFeedItem[] }>(
      `/products/search?${params.toString()}`
    );
    return res.products ?? [];
  } catch {
    return [];
  }
}

export async function fetchStoreProducts(sellerId: string): Promise<ProductFeedItem[]> {
  try {
    const res = await serverApi<{ products: ProductFeedItem[] }>(
      `/profiles/${encodeURIComponent(sellerId)}/products`,
      { auth: false }
    );
    return res.products ?? [];
  } catch {
    return [];
  }
}

export type StoreProfile = {
  id: string;
  store_name: string | null;
  full_name?: string | null;
  avatar_url: string | null;
  address: string | null;
  district: string | null;
  upazila?: string | null;
  store_type: string | null;
};

export async function fetchStoreProfile(sellerId: string): Promise<StoreProfile | null> {
  try {
    const res = await serverApi<{ profile: StoreProfile }>(
      `/profiles/${encodeURIComponent(sellerId)}`,
      { auth: false }
    );
    return res.profile ?? null;
  } catch {
    return null;
  }
}

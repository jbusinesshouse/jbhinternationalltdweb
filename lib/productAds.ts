import { serverApi } from "./api-server";
import type { ProductFeedItem } from "./productFeed";

export type AdvertisedProduct = ProductFeedItem & { isSponsored: true };

/** Currently running sponsored products (the API picks and shuffles them). */
export async function fetchActiveAdvertisedProducts(
  options: {
    categoryId?: string;
    subcategoryId?: string;
    storeType?: "all" | "retail" | "wholesale";
  } = {}
): Promise<AdvertisedProduct[]> {
  const params = new URLSearchParams();
  if (options.categoryId) params.set("categoryId", options.categoryId);
  if (options.subcategoryId) params.set("subcategoryId", options.subcategoryId);
  if (options.storeType && options.storeType !== "all") params.set("storeType", options.storeType);
  const qs = params.toString();
  try {
    const res = await serverApi<{ products: ProductFeedItem[] }>(
      `/feed/ads${qs ? `?${qs}` : ""}`
    );
    return (res.products ?? []).map((p) => ({ ...p, isSponsored: true as const }));
  } catch {
    return [];
  }
}

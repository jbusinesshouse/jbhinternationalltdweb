import { apiRequest } from "./api";

export const FEATURED_STORES_LIMIT = 16;

export type FeaturedStore = {
  id: string;
  store_name: string | null;
  avatar_url: string | null;
};

export async function fetchActiveFeaturedStores(): Promise<FeaturedStore[]> {
  try {
    const res = await apiRequest<{ stores: FeaturedStore[] }>("/feed/featured-stores", {
      auth: false,
    });
    return (res.stores ?? []).slice(0, FEATURED_STORES_LIMIT);
  } catch {
    return [];
  }
}

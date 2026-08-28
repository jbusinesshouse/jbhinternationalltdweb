import { fisherYatesShuffle } from "./productFeed";
import { createClient } from "./supabase/server";

export const FEATURED_STORES_LIMIT = 16;

export type FeaturedStore = {
  id: string;
  store_name: string | null;
  avatar_url: string | null;
};

export async function fetchActiveFeaturedStores(): Promise<FeaturedStore[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: featuredRows, error: featuredError } = await supabase
    .from("featured_stores")
    .select("seller_id")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now);

  if (featuredError || !featuredRows?.length) return [];

  const sellerIds = [
    ...new Set(
      featuredRows
        .map((row) => row.seller_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  if (!sellerIds.length) return [];

  const selectedIds = fisherYatesShuffle(sellerIds).slice(
    0,
    FEATURED_STORES_LIMIT
  );

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, store_name, avatar_url")
    .in("id", selectedIds);

  if (profilesError) return [];

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  return selectedIds
    .map((id) => profileMap.get(id))
    .filter((store): store is FeaturedStore => store != null);
}

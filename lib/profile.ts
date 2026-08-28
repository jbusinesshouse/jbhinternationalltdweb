import type { User } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  store_name: string | null;
  avatar_url: string | null;
  store_type: "wholesale" | "retail" | null;
  address: string | null;
  district: string | null;
  upazila: string | null;
  status: "active" | "freeze" | "restricted" | null;
  default_delivery_address_id: string | null;
};

export function normalizeProfile(
  data: Record<string, unknown>,
  user?: User | null
): UserProfile {
  return {
    id: String(data.id),
    full_name: (data.full_name as string | null) ?? null,
    email: (data.email as string | null) ?? user?.email ?? null,
    phone: (data.phone as string | null) ?? null,
    store_name: (data.store_name as string | null) ?? null,
    avatar_url: (data.avatar_url as string | null) ?? null,
    store_type: (data.store_type as UserProfile["store_type"]) ?? null,
    address: (data.address as string | null) ?? null,
    district: (data.district as string | null) ?? null,
    upazila: (data.upazila as string | null) ?? null,
    status: (data.status as UserProfile["status"]) ?? null,
    default_delivery_address_id:
      (data.default_delivery_address_id as string | null) ?? null,
  };
}

export function buildShellProfile(user: User): UserProfile {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return {
    id: user.id,
    full_name: fullName,
    email: user.email ?? null,
    phone: null,
    store_name: fullName ?? user.email?.split("@")[0] ?? "My Store",
    avatar_url: null,
    store_type: "retail",
    address: null,
    district: null,
    upazila: null,
    status: "active",
    default_delivery_address_id: null,
  };
}

export function canPlaceOrders(
  profile: Pick<UserProfile, "store_type" | "status"> | null
): boolean {
  if (!profile) return false;
  if (profile.store_type !== "retail") return false;
  if (profile.status && profile.status !== "active") return false;
  return true;
}

export function getOrderBlockReason(
  profile: Pick<UserProfile, "store_type" | "status"> | null
): string | null {
  if (!profile) return "Sign in with a retail account to place orders.";
  if (profile.store_type === "wholesale") {
    return "Wholesale accounts sell products. Only retail accounts can place orders.";
  }
  if (profile.status === "freeze") {
    return "Your account is frozen. You cannot place orders right now.";
  }
  if (profile.status === "restricted") {
    return "Your account is restricted. You cannot place orders right now.";
  }
  return null;
}

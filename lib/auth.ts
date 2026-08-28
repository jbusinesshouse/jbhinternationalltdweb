import { createClient } from "./supabase/server";

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

const PROFILE_SELECT =
  "id, full_name, email, phone, store_name, avatar_url, store_type, address, district, upazila, status, default_delivery_address_id";

export async function getAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: (profile as UserProfile | null) ?? null,
  };
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session.user) {
    return null;
  }
  return session;
}

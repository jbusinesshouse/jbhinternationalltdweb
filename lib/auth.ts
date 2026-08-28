import { createClient } from "./supabase/server";

export type UserProfile = {
  id: string;
  full_name: string | null;
  store_name: string | null;
  avatar_url: string | null;
  store_type: "wholesale" | "retail" | null;
};

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
    .select("id, full_name, store_name, avatar_url, store_type")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: (profile as UserProfile | null) ?? null,
  };
}

import { createClient } from "./supabase/server";
import type { User } from "@supabase/supabase-js";
import {
  buildShellProfile,
  normalizeProfile,
  type UserProfile,
} from "./profile";

export type { UserProfile } from "./profile";

export async function fetchProfileForUser(
  user: User
): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile fetch error:", error.message);
    return null;
  }

  if (!data) return null;
  return normalizeProfile(data as Record<string, unknown>, user);
}

export async function getAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await fetchProfileForUser(user);

  return {
    user,
    profile: profile ?? buildShellProfile(user),
  };
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session.user) {
    return null;
  }
  return session;
}

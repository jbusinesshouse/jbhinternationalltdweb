import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { apiRequest } from "./api";
import { createClient } from "./supabase/server";
import {
  buildShellProfile,
  normalizeProfile,
  type UserProfile,
} from "./profile";

export type { UserProfile } from "./profile";

export async function fetchProfileForUser(
  user: User,
  accessToken: string | null
): Promise<UserProfile | null> {
  if (!accessToken) return null;
  try {
    const res = await apiRequest<{ profile: Record<string, unknown> | null }>(
      "/profiles/me",
      { auth: true, accessToken }
    );
    return res.profile ? normalizeProfile(res.profile, user) : null;
  } catch (err) {
    console.error("Profile fetch error:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Signed-in user + profile for this request (deduped across layout/page). */
export const getAuthSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data } = await supabase.auth.getSession();
  const profile = await fetchProfileForUser(user, data.session?.access_token ?? null);

  return {
    user,
    profile: profile ?? buildShellProfile(user),
  };
});

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session.user) {
    return null;
  }
  return session;
}

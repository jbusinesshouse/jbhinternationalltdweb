/**
 * Server-side API calls (server components, route handlers, metadata).
 * Forwards the signed-in user's Supabase session from cookies to the BFF.
 * Import only from server code — it reads cookies via `next/headers`.
 */
import { apiRequest, type ApiRequestOptions } from "./api";
import { createClient } from "./supabase/server";

export async function getServerAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function serverApi<T>(
  path: string,
  options: Omit<ApiRequestOptions, "accessToken"> = {}
): Promise<T> {
  const mode = options.auth ?? "optional";
  const accessToken = mode === false ? null : await getServerAccessToken();
  return apiRequest<T>(path, { ...options, accessToken });
}

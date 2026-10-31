/**
 * JSON client for the Express BFF (`NEXT_PUBLIC_API_URL`, e.g. https://api…/api/v1).
 *
 * The database only accepts the API's service role (RLS lockdown), so every read and
 * write goes through here — never `supabase.from(...)` from the website.
 *
 * Auth: in the browser the signed-in user's Supabase access token is attached
 * automatically. On the server pass `accessToken` (see `lib/api-server.ts`).
 * Shape matches the mobile app's `lib/api.ts` so its API helpers can be shared.
 */
import { createClient } from "./supabase/client";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function assertApiUrl() {
  if (!API_URL) {
    throw new ApiError(
      "API URL is not configured. Set NEXT_PUBLIC_API_URL in .env.local",
      500
    );
  }
}

function resolvePath(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

let browserClient: ReturnType<typeof createClient> | null = null;

/** Signed-in user's access token in the browser; null on the server or when signed out. */
async function getBrowserAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  browserClient ??= createClient();
  const { data } = await browserClient.auth.getSession();
  return data.session?.access_token ?? null;
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function throwIfNotOk(res: Response, json: unknown): void {
  if (res.ok) return;
  const errObj = json as { error?: string; code?: string } | null;
  throw new ApiError(
    errObj?.error || `Request failed (${res.status})`,
    res.status,
    errObj?.code
  );
}

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  /**
   * true: require a token · "optional" (default): send it when signed in · false: never.
   */
  auth?: boolean | "optional";
  /** Explicit token (server code). Overrides the browser session lookup. */
  accessToken?: string | null;
  signal?: AbortSignal;
  /** Sent as Idempotency-Key so retried mutations (orders) are applied once. */
  idempotencyKey?: string;
  /** Next.js fetch cache hint for server-side reads, e.g. { revalidate: 60 }. */
  next?: { revalidate?: number | false; tags?: string[] };
};

async function authHeader(
  options: Pick<ApiRequestOptions, "auth" | "accessToken">
): Promise<string | null> {
  const mode = options.auth ?? "optional";
  if (mode === false) return null;
  const token =
    options.accessToken !== undefined
      ? options.accessToken
      : await getBrowserAccessToken();
  if (!token && mode === true) throw new ApiError("Not signed in", 401);
  return token ? `Bearer ${token}` : null;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  assertApiUrl();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
  const auth = await authHeader(options);
  if (auth) headers.Authorization = auth;

  const res = await fetch(resolvePath(path), {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    // Personalised (authed) responses must never be cached across users.
    ...(options.next && !auth ? { next: options.next } : { cache: "no-store" as const }),
  });

  const json = await parseJsonResponse(res);
  throwIfNotOk(res, json);
  return json as T;
}

/** Multipart upload. Content-Type is left to fetch so the boundary is set. */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: Pick<ApiRequestOptions, "auth" | "accessToken" | "signal"> & {
    method?: "POST" | "PUT" | "PATCH";
  } = {}
): Promise<T> {
  assertApiUrl();
  const headers: Record<string, string> = { Accept: "application/json" };
  const auth = await authHeader({ auth: options.auth ?? true, accessToken: options.accessToken });
  if (auth) headers.Authorization = auth;

  const res = await fetch(resolvePath(path), {
    method: options.method ?? "POST",
    headers,
    body: formData,
    signal: options.signal,
  });

  const json = await parseJsonResponse(res);
  throwIfNotOk(res, json);
  return json as T;
}

/** Stable-enough client key for one user action (retry-safe). */
export function newIdempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export async function requestGuestOrderOtp(phone: string) {
  return apiRequest<{
    phone: string;
    expiresInSeconds: number;
    debugOtp?: string;
  }>("/guest/orders/otp", {
    method: "POST",
    body: { phone },
    auth: false,
  });
}

export async function placeGuestOrder(
  body: {
    phone: string;
    otp: string;
    full_name: string;
    email?: string | null;
    city: string;
    address: string;
    product_id: string;
    items: Array<{ variant_id: string; size_id: string; quantity: number }>;
  },
  idempotencyKey?: string
) {
  return apiRequest<{ orderId: string; message?: string }>("/guest/orders", {
    method: "POST",
    body,
    auth: false,
    idempotencyKey,
  });
}

/** Whether no-account (SMS OTP) checkout is switched on in the API. */
export async function fetchGuestCheckoutEnabled(): Promise<boolean> {
  try {
    const res = await apiRequest<{ enabled: boolean }>("/guest/orders/config", {
      auth: false,
      next: { revalidate: 60 },
    });
    return Boolean(res.enabled);
  } catch {
    return false;
  }
}

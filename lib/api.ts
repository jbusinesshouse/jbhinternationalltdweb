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

export async function apiRequest<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  }
): Promise<T> {
  assertApiUrl();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(
    `${API_URL}${path.startsWith("/") ? path : `/${path}`}`,
    {
      method: options?.method ?? (options?.body !== undefined ? "POST" : "GET"),
      headers,
      body:
        options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    }
  );

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const errObj = json as { error?: string; code?: string } | null;
    throw new ApiError(
      errObj?.error || `Request failed (${res.status})`,
      res.status,
      errObj?.code
    );
  }

  return json as T;
}

export async function requestGuestOrderOtp(phone: string) {
  return apiRequest<{
    phone: string;
    expiresInSeconds: number;
    debugOtp?: string;
  }>("/guest/orders/otp", {
    method: "POST",
    body: { phone },
  });
}

export async function placeGuestOrder(body: {
  phone: string;
  otp: string;
  full_name: string;
  email?: string | null;
  city: string;
  address: string;
  product_id: string;
  items: Array<{ variant_id: string; size_id: string; quantity: number }>;
}) {
  return apiRequest<{ orderId: string; message?: string }>("/guest/orders", {
    method: "POST",
    body,
  });
}

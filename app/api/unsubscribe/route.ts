import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Unsubscribe endpoint on the main website, so emails never need to point at the API host.
 *
 * - POST: used by the /unsubscribe page's confirm button (same origin, so no CORS) and by mail
 *   clients' one-click unsubscribe (RFC 8058 `List-Unsubscribe-Post`). The signed link is
 *   verified by the backend; this route only forwards it server-to-server.
 * - GET: never unsubscribes (mail scanners prefetch links). It sends people to the confirmation page.
 */
export async function POST(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("e")?.trim() ?? "";
  const token = request.nextUrl.searchParams.get("t")?.trim() ?? "";

  if (!email || !token || email.length > 254 || token.length > 200) {
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  }

  try {
    await apiRequest(
      `/email/unsubscribe?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`,
      { method: "POST", body: {}, auth: false }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not unsubscribe right now" }, { status: 502 });
  }
}

export function GET(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/unsubscribe";
  return NextResponse.redirect(target);
}

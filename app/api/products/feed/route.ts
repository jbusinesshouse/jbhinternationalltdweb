import { NextRequest, NextResponse } from "next/server";
import { fetchProductsByIds } from "@/lib/products";

export async function POST(request: NextRequest) {
  let body: { ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const products = await fetchProductsByIds(ids);
  return NextResponse.json({ products });
}

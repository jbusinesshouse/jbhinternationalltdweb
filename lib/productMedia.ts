import { apiRequest, apiUpload } from "@/lib/api";


export function plainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePositiveNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export type UploadedProductImage = {
  publicUrl: string;
  path: string;
};

function productIdFromFolder(folder?: string): string | null {
  const match = folder?.match(
    /products\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return match?.[1] ?? null;
}

/** Upload via the API (`/uploads/product-image`); storage writes need the service role. */
export async function uploadProductImageFile(
  file: File,
  folder?: string
): Promise<UploadedProductImage> {
  const form = new FormData();
  form.append("file", file, file.name || `product_${Date.now()}.jpg`);
  const productId = productIdFromFolder(folder);
  if (productId) form.append("productId", productId);

  const uploaded = await apiUpload<UploadedProductImage>("/uploads/product-image", form);
  if (!uploaded?.path || !uploaded?.publicUrl) throw new Error("ছবি আপলোড করা যায়নি");
  return uploaded;
}

export async function removeProductStoragePaths(paths: string[]): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return;
  try {
    await apiRequest("/uploads/product-images", {
      method: "DELETE",
      body: { paths: unique },
      auth: true,
    });
  } catch (error) {
    console.warn("[productMedia] storage cleanup failed:", error);
  }
}

/** Soft-delete a product after a failed multi-step create. */
export async function softDeleteProduct(productId: string): Promise<void> {
  await apiRequest(`/products/${productId}`, { method: "DELETE", auth: true });
}

/**
 * Upload the signed-in user's avatar. Pass `accessToken` right after sign-up,
 * before the browser session is readable.
 */
export async function uploadAvatarFile(
  file: File,
  accessToken?: string | null
): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name || "avatar.jpg");
  const uploaded = await apiUpload<{ path: string; publicUrl: string }>(
    "/uploads/avatar",
    form,
    accessToken !== undefined ? { accessToken } : {}
  );
  return uploaded.publicUrl;
}

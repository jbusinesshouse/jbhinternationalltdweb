import { supabase } from "@/lib/supabase/browser";

const BUCKET = "product-images";

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

export async function uploadProductImageFile(
  file: File,
  folder: string
): Promise<UploadedProductImage> {
  const path = `${folder}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}.jpg`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error || !data?.path) {
    throw new Error(error?.message || "Image upload failed");
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return { publicUrl: urlData.publicUrl, path: data.path };
}

export async function removeProductStoragePaths(
  paths: string[]
): Promise<void> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return;
  await supabase.storage.from(BUCKET).remove(unique);
}

export async function softDeleteProduct(productId: string): Promise<void> {
  await supabase
    .from("products")
    .update({ is_deleted: true, active: false })
    .eq("id", productId);
}

export async function uploadAvatarFile(
  userId: string,
  file: File
): Promise<string> {
  const filePath = `${userId}.jpg`;
  const { error } = await supabase.storage
    .from("profile-images")
    .upload(filePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("profile-images")
    .getPublicUrl(filePath);

  return `${data.publicUrl}?t=${Date.now()}`;
}

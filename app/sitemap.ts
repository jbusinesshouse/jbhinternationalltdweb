import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jbhinternational.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/download`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/sign-up`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = await createClient();
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("is_deleted", false)
      .eq("status", "active")
      .limit(500);

    const productPages: MetadataRoute.Sitemap = (products ?? []).map(
      (product) => ({
        url: `${siteUrl}/products/${product.id}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })
    );

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}

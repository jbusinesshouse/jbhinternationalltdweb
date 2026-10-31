import type { MetadataRoute } from "next";
import { apiRequest } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jbhinternationallimited.com"
  ).replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/download`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const { ids } = await apiRequest<{ ids: string[] }>("/feed/ids", {
      auth: false,
      next: { revalidate: 3600 },
    });
    const productPages: MetadataRoute.Sitemap = (ids ?? []).slice(0, 5000).map((id) => ({
      url: `${siteUrl}/products/${id}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}

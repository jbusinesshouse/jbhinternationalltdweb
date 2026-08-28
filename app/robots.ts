import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jbhinternational.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sign-in", "/sign-up"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-metadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/u/"],
        disallow: ["/api/", "/dashboard", "/login", "/register", "/upgrade"],
      },
    ],
    sitemap: siteUrl ? `${siteUrl.toString().replace(/\/$/, "")}/sitemap.xml` : undefined,
    host: siteUrl?.origin,
  };
}

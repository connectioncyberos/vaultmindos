import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/metadata";

/** robots.txt dinamico (Modulo 8) — bloqueia /admin, /login e /dev do rastreamento. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/login", "/dev/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

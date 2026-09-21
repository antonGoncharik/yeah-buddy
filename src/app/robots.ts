import type { MetadataRoute } from "next";

import { siteOriginUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOriginUrl().origin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

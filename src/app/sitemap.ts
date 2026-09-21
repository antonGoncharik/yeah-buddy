import type { MetadataRoute } from "next";

import { siteOriginUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteOriginUrl().href,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

import type { MetadataRoute } from "next";

import { publicBarbellUrl } from "@/lib/share/barbell-public";
import {
  publicProgramCards,
  publicProgramUrl,
} from "@/lib/share/program-public";
import { siteOriginUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOriginUrl().origin;

  const now = new Date();

  return [
    {
      url: siteOriginUrl().href,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/p", origin).href,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: new URL("/legal/privacy", origin).href,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: new URL("/legal/terms", origin).href,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: publicBarbellUrl(origin),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...publicProgramCards().map((card) => ({
      url: publicProgramUrl(origin, card.id),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

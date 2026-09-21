import type { MetadataRoute } from "next";

import {
  publicProgramCards,
  publicProgramUrl,
} from "@/lib/share/program-public";
import { siteOriginUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOriginUrl().origin;

  return [
    {
      url: siteOriginUrl().href,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...publicProgramCards().map((card) => ({
      url: publicProgramUrl(origin, card.id),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

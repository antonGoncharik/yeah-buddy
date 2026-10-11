import type { MetadataRoute } from "next";

import { publicBarbellUrl } from "@/lib/share/barbell-public";
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
    {
      url: publicBarbellUrl(origin),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...publicProgramCards().map((card) => ({
      url: publicProgramUrl(origin, card.id),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

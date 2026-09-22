import {
  FEATURED_PROGRAM_IDS,
  type FeaturedProgramId,
  featuredProgramPreset,
} from "@/lib/share/program-start";
import { programPresetSummary } from "@/lib/workout/program-preset-utils";

export const PUBLIC_PROGRAM_SLUGS = {
  full_body: "full-body",
  five_by_five: "5x5",
  ppl: "ppl",
} as const satisfies Record<FeaturedProgramId, string>;

export interface PublicProgramCard {
  id: FeaturedProgramId;
  slug: string;
  path: string;
  name: string;
  summary: string;
}

export function publicProgramPath(id: FeaturedProgramId): string {
  return `/p/${PUBLIC_PROGRAM_SLUGS[id]}`;
}

export function publicProgramUrl(
  origin: string,
  id: FeaturedProgramId,
): string {
  return new URL(publicProgramPath(id), origin).href;
}

export function featuredProgramIdFromSlug(
  slug: string,
): FeaturedProgramId | null {
  for (const id of FEATURED_PROGRAM_IDS) {
    if (PUBLIC_PROGRAM_SLUGS[id] === slug) {
      return id;
    }
  }
  return null;
}

export function publicProgramCards(): PublicProgramCard[] {
  return FEATURED_PROGRAM_IDS.map((id) => {
    const preset = featuredProgramPreset(id);
    return {
      id,
      slug: PUBLIC_PROGRAM_SLUGS[id],
      path: publicProgramPath(id),
      name: preset.name,
      summary: programPresetSummary(preset),
    };
  });
}

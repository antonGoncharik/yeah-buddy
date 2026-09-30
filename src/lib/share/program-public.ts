import {
  LISTED_PROGRAM_PRESET_IDS,
  type ProgramPresetId,
} from "@/lib/workout/program-preset-data";
import {
  isListedProgramPresetId,
  programPresetById,
  programPresetSummary,
} from "@/lib/workout/program-presets";

export const PUBLIC_PROGRAM_IDS = LISTED_PROGRAM_PRESET_IDS;

export type PublicProgramId = (typeof PUBLIC_PROGRAM_IDS)[number];

export const PUBLIC_PROGRAM_SLUGS = {
  full_body: "full-body",
  five_by_five: "5x5",
  starting_strength: "3x5",
  strength: "2-silovyh",
  upper_lower: "verh-niz",
  ppl: "ppl",
  three_day: "spina-nogi-grud",
} as const satisfies Record<PublicProgramId, string>;

export interface PublicProgramCard {
  id: PublicProgramId;
  slug: string;
  path: string;
  name: string;
  summary: string;
}

export function isPublicProgramId(value: unknown): value is PublicProgramId {
  return isListedProgramPresetId(value as ProgramPresetId);
}

export function publicProgramPath(id: PublicProgramId): string {
  return `/p/${PUBLIC_PROGRAM_SLUGS[id]}`;
}

export function publicProgramUrl(origin: string, id: PublicProgramId): string {
  return new URL(publicProgramPath(id), origin).href;
}

export function publicProgramIdFromSlug(slug: string): PublicProgramId | null {
  for (const id of PUBLIC_PROGRAM_IDS) {
    if (PUBLIC_PROGRAM_SLUGS[id] === slug) {
      return id;
    }
  }
  return null;
}

/** @deprecated Use {@link publicProgramIdFromSlug}. */
export const featuredProgramIdFromSlug = publicProgramIdFromSlug;

export function publicProgramCards(): PublicProgramCard[] {
  return PUBLIC_PROGRAM_IDS.map((id) => {
    const preset = programPresetById(id);
    if (!preset) {
      throw new Error(`Нет программы ${id}.`);
    }
    return {
      id,
      slug: PUBLIC_PROGRAM_SLUGS[id],
      path: publicProgramPath(id),
      name: preset.name,
      summary: programPresetSummary(preset),
    };
  });
}

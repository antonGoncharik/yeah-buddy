import {
  BARBELL_GAME_HINT,
  BARBELL_GAME_TITLE,
} from "@/lib/share/barbell-daily";

export const PUBLIC_BARBELL_SLUG = "barbell";

export const PUBLIC_BARBELL_PATH = `/p/${PUBLIC_BARBELL_SLUG}`;

export interface PublicBarbellCard {
  slug: string;
  path: string;
  name: string;
  summary: string;
  hint: string;
}

export function publicBarbellCard(): PublicBarbellCard {
  return {
    slug: PUBLIC_BARBELL_SLUG,
    path: PUBLIC_BARBELL_PATH,
    name: BARBELL_GAME_TITLE,
    summary: "Одна головоломка в день: набери блины на гриф до нужного веса.",
    hint: BARBELL_GAME_HINT,
  };
}

export function publicBarbellUrl(origin: string): string {
  return new URL(PUBLIC_BARBELL_PATH, origin).href;
}

export function isPublicBarbellSlug(slug: string): boolean {
  return slug === PUBLIC_BARBELL_SLUG;
}

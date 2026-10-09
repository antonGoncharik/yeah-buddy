import {
  CATALOG_SEARCH_FETCH,
  CATALOG_SEARCH_LIMIT,
  catalogSearchLead,
  catalogSearchTokens,
  foldCatalogSearch,
} from "@/lib/food/catalog-map";
import { isRecord, mapRecordList, toNullableString } from "@/lib/read";
import {
  catalogExerciseGifUrl,
  catalogExerciseImageUrl,
} from "@/lib/workout/exercise-catalog-media";

export type CatalogInstructionSteps = {
  en?: string[];
  ru?: string[];
};

export interface CatalogExerciseSummary {
  id: string;
  name_en: string;
  name_ru: string | null;
  equipment: string | null;
  body_part: string | null;
}

export interface CatalogExerciseDetail extends CatalogExerciseSummary {
  source_exercise_id: string;
  gif_url: string;
  image_url: string;
  instruction_steps: CatalogInstructionSteps;
}

export interface CatalogExerciseDumpRow {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  image: string;
  gif_url: string;
  instruction_steps: CatalogInstructionSteps;
}

const LIST_COLUMNS =
  "id, source_exercise_id, name_en, name_ru, equipment, body_part";

export function catalogExerciseListColumns(): string {
  return LIST_COLUMNS;
}

export function parseCatalogExerciseDumpRow(
  value: unknown,
): CatalogExerciseDumpRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toNullableString(value.id);
  const name = toNullableString(value.name);
  const bodyPart = toNullableString(value.body_part);
  const equipment = toNullableString(value.equipment);
  const image = toNullableString(value.image);
  const gifPath = toNullableString(value.gif_url);
  if (!id || !name || !bodyPart || !equipment || !image || !gifPath) {
    return null;
  }

  return {
    id,
    name,
    body_part: bodyPart,
    equipment,
    image,
    gif_url: gifPath,
    instruction_steps: parseInstructionSteps(value.instruction_steps),
  };
}

export function mapCatalogExerciseSummary(
  row: Record<string, unknown>,
): CatalogExerciseSummary {
  return {
    id: String(row.id),
    name_en: String(row.name_en),
    name_ru: toNullableString(row.name_ru),
    equipment: toNullableString(row.equipment),
    body_part: toNullableString(row.body_part),
  };
}

export function mapCatalogExerciseDetail(
  row: Record<string, unknown>,
): CatalogExerciseDetail {
  const summary = mapCatalogExerciseSummary(row);
  const gifPath = String(row.gif_path);
  const imagePath = String(row.image_path);
  return {
    ...summary,
    source_exercise_id: String(row.source_exercise_id),
    gif_url: catalogExerciseGifUrl(gifPath),
    image_url: catalogExerciseImageUrl(imagePath),
    instruction_steps: parseInstructionSteps(row.instruction_steps),
  };
}

export function parseCatalogExerciseSummary(
  value: unknown,
): CatalogExerciseSummary | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapCatalogExerciseSummary(value);
}

export function parseCatalogExerciseDetail(
  value: unknown,
): CatalogExerciseDetail | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return mapCatalogExerciseDetail(value);
}

export function parseCatalogExerciseList(
  data: unknown,
): CatalogExerciseSummary[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.exercises, parseCatalogExerciseSummary);
}

export function parseCatalogExercisePayload(
  data: unknown,
): CatalogExerciseDetail | null {
  return isRecord(data) ? parseCatalogExerciseDetail(data.exercise) : null;
}

export function catalogExerciseDisplayName(
  item: Pick<CatalogExerciseSummary, "name_en" | "name_ru">,
  locale: "ru" | "en" = "ru",
): string {
  if (locale === "ru" && item.name_ru) {
    return item.name_ru;
  }
  return item.name_en;
}

export function filterCatalogExerciseHits(
  items: CatalogExerciseSummary[],
  tokens: string[],
): CatalogExerciseSummary[] {
  const filtered = items.filter((item) =>
    catalogExerciseMatchesTokens(item, tokens),
  );
  return filtered.slice(0, CATALOG_SEARCH_LIMIT);
}

export function catalogExerciseMatchesTokens(
  item: CatalogExerciseSummary,
  tokens: string[],
): boolean {
  const haystack = foldCatalogSearch(
    `${item.name_en} ${item.name_ru ?? ""} ${item.equipment ?? ""} ${item.body_part ?? ""}`,
  ).toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function catalogExerciseSearchTokens(query: string): string[] | null {
  return catalogSearchTokens(query);
}

export function catalogExerciseSearchFetchLimit(tokenCount: number): number {
  return tokenCount > 1 ? CATALOG_SEARCH_FETCH : CATALOG_SEARCH_LIMIT;
}

export function catalogExerciseSearchPattern(tokens: string[]): string {
  const lead = catalogSearchLead(tokens);
  return `%${foldCatalogSearch(lead)}%`;
}

function parseInstructionSteps(value: unknown): CatalogInstructionSteps {
  if (!isRecord(value)) {
    return {};
  }

  return {
    en: parseStepList(value.en),
    ru: parseStepList(value.ru),
  };
}

function parseStepList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const steps = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return steps.length > 0 ? steps : undefined;
}

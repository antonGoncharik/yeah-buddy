import { isRecord } from "@/lib/read";
import {
  type ProgramPreset,
  presetExerciseLine,
  programDayExerciseNames,
  programPresetById,
  programPresetSummary,
} from "@/lib/workout/program-presets";

export const FEATURED_PROGRAM_IDS = [
  "full_body",
  "five_three_one",
  "ppl",
] as const;

export type FeaturedProgramId = (typeof FEATURED_PROGRAM_IDS)[number];

export const PROGRAM_START_PREFIX = "p_";

const PROGRAM_ALIASES: Record<FeaturedProgramId, readonly string[]> = {
  full_body: [
    "фуллбади",
    "фулл боди",
    "фулл",
    "все тело",
    "тело a b",
    "full body",
    "fullbody",
  ],
  five_three_one: ["531", "5 3 1", "пять три один"],
  ppl: ["жим тяга ноги", "жим тяга", "push pull legs", "push pull"],
};

export function isFeaturedProgramId(
  value: unknown,
): value is FeaturedProgramId {
  return FEATURED_PROGRAM_IDS.some((id) => id === value);
}

export function programStartPayload(id: FeaturedProgramId): string {
  return `${PROGRAM_START_PREFIX}${id}`;
}

export function parseProgramStartPayload(
  value: string,
): FeaturedProgramId | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith(PROGRAM_START_PREFIX)) {
    return null;
  }

  const id = trimmed.slice(PROGRAM_START_PREFIX.length);
  return isFeaturedProgramId(id) ? id : null;
}

export function programPath(id: FeaturedProgramId): string {
  return `/programs/${id}`;
}

export function featuredProgramPreset(id: FeaturedProgramId): ProgramPreset {
  const preset = programPresetById(id);
  if (!preset) {
    throw new Error("Нет такой программы.");
  }
  return preset;
}

export function matchFeaturedPrograms(query: string): FeaturedProgramId[] {
  const needle = normalizeProgramSearch(query);
  if (needle === "") {
    return [...FEATURED_PROGRAM_IDS];
  }
  if (needle.length < 2) {
    return [];
  }

  return FEATURED_PROGRAM_IDS.filter((id) =>
    programSearchHaystack(id).some((hay) => hay.includes(needle)),
  );
}

export function programChatMessage(preset: ProgramPreset): string {
  const days = preset.templates.map(
    (day) =>
      `${day.name} · ${presetExerciseLine(programDayExerciseNames(day))}`,
  );
  const weeks = preset.cycle
    ? `\nНедели: ${preset.cycle.map((phase) => phase.name).join(" → ")}`
    : "";
  return `${preset.name}\n\n${days.join("\n")}${weeks}\n\n${preset.hint}`;
}

export function programShareText(preset: ProgramPreset): string {
  return programPresetSummary(preset);
}

export function programApplyConfirmMessage(preset: ProgramPreset): string {
  if (preset.cycle) {
    return `Поставить «${preset.name}»? Станут её дни и недели, цикл запустится сам. Свои дни не удалятся — отложатся.`;
  }
  return `Поставить «${preset.name}»? Дни станут этой программой — свои не пропадут, отложатся. Если шли недели — закроются.`;
}

export interface FeaturedProgramDetail {
  id: FeaturedProgramId;
  name: string;
  hint: string;
  summary: string;
  days: Array<{ name: string; exercises: string }>;
  weeks: string[] | null;
  share_url: string | null;
  applied: boolean;
}

export function featuredProgramView(
  preset: ProgramPreset,
  extra: { share_url: string | null; applied: boolean },
): FeaturedProgramDetail {
  if (!isFeaturedProgramId(preset.id)) {
    throw new Error("Нет такой программы.");
  }

  return {
    id: preset.id,
    name: preset.name,
    hint: preset.hint,
    summary: programPresetSummary(preset),
    days: preset.templates.map((day) => ({
      name: day.name,
      exercises: presetExerciseLine(programDayExerciseNames(day)),
    })),
    weeks: preset.cycle?.map((phase) => phase.name) ?? null,
    share_url: extra.share_url,
    applied: extra.applied,
  };
}

export function readFeaturedProgramPayload(
  data: unknown,
): FeaturedProgramDetail | null {
  if (!isRecord(data) || !isRecord(data.program)) {
    return null;
  }

  const row = data.program;
  if (!isFeaturedProgramId(row.id) || typeof row.name !== "string") {
    return null;
  }
  if (typeof row.hint !== "string" || typeof row.summary !== "string") {
    return null;
  }
  if (!Array.isArray(row.days)) {
    return null;
  }

  const days: FeaturedProgramDetail["days"] = [];
  for (const item of row.days) {
    if (
      !isRecord(item) ||
      typeof item.name !== "string" ||
      typeof item.exercises !== "string"
    ) {
      return null;
    }
    days.push({ name: item.name, exercises: item.exercises });
  }

  const weeks = parseWeekNames(row.weeks);
  if (weeks === undefined) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    hint: row.hint,
    summary: row.summary,
    days,
    weeks,
    share_url: typeof row.share_url === "string" ? row.share_url : null,
    applied: Boolean(row.applied),
  };
}

function parseWeekNames(value: unknown): string[] | null | undefined {
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }

  const weeks: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return undefined;
    }
    weeks.push(item);
  }
  return weeks;
}

function programSearchHaystack(id: FeaturedProgramId): string[] {
  const preset = featuredProgramPreset(id);
  return [id.replaceAll("_", " "), preset.name, ...PROGRAM_ALIASES[id]].map(
    normalizeProgramSearch,
  );
}

function normalizeProgramSearch(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

import type {
  ReviewAverages,
  ReviewBrief,
  ReviewCoverage,
  ReviewDayRow,
  ReviewMaxRow,
  ReviewSessionRow,
} from "@/lib/ai/types";
import type { Macros } from "@/lib/nutrition";
import { isRecord } from "@/lib/read";

export function toCoverage(value: unknown): ReviewCoverage {
  if (value === "empty" || value === "thin" || value === "ok") {
    return value;
  }

  return "ok";
}

export function parseAverages(value: unknown): ReviewAverages | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    count: toNumber(value.count),
    fact: parseMacros(value.fact),
    target: parseMacros(value.target),
  };
}

function parseMacros(value: unknown): Macros {
  if (!isRecord(value)) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }

  return {
    protein: toNumber(value.protein),
    fat: toNumber(value.fat),
    carbs: toNumber(value.carbs),
    kcal: toNumber(value.kcal),
  };
}

export function parseDayRow(row: Record<string, unknown>): ReviewDayRow | null {
  if (typeof row.date !== "string") {
    return null;
  }

  return {
    date: row.date,
    training: row.training === true,
    protein: toNumber(row.protein),
    protein_target: toNumber(row.protein_target),
    carbs: toNumber(row.carbs),
    carbs_target: toNumber(row.carbs_target),
    kcal: toNumber(row.kcal),
    kcal_target: toNumber(row.kcal_target),
    weight: toNullableNumber(row.weight),
  };
}

export function parseWeight(
  value: unknown,
): ReviewBrief["nutrition"]["weight"] {
  if (!isRecord(value)) {
    return {
      logged: 0,
      start: null,
      end: null,
      delta: null,
      protein_per_kg: null,
      protein_per_kg_target: null,
    };
  }

  return {
    logged: toNumber(value.logged),
    start: toNullableNumber(value.start),
    end: toNullableNumber(value.end),
    delta: toNullableNumber(value.delta),
    protein_per_kg: toNullableNumber(value.protein_per_kg),
    protein_per_kg_target: toNullableNumber(value.protein_per_kg_target),
  };
}

export function parseFoodShare(
  row: Record<string, unknown>,
): ReviewBrief["nutrition"]["foods"][number] | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return {
    name: row.name,
    protein: toNumber(row.protein),
    kcal: toNumber(row.kcal),
    grams: toNumber(row.grams),
  };
}

export function parseNamedCount(
  row: Record<string, unknown>,
): { name: string; count: number } | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return { name: row.name, count: toNumber(row.count) };
}

export function parseGymNote(
  row: Record<string, unknown>,
): { date: string; name: string; note: string } | null {
  if (typeof row.date !== "string" || typeof row.note !== "string") {
    return null;
  }

  return {
    date: row.date,
    name: String(row.name ?? ""),
    note: row.note,
  };
}

export function parseSessionRow(
  row: Record<string, unknown>,
): ReviewSessionRow | null {
  if (typeof row.date !== "string") {
    return null;
  }

  const status = row.status === "skipped" ? "skipped" : "completed";
  const kind = row.kind === "static" ? "static" : "dynamic";

  return {
    date: row.date,
    name: String(row.name ?? ""),
    kind,
    status,
    plan_hit: toNumber(row.plan_hit),
    plan_total: toNumber(row.plan_total),
    note: typeof row.note === "string" ? row.note : null,
  };
}

export function parseMaxRow(row: Record<string, unknown>): ReviewMaxRow | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return {
    name: row.name,
    percent: toNullableNumber(row.percent),
    relative_percent: toNullableNumber(row.relative_percent),
    delta: toNullableNumber(row.delta),
    start: toNullableNumber(row.start),
    current: toNullableNumber(row.current),
    start_relative: toNullableNumber(row.start_relative),
    current_relative: toNullableNumber(row.current_relative),
  };
}

export function parseNamedPercent(
  row: Record<string, unknown>,
): { name: string; percent: number } | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return { name: row.name, percent: toNumber(row.percent) };
}

export function parseLastRecap(
  value: unknown,
): ReviewBrief["maxes"]["last_recap"] {
  if (!isRecord(value)) {
    return null;
  }

  return {
    from: String(value.from ?? ""),
    to: String(value.to ?? ""),
    avg_percent: toNullableNumber(value.avg_percent),
    grown: toNumber(value.grown),
  };
}

export function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

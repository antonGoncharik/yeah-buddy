import { isReviewRange } from "@/lib/ai/range";
import type {
  ReviewAverages,
  ReviewBrief,
  ReviewCoverage,
  ReviewDayRow,
  ReviewMaxRow,
  ReviewSessionRow,
  ReviewSnapshot,
  ReviewText,
} from "@/lib/ai/types";
import type { Macros } from "@/lib/nutrition";
import { isRecord, mapRecordList } from "@/lib/read";

export function parseReviewSnapshot(data: unknown): ReviewSnapshot | null {
  if (!isRecord(data) || typeof data.configured !== "boolean") {
    return null;
  }

  const brief = parseReviewBrief(data.brief);
  if (!brief) {
    return null;
  }

  return {
    configured: data.configured,
    brief,
    review: parseReviewText(data.review),
  };
}

export function parseReviewBrief(value: unknown): ReviewBrief | null {
  if (
    !isRecord(value) ||
    !isReviewRange(value.range) ||
    !isRecord(value.nutrition) ||
    !isRecord(value.gym) ||
    !isRecord(value.phase) ||
    !isRecord(value.maxes)
  ) {
    return null;
  }

  return {
    range: value.range,
    from: String(value.from ?? ""),
    to: String(value.to ?? ""),
    coverage: toCoverage(value.coverage),
    nutrition: {
      logged: toNumber(value.nutrition.logged),
      rest: parseAverages(value.nutrition.rest),
      training: parseAverages(value.nutrition.training),
      protein_hit: toNumber(value.nutrition.protein_hit),
      protein_total: toNumber(value.nutrition.protein_total),
      kcal_hit: toNumber(value.nutrition.kcal_hit),
      kcal_total: toNumber(value.nutrition.kcal_total),
      days: mapRecordList(value.nutrition.days, parseDayRow),
      foods: mapRecordList(value.nutrition.foods, parseFoodShare),
    },
    gym: {
      completed: toNumber(value.gym.completed),
      skipped: toNumber(value.gym.skipped),
      dynamic: toNumber(value.gym.dynamic),
      static: toNumber(value.gym.static),
      plan_hit: toNumber(value.gym.plan_hit),
      plan_total: toNumber(value.gym.plan_total),
      templates: mapRecordList(value.gym.templates, parseNamedCount),
      weak: stringList(value.gym.weak),
      notes: mapRecordList(value.gym.notes, parseGymNote),
      sessions: mapRecordList(value.gym.sessions, parseSessionRow),
    },
    phase: {
      type: typeof value.phase.type === "string" ? value.phase.type : null,
      completed:
        typeof value.phase.completed === "number"
          ? value.phase.completed
          : null,
      circle:
        typeof value.phase.circle === "number" ? value.phase.circle : null,
      suggest_end: value.phase.suggest_end === true,
    },
    maxes: {
      grown: toNumber(value.maxes.grown),
      total: toNumber(value.maxes.total),
      avg_percent: toNullableNumber(value.maxes.avg_percent),
      grown_list: mapRecordList(value.maxes.grown_list, parseMaxRow),
      stalled: mapRecordList(value.maxes.stalled, parseMaxRow),
      last_recap: parseLastRecap(value.maxes.last_recap),
    },
    signals: stringList(value.signals),
  };
}

export function parseReviewText(value: unknown): ReviewText | null {
  if (!isRecord(value) || typeof value.headline !== "string") {
    return null;
  }

  return {
    headline: value.headline,
    observations: stringList(value.observations),
    watch: stringList(value.watch),
  };
}

function toCoverage(value: unknown): ReviewCoverage {
  if (value === "empty" || value === "thin" || value === "ok") {
    return value;
  }

  return "ok";
}

function parseAverages(value: unknown): ReviewAverages | null {
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

function parseDayRow(row: Record<string, unknown>): ReviewDayRow | null {
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
  };
}

function parseFoodShare(
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

function parseNamedCount(
  row: Record<string, unknown>,
): { name: string; count: number } | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return { name: row.name, count: toNumber(row.count) };
}

function parseGymNote(
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

function parseSessionRow(
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

function parseMaxRow(row: Record<string, unknown>): ReviewMaxRow | null {
  if (typeof row.name !== "string") {
    return null;
  }

  return {
    name: row.name,
    percent: toNullableNumber(row.percent),
    delta: toNullableNumber(row.delta),
  };
}

function parseLastRecap(value: unknown): ReviewBrief["maxes"]["last_recap"] {
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

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

import {
  parseAverages,
  parseDayRow,
  parseFeels,
  parseFoodShare,
  parseGymNote,
  parseLastRecap,
  parseMaxRow,
  parseNamedCount,
  parseNamedPercent,
  parseSessionRow,
  parseWeight,
  stringList,
  toCoverage,
  toNullableNumber,
  toNumber,
} from "@/lib/ai/parse-review-fields";
import { isReviewRange } from "@/lib/ai/range";
import type {
  ReviewBrief,
  ReviewSnapshot,
  ReviewText,
  StoredReview,
} from "@/lib/ai/types";
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
    review: parseStoredReview(data.review),
    previous: parseStoredReview(data.previous),
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
      weight: parseWeight(value.nutrition.weight),
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
      feels: parseFeels(value.gym.feels),
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
      since: "first_work",
      grown: toNumber(value.maxes.grown),
      total: toNumber(value.maxes.total),
      avg_percent: toNullableNumber(value.maxes.avg_percent),
      avg_relative_percent: toNullableNumber(value.maxes.avg_relative_percent),
      categories: mapRecordList(value.maxes.categories, parseNamedPercent),
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

export function parseStoredReview(value: unknown): StoredReview | null {
  const text = parseReviewText(value);
  if (!text || !isRecord(value)) {
    return null;
  }

  const from = toDateOnly(value.from);
  const to = toDateOnly(value.to);
  const writtenAt =
    typeof value.written_at === "string"
      ? value.written_at
      : typeof value.created_at === "string"
        ? value.created_at
        : "";

  return {
    ...text,
    from: from ?? "",
    to: to ?? "",
    written_at: writtenAt,
  };
}

function toDateOnly(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

import { toNullableNumber, toNumber } from "@/lib/ai/parse-review-numbers";
import type {
  ReviewBrief,
  ReviewMaxRow,
  ReviewSessionRow,
} from "@/lib/ai/types";
import { isRecord } from "@/lib/read";

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
    feel:
      row.feel === "easy" || row.feel === "close" || row.feel === "miss"
        ? row.feel
        : null,
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

export function parseFeels(value: unknown): {
  easy: number;
  close: number;
  miss: number;
} {
  if (!isRecord(value)) {
    return { easy: 0, close: 0, miss: 0 };
  }

  return {
    easy: toNumber(value.easy),
    close: toNumber(value.close),
    miss: toNumber(value.miss),
  };
}

import { formatPct } from "@/lib/ai/format";
import { WEIGHT_DELTA_KG } from "@/lib/ai/signal-nutrition";
import type { ReviewMaxRow, ReviewWeight } from "@/lib/ai/types";
import { formatRelative, formatSignedBodyWeight } from "@/lib/day/body-weight";
import { formatWeight } from "@/lib/workout/numbers";

const RELATIVE_VS_BAR_PCT = 2;

export function maxesSignalLines(input: {
  weight: ReviewWeight;
  maxes: { grown: ReviewMaxRow[]; stalled: ReviewMaxRow[] };
  categories?: Array<{ name: string; percent: number }>;
  avgPercent?: number | null;
  avgRelativePercent?: number | null;
}): string[] {
  const lines: string[] = [];

  if (input.maxes.grown.length > 0) {
    lines.push(`Выросли: ${input.maxes.grown.map(formatMaxRow).join(", ")}.`);
  }
  if (input.maxes.stalled.length > 0) {
    lines.push(
      `Без роста: ${input.maxes.stalled.map((item) => item.name).join(", ")}.`,
    );
  }

  const delta = input.weight.delta;
  if (
    delta != null &&
    delta <= -WEIGHT_DELTA_KG &&
    input.maxes.grown.length > 0
  ) {
    lines.push(`Вес ${formatSignedBodyWeight(delta)} кг, рабочие выросли.`);
  } else if (
    delta != null &&
    delta >= WEIGHT_DELTA_KG &&
    input.maxes.grown.length > 0
  ) {
    lines.push(
      `Вес ${formatSignedBodyWeight(delta)} кг, рабочие тоже выросли.`,
    );
  }

  if (
    input.avgPercent != null &&
    input.avgRelativePercent != null &&
    Math.abs(input.avgRelativePercent - input.avgPercent) >= RELATIVE_VS_BAR_PCT
  ) {
    lines.push(
      `К весу тела рабочие ${formatPct(input.avgRelativePercent)}, по штанге ${formatPct(input.avgPercent)}.`,
    );
  } else if (
    input.avgRelativePercent != null &&
    Math.abs(input.avgRelativePercent) >= 1
  ) {
    lines.push(`К весу тела рабочие ${formatPct(input.avgRelativePercent)}.`);
  }

  if (input.categories && input.categories.length > 1) {
    lines.push(
      `По группам: ${input.categories
        .map((item) => `${item.name} ${formatPct(item.percent)}`)
        .join(", ")}.`,
    );
  }

  return lines;
}

function formatMaxRow(item: ReviewMaxRow): string {
  const bar = item.percent == null ? null : formatPct(item.percent);
  const relative =
    item.relative_percent == null ? null : formatPct(item.relative_percent);
  const barGrown = (item.percent ?? 0) > 0.5;
  const relativeGrown = (item.relative_percent ?? 0) > 0.5;
  const kg = formatKgRange(item.start, item.current);
  const relRange = formatRelativeRange(
    item.start_relative,
    item.current_relative,
  );
  if (
    barGrown &&
    bar != null &&
    relative != null &&
    Math.abs((item.relative_percent ?? 0) - (item.percent ?? 0)) >=
      RELATIVE_VS_BAR_PCT
  ) {
    return joinMaxParts(
      item.name,
      `${bar}${kg}`,
      `к весу ${relative}${relRange}`,
    );
  }
  if (barGrown && bar != null) {
    return `${item.name} ${bar}${kg}`;
  }
  if (relativeGrown && relative != null) {
    return `${item.name} к весу ${relative}${relRange}`;
  }
  if (bar != null) {
    return `${item.name} ${bar}${kg}`;
  }
  return item.name;
}

function joinMaxParts(name: string, left: string, right: string): string {
  return `${name} ${left}, ${right}`;
}

function formatKgRange(start: number | null, current: number | null): string {
  if (start == null || current == null) {
    return "";
  }
  if (start === current) {
    return ` (${formatWeight(current)} кг)`;
  }
  return ` (${formatWeight(start)} → ${formatWeight(current)} кг)`;
}

function formatRelativeRange(
  start: number | null,
  current: number | null,
): string {
  if (start == null || current == null) {
    return "";
  }
  if (start === current) {
    return ` (${formatRelative(current)})`;
  }
  return ` (${formatRelative(start)} → ${formatRelative(current)})`;
}

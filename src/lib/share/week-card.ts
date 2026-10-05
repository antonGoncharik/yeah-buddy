import { createHmac, timingSafeEqual } from "node:crypto";

import { format, parseISO } from "date-fns";

import { parseBodyWeight } from "@/lib/day/body-weight";
import { isIsoDate } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { dayHasFood, type WeekSlot, weekWindow } from "@/lib/day/week";
import { macroInGoal } from "@/lib/nutrition/macro-hit";
import type { ExerciseCategory } from "@/lib/types";

export const WEEK_PROGRESS_TITLE = "Поделиться прогрессом";
export const WEEK_CARD_HEADING = "Неделя";
export const WEEK_CARD_CAPTION_LEAD = "Как прошла неделя";
export const WEEK_PROGRESS_HINT =
  "Картинка за последние 7 дней — в чат или в сторис";
export const WEEK_PROGRESS_CHAT_LABEL = "В чат";
export const WEEK_PROGRESS_DETAILS_TITLE = "Что на картинке";
/** Plain-language rules for `buildWeekCard` — keep in sync with the code. */
export const WEEK_PROGRESS_DETAIL_LINES: string[] = [
  "Неделя — 7 дней до сегодня включительно, даты в шапке.",
  "Вес тела — только дни, где ты его записал; на графике до 7 точек; плюс или минус от первого к последнему за неделю.",
  "Зал — сколько дней с тренировкой, закрытой «Готово».",
  "Рабочие — до трёх упражнений из зала: тяжёлый рабочий вес за день, сравнение начала и конца недели. Сначала база и то, где вес вырос. Если в логе правил вес — только правки; если всё как в плане — план.",
  "БЖУ — среднее по дням, где в дневнике есть еда; цель — твои таргеты на эти дни. «В цели»: белок, жир и углеводы в пределах ±2% от цели.",
  "Нет на картинке: талия, максимум на раз, тоннаж, упражнения без записи из зала, дни без еды и без целей.",
];
export const WEEK_CARD_BUTTON = "Попробовать YeahBuddy";
export const WEEK_CARD_EMPTY =
  "Пока нечего на картинку. Нужен вес, рабочий кг или еда с целью.";
export const WEEK_CARD_QUERY_LIMIT = 256;

const CARD_WIDTH = 1080;
const INK = "#2A100A";
const MUTED = "#8C7368";
const PAPER = "#FFF6EE";
const TRACK = "#F0E4D8";
const ACCENT = "#CD4918";
const GREEN = "#1F7A4D";
const LINE = "#E7D5C8";

const MACRO_KEYS = ["protein", "fat", "carbs"] as const;
type MacroKey = (typeof MACRO_KEYS)[number];

const MACRO_LABELS: Record<MacroKey, string> = {
  protein: "Белок",
  fat: "Жир",
  carbs: "Углеводы",
};

export interface WeekCardMacro {
  key: MacroKey;
  fact: number;
  target: number;
}

export interface WeekCardLift {
  name: string;
  start: number;
  end: number;
}

export interface WeekCard {
  from: string;
  to: string;
  weights: number[];
  lifts: WeekCardLift[];
  macros: WeekCardMacro[];
  gymDays: number;
}

export interface WeekCardExercise {
  name: string;
  category: ExerciseCategory;
  fromWork: boolean;
  points: Array<{ date: string; weight: number; fromPlan?: boolean }>;
}

export function buildWeekCard(input: {
  today: string;
  slots: WeekSlot[];
  exercises: WeekCardExercise[];
}): WeekCard | null {
  if (!isIsoDate(input.today)) {
    return null;
  }

  const { start, end } = weekWindow(input.today);
  const slots = input.slots
    .filter((slot) => slot.date >= start && slot.date <= end)
    .sort((left, right) => left.date.localeCompare(right.date));

  const weights: number[] = [];
  let gymDays = 0;
  const food: WeekSlot["day"][] = [];
  for (const slot of slots) {
    const weight = parseBodyWeight(slot.day?.body_weight);
    if (weight != null) {
      weights.push(weight);
    }
    if (slot.session?.status === "completed") {
      gymDays += 1;
    }
    if (slot.day && dayHasFood(slot.day)) {
      food.push(slot.day);
    }
  }

  const lifts = pickLifts(input.exercises, start, end);
  const macros = averageMacros(food);
  if (weights.length === 0 && lifts.length === 0 && macros.length === 0) {
    return null;
  }

  return {
    from: start,
    to: end,
    weights: weights.slice(-7),
    lifts,
    macros,
    gymDays: Math.min(gymDays, 7),
  };
}

export function weekCardCaption(card: WeekCard): string {
  return `${WEEK_CARD_CAPTION_LEAD} · ${weekRangeLabel(card.from, card.to)}`;
}

export function weekCardPhotoUrl(origin: string, query: string): string {
  return `${origin}/api/share/card?q=${encodeURIComponent(query)}`;
}

export function encodeWeekCard(card: WeekCard, secret: string): string {
  const body = [
    "wk",
    compactDate(card.from),
    compactDate(card.to),
    card.weights.map(formatShareNumber).join(","),
    card.lifts
      .map(
        (lift) =>
          `${liftName(lift.name)}~${formatShareNumber(lift.start)}~${formatShareNumber(lift.end)}`,
      )
      .filter((part) => !part.startsWith("~"))
      .join(","),
    MACRO_KEYS.map((key) => {
      const row = card.macros.find((macro) => macro.key === key);
      if (!row) {
        return "0~0";
      }
      return `${formatShareNumber(row.fact)}~${formatShareNumber(row.target)}`;
    }).join(","),
    String(card.gymDays),
  ].join("|");
  return `${body}|${sign(body, secret)}`;
}

export function decodeWeekCard(query: string, secret: string): WeekCard | null {
  const trimmed = query.trim();
  if (trimmed.length > WEEK_CARD_QUERY_LIMIT || !trimmed.startsWith("wk|")) {
    return null;
  }

  const parts = trimmed.split("|");
  if (parts.length !== 8 || parts[0] !== "wk") {
    return null;
  }

  const body = parts.slice(0, 7).join("|");
  const signature = parts[7] ?? "";
  if (!signatureOk(sign(body, secret), signature)) {
    return null;
  }

  const from = expandDate(parts[1] ?? "");
  const to = expandDate(parts[2] ?? "");
  if (!from || !to || from > to) {
    return null;
  }
  const span = daysBetween(from, to);
  if (span == null || span > 13) {
    return null;
  }

  const weights = parseList(parts[3] ?? "", (token) =>
    parseShareNumber(token, 20, 400),
  );
  if (!weights || weights.length > 7) {
    return null;
  }

  const lifts = parseLifts(parts[4] ?? "");
  if (!lifts || lifts.length > 3) {
    return null;
  }

  const macros = parseMacros(parts[5] ?? "");
  if (!macros) {
    return null;
  }

  const gymDays = Number(parts[6]);
  if (!Number.isInteger(gymDays) || gymDays < 0 || gymDays > 7) {
    return null;
  }

  if (weights.length === 0 && lifts.length === 0 && macros.length === 0) {
    return null;
  }

  return { from, to, weights, lifts, macros, gymDays };
}

export function weekCardSvg(card: WeekCard, fontCss = ""): string {
  const chunks: string[] = [];
  let y = 108;

  chunks.push(
    text({
      x: 80,
      y,
      size: 22,
      weight: 700,
      fill: MUTED,
      value: "YEAH BUDDY",
      spacing: 3,
    }),
  );
  y = 196;
  chunks.push(
    text({
      x: 80,
      y,
      size: 68,
      weight: 700,
      fill: INK,
      value: WEEK_CARD_HEADING,
    }),
  );
  y = 252;
  chunks.push(
    text({
      x: 80,
      y,
      size: 30,
      fill: MUTED,
      value: rangeLine(card),
    }),
  );
  y = 300;

  if (card.weights.length > 0) {
    y = drawWeight(chunks, card.weights, y);
  }
  if (card.lifts.length > 0) {
    y = drawLifts(chunks, card.lifts, y);
  }
  if (card.macros.length > 0) {
    y = drawMacros(chunks, card.macros, y);
  }

  const height = y + 48;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">
  <style>${fontCss}</style>
  <rect width="${CARD_WIDTH}" height="${height}" fill="${PAPER}"/>
  <rect width="${CARD_WIDTH}" height="12" fill="${ACCENT}"/>
  ${chunks.join("\n  ")}
</svg>`;
}

export function weekCardSize(card: WeekCard): {
  width: number;
  height: number;
} {
  const height = Number(/ height="(\d+)"/.exec(weekCardSvg(card))?.[1]);
  return {
    width: CARD_WIDTH,
    height: Number.isFinite(height) && height > 0 ? height : CARD_WIDTH,
  };
}

export function macroInZone(macro: WeekCardMacro): boolean {
  return macroInGoal(macro.fact, macro.target);
}

function pickLifts(
  exercises: WeekCardExercise[],
  from: string,
  to: string,
): WeekCardLift[] {
  const lifts: Array<WeekCardLift & { category: ExerciseCategory }> = [];
  for (const exercise of exercises) {
    if (!exercise.fromWork) {
      continue;
    }
    const inWindow = exercise.points.filter(
      (point) =>
        point.date >= from &&
        point.date <= to &&
        point.weight > 0 &&
        point.weight < 1000,
    );
    const written = inWindow.some((point) => point.fromPlan !== true);
    const used = written
      ? inWindow.filter((point) => point.fromPlan !== true)
      : inWindow;
    const series = heaviestByDate(used);
    const start = series[0];
    const end = series.at(-1);
    const name = liftName(exercise.name);
    if (start == null || end == null || name === "") {
      continue;
    }
    lifts.push({
      name,
      start,
      end,
      category: exercise.category,
    });
  }

  lifts.sort((left, right) => {
    const leftMove = left.end === left.start ? 0 : 1;
    const rightMove = right.end === right.start ? 0 : 1;
    if (leftMove !== rightMove) {
      return rightMove - leftMove;
    }
    const leftBase = left.category === "base" ? 1 : 0;
    const rightBase = right.category === "base" ? 1 : 0;
    if (leftBase !== rightBase) {
      return rightBase - leftBase;
    }
    const delta = right.end - right.start - (left.end - left.start);
    if (delta !== 0) {
      return delta;
    }
    return left.name.localeCompare(right.name, "ru");
  });

  return lifts.slice(0, 3).map(({ name, start, end }) => ({
    name,
    start,
    end,
  }));
}

function heaviestByDate(
  points: Array<{ date: string; weight: number }>,
): number[] {
  const byDate = new Map<string, number>();
  for (const point of points) {
    const current = byDate.get(point.date);
    if (current == null || point.weight > current) {
      byDate.set(point.date, point.weight);
    }
  }
  return [...byDate.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map((entry) => round1(entry[1]));
}

function averageMacros(days: Array<WeekSlot["day"]>): WeekCardMacro[] {
  if (days.length === 0) {
    return [];
  }

  const macros: WeekCardMacro[] = [];
  for (const key of MACRO_KEYS) {
    const factKey = `fact_${key}` as const;
    const targetKey = `target_${key}` as const;
    const facts: number[] = [];
    const targets: number[] = [];
    for (const day of days) {
      if (!day) {
        continue;
      }
      facts.push(day[factKey]);
      targets.push(day[targetKey]);
    }
    const target = round1(mean(targets));
    if (target <= 0) {
      continue;
    }
    macros.push({ key, fact: round1(mean(facts)), target });
  }
  return macros;
}

function drawWeight(chunks: string[], weights: number[], y: number): number {
  y += 56;
  chunks.push(sectionLabel("Вес", y));
  const first = weights[0] ?? 0;
  const last = weights.at(-1) ?? first;
  const delta = round1(last - first);
  const tone = delta < -0.05 ? GREEN : delta > 0.05 ? ACCENT : MUTED;

  if (weights.length >= 2) {
    y += 28;
    const chart = sparkline(weights, 80, y, 920, 150);
    chunks.push(
      `<polygon points="${chart.area}" fill="${tone}" opacity="0.14"/>`,
      `<polyline points="${chart.line}" fill="none" stroke="${tone}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<circle cx="${chart.lastX}" cy="${chart.lastY}" r="8" fill="${PAPER}" stroke="${tone}" stroke-width="5"/>`,
    );
    y += 230;
  } else {
    y += 64;
  }

  chunks.push(
    text({
      x: 80,
      y,
      size: 56,
      weight: 700,
      fill: INK,
      value: `${posterNumber(last)} кг`,
    }),
  );
  if (weights.length >= 2 && Math.abs(delta) >= 0.05) {
    chunks.push(
      text({
        x: 1000,
        y,
        size: 40,
        weight: 700,
        fill: tone,
        anchor: "end",
        value: signedPoster(delta),
      }),
    );
  }
  y += 48;
  chunks.push(`<line x1="80" y1="${y}" x2="1000" y2="${y}" stroke="${LINE}"/>`);
  return y;
}

function drawLifts(chunks: string[], lifts: WeekCardLift[], y: number): number {
  y += 64;
  chunks.push(sectionLabel("Рабочие", y));
  y += 56;
  for (const lift of lifts) {
    const grew = lift.end - lift.start >= 0.05;
    const dropped = lift.start - lift.end >= 0.05;
    chunks.push(
      text({
        x: 80,
        y,
        size: 34,
        weight: 700,
        fill: INK,
        value: lift.name,
      }),
    );
    const value =
      grew || dropped
        ? `${posterNumber(lift.start)} → ${posterNumber(lift.end)}`
        : posterNumber(lift.end);
    chunks.push(
      text({
        x: 1000,
        y,
        size: 34,
        weight: 700,
        fill: grew ? GREEN : INK,
        anchor: "end",
        value,
      }),
    );
    y += 64;
  }
  y -= 16;
  chunks.push(`<line x1="80" y1="${y}" x2="1000" y2="${y}" stroke="${LINE}"/>`);
  return y;
}

function drawMacros(
  chunks: string[],
  macros: WeekCardMacro[],
  y: number,
): number {
  y += 64;
  chunks.push(sectionLabel("БЖУ", y));
  y += 52;
  for (const macro of macros) {
    const zone = macroInZone(macro);
    chunks.push(
      text({
        x: 80,
        y,
        size: 30,
        weight: 700,
        fill: INK,
        value: MACRO_LABELS[macro.key],
      }),
    );
    if (zone) {
      chunks.push(
        text({
          x: 680,
          y,
          size: 26,
          weight: 700,
          fill: GREEN,
          anchor: "end",
          value: "в цели",
        }),
      );
    }
    chunks.push(
      text({
        x: 1000,
        y,
        size: 28,
        fill: MUTED,
        anchor: "end",
        value: `${posterNumber(macro.fact)} из ${posterNumber(macro.target)}`,
      }),
    );
    y += 22;
    const width = barWidth(macro);
    chunks.push(
      `<rect x="80" y="${y}" width="920" height="16" rx="8" fill="${TRACK}"/>`,
    );
    if (width > 0) {
      chunks.push(
        `<rect x="80" y="${y}" width="${width}" height="16" rx="8" fill="${zone ? GREEN : ACCENT}"/>`,
      );
    }
    y += 72;
  }
  return y;
}

function sectionLabel(value: string, y: number): string {
  return text({
    x: 80,
    y,
    size: 22,
    weight: 700,
    fill: MUTED,
    value,
    spacing: 1.5,
  });
}

function rangeLine(card: WeekCard): string {
  const range = weekRangeLabel(card.from, card.to);
  if (card.gymDays <= 0) {
    return range;
  }
  return `${range} · ${gymLabel(card.gymDays)}`;
}

function gymLabel(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${days} тренировка`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${days} тренировки`;
  }
  return `${days} тренировок`;
}

function weekRangeLabel(from: string, to: string): string {
  const fromDay = Number(from.slice(8));
  const toDay = Number(to.slice(8));
  const fromMonth = monthLabel(from);
  const toMonth = monthLabel(to);
  if (from.slice(0, 7) === to.slice(0, 7)) {
    return `${fromDay}–${toDay} ${toMonth}`;
  }
  return `${fromDay} ${fromMonth} – ${toDay} ${toMonth}`;
}

function monthLabel(iso: string): string {
  return formatIsoDate(iso, "MMM").replace(".", "");
}

function sparkline(
  values: number[],
  x: number,
  y: number,
  width: number,
  height: number,
): { line: string; area: string; lastX: string; lastY: string } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.22, 0.2);
  const low = min - pad;
  const high = max + pad;
  const coords = values.map((value, index) => {
    const px = x + (index / (values.length - 1)) * width;
    const py = y + height - ((value - low) / (high - low)) * height;
    return { px, py };
  });
  const line = coords
    .map((point) => `${point.px.toFixed(1)},${point.py.toFixed(1)}`)
    .join(" ");
  const first = coords[0];
  const last = coords.at(-1) ?? first;
  const area = [
    `${first?.px.toFixed(1)},${(y + height).toFixed(1)}`,
    line,
    `${last?.px.toFixed(1)},${(y + height).toFixed(1)}`,
  ].join(" ");
  return {
    line,
    area,
    lastX: (last?.px ?? x).toFixed(1),
    lastY: (last?.py ?? y).toFixed(1),
  };
}

function barWidth(macro: WeekCardMacro): number {
  if (macro.fact <= 0 || macro.target <= 0) {
    return 0;
  }
  const ratio = Math.min(1, macro.fact / macro.target);
  return Math.max(16, Math.round(ratio * 920));
}

function text(input: {
  x: number;
  y: number;
  size: number;
  fill: string;
  value: string;
  weight?: 500 | 700;
  anchor?: "end";
  spacing?: number;
}): string {
  const anchor = input.anchor === "end" ? ' text-anchor="end"' : "";
  const spacing =
    input.spacing == null ? "" : ` letter-spacing="${input.spacing}"`;
  return `<text x="${input.x}" y="${input.y}" font-family="Manrope" font-size="${input.size}" font-weight="${input.weight ?? 500}" fill="${input.fill}"${anchor}${spacing}>${xml(input.value)}</text>`;
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function posterNumber(value: number): string {
  return formatShareNumber(value).replace(".", ",");
}

function signedPoster(value: number): string {
  const abs = posterNumber(Math.abs(value));
  if (value > 0) {
    return `+${abs}`;
  }
  if (value < 0) {
    return `−${abs}`;
  }
  return posterNumber(0);
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function liftName(name: string): string {
  const clean = name
    .replace(/[^\p{L}\p{N} .+-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(clean).slice(0, 12).join("");
}

function parseLifts(field: string): WeekCardLift[] | null {
  if (field === "") {
    return [];
  }
  const lifts: WeekCardLift[] = [];
  for (const part of field.split(",")) {
    const [name, startToken, endToken] = part.split("~");
    const start = parseShareNumber(startToken ?? "", 0.1, 500);
    const end = parseShareNumber(endToken ?? "", 0.1, 500);
    const clean = liftName(name ?? "");
    if (!start || !end || clean === "" || clean !== name) {
      return null;
    }
    lifts.push({ name: clean, start, end });
  }
  return lifts;
}

function parseMacros(field: string): WeekCardMacro[] | null {
  const parts = field.split(",");
  if (parts.length !== MACRO_KEYS.length) {
    return null;
  }
  const macros: WeekCardMacro[] = [];
  for (let index = 0; index < MACRO_KEYS.length; index += 1) {
    const [factToken, targetToken] = (parts[index] ?? "").split("~");
    const fact = parseShareNumber(factToken ?? "", 0, 2000);
    const target = parseShareNumber(targetToken ?? "", 0, 2000);
    const key = MACRO_KEYS[index];
    if (fact == null || target == null || !key) {
      return null;
    }
    if (target <= 0) {
      continue;
    }
    macros.push({ key, fact, target });
  }
  return macros;
}

function parseList(
  field: string,
  parse: (token: string) => number | null,
): number[] | null {
  if (field === "") {
    return [];
  }
  const values: number[] = [];
  for (const token of field.split(",")) {
    const value = parse(token);
    if (value == null) {
      return null;
    }
    values.push(value);
  }
  return values;
}

function parseShareNumber(
  token: string,
  min: number,
  max: number,
): number | null {
  if (!/^\d+(\.\d)?$/.test(token)) {
    return null;
  }
  const value = Number(token);
  if (!Number.isFinite(value) || value < min || value > max) {
    return null;
  }
  return round1(value);
}

function formatShareNumber(value: number): string {
  const rounded = round1(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function compactDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function expandDate(compact: string): string | null {
  if (!/^\d{8}$/.test(compact)) {
    return null;
  }
  const iso = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  if (!isIsoDate(iso)) {
    return null;
  }
  const parsed = parseISO(iso);
  if (Number.isNaN(parsed.getTime()) || format(parsed, "yyyy-MM-dd") !== iso) {
    return null;
  }
  return iso;
}

function daysBetween(from: string, to: string): number | null {
  const start = parseISO(from).getTime();
  const end = parseISO(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  return Math.round((end - start) / 86_400_000);
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(body)
    .digest("base64url")
    .slice(0, 12);
}

function signatureOk(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  if (left.length === 0 || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

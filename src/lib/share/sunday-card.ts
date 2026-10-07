import { createHmac, timingSafeEqual } from "node:crypto";

import { format, parseISO } from "date-fns";

import { isIsoDate } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { pluralWorkouts } from "@/lib/workout/history-stats";

export const SUNDAY_CARD_HEADING = "14 дней";
export const SUNDAY_CARD_QUERY_LIMIT = 160;

const CARD_WIDTH = 1080;
const INK = "#2A100A";
const MUTED = "#8C7368";
const PAPER = "#FFF6EE";
const ACCENT = "#CD4918";
const LINE = "#E7D5C8";

const MAX_PROTEIN_DAYS = 14;
const MAX_GYM_SESSIONS = 42;

export interface SundayCard {
  from: string;
  to: string;
  proteinHit: number;
  proteinDays: number;
  gymSessions: number;
}

export function sundayCardFromBrief(brief: {
  from: string;
  to: string;
  coverage: string;
  nutrition: { protein_hit: number; protein_total: number };
  gym: { completed: number };
}): SundayCard | null {
  if (brief.coverage === "empty") {
    return null;
  }
  return sundayCardFromCounts({
    from: brief.from,
    to: brief.to,
    proteinHit: brief.nutrition.protein_hit,
    proteinDays: brief.nutrition.protein_total,
    gymSessions: brief.gym.completed,
  });
}

export function sundayCardFromCounts(input: {
  from: string;
  to: string;
  proteinHit: number;
  proteinDays: number;
  gymSessions: number;
}): SundayCard | null {
  if (!isIsoDate(input.from) || !isIsoDate(input.to) || input.from > input.to) {
    return null;
  }
  const span = daysBetween(input.from, input.to);
  if (span == null || span > 13) {
    return null;
  }
  if (
    !isCount(input.proteinDays, MAX_PROTEIN_DAYS) ||
    !isCount(input.proteinHit, MAX_PROTEIN_DAYS) ||
    !isCount(input.gymSessions, MAX_GYM_SESSIONS)
  ) {
    return null;
  }
  if (input.proteinHit > input.proteinDays) {
    return null;
  }
  if (input.proteinDays === 0 && input.gymSessions === 0) {
    return null;
  }
  return {
    from: input.from,
    to: input.to,
    proteinHit: input.proteinHit,
    proteinDays: input.proteinDays,
    gymSessions: input.gymSessions,
  };
}

/** What the gym chat sees. Protein days and sessions — no scale, no max. */
export function sundayCardCaption(card: SundayCard): string {
  const lines = [`${SUNDAY_CARD_HEADING} · ${rangeLabel(card.from, card.to)}`];
  if (card.proteinDays > 0) {
    lines.push(`Белок в цели ${card.proteinHit} из ${card.proteinDays}`);
  }
  lines.push(gymShareLine(card.gymSessions));
  return lines.join("\n");
}

export function encodeSundayCard(card: SundayCard, secret: string): string {
  const body = [
    "su",
    compactDate(card.from),
    compactDate(card.to),
    String(card.proteinHit),
    String(card.proteinDays),
    String(card.gymSessions),
  ].join("|");
  return `${body}|${sign(body, secret)}`;
}

export function decodeSundayCard(
  query: string,
  secret: string,
): SundayCard | null {
  const trimmed = query.trim();
  if (trimmed.length > SUNDAY_CARD_QUERY_LIMIT || !trimmed.startsWith("su|")) {
    return null;
  }
  const parts = trimmed.split("|");
  if (parts.length !== 7 || parts[0] !== "su") {
    return null;
  }
  const body = parts.slice(0, 6).join("|");
  const signature = parts[6] ?? "";
  if (!signatureOk(sign(body, secret), signature)) {
    return null;
  }
  const from = expandDate(parts[1] ?? "");
  const to = expandDate(parts[2] ?? "");
  if (!from || !to) {
    return null;
  }
  return sundayCardFromCounts({
    from,
    to,
    proteinHit: Number(parts[3]),
    proteinDays: Number(parts[4]),
    gymSessions: Number(parts[5]),
  });
}

export function sundayCardSvg(card: SundayCard): string {
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
      value: SUNDAY_CARD_HEADING,
    }),
  );
  y = 252;
  chunks.push(
    text({
      x: 80,
      y,
      size: 30,
      fill: MUTED,
      value: rangeLabel(card.from, card.to),
    }),
  );
  y = 300;

  if (card.proteinDays > 0) {
    y = drawStat(
      chunks,
      "Белок",
      `${card.proteinHit} из ${card.proteinDays}`,
      "дней в цели",
      y,
    );
  }
  y = drawStat(
    chunks,
    "Зал",
    String(card.gymSessions),
    card.gymSessions <= 0 ? "Без тренировок" : pluralWorkouts(card.gymSessions),
    y,
  );

  const height = y + 48;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">
  <rect width="${CARD_WIDTH}" height="${height}" fill="${PAPER}"/>
  <rect width="${CARD_WIDTH}" height="12" fill="${ACCENT}"/>
  ${chunks.join("\n  ")}
</svg>`;
}

export function sundayCardSize(card: SundayCard): {
  width: number;
  height: number;
} {
  const height = Number(/ height="(\d+)"/.exec(sundayCardSvg(card))?.[1]);
  return {
    width: CARD_WIDTH,
    height: Number.isFinite(height) && height > 0 ? height : CARD_WIDTH,
  };
}

function drawStat(
  chunks: string[],
  label: string,
  value: string,
  hint: string,
  y: number,
): number {
  y += 72;
  chunks.push(
    text({
      x: 80,
      y,
      size: 22,
      weight: 700,
      fill: MUTED,
      value: label,
      spacing: 1.5,
    }),
  );
  y += 72;
  chunks.push(
    text({
      x: 80,
      y,
      size: 64,
      weight: 700,
      fill: INK,
      value,
    }),
  );
  y += 44;
  chunks.push(
    text({
      x: 80,
      y,
      size: 30,
      fill: MUTED,
      value: hint,
    }),
  );
  y += 36;
  chunks.push(`<line x1="80" y1="${y}" x2="1000" y2="${y}" stroke="${LINE}"/>`);
  return y;
}

function gymShareLine(sessions: number): string {
  if (sessions <= 0) {
    return "Без тренировок";
  }
  return `${sessions} ${pluralWorkouts(sessions)}`;
}

function rangeLabel(from: string, to: string): string {
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

function text(input: {
  x: number;
  y: number;
  size: number;
  fill: string;
  value: string;
  weight?: 500 | 700;
  spacing?: number;
}): string {
  const spacing =
    input.spacing == null ? "" : ` letter-spacing="${input.spacing}"`;
  return `<text x="${input.x}" y="${input.y}" font-family="Manrope" font-size="${input.size}" font-weight="${input.weight ?? 500}" fill="${input.fill}"${spacing}>${xml(input.value)}</text>`;
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isCount(value: number, max: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= max;
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

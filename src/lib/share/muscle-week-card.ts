import { createHmac, timingSafeEqual } from "node:crypto";
import { isIsoDate } from "@/lib/day/dates";
import {
  shareCardExpired,
  shareCardExpiresAt,
} from "@/lib/share/share-card-exp";
import type { MuscleSnapshot } from "@/lib/types";
import { MUSCLE_LABELS } from "@/lib/workout/muscle-taxonomy";

export const MUSCLE_WEEK_CARD_TITLE = "Карта мышц";
export const MUSCLE_WEEK_CARD_BUTTON = "Карта мышц за неделю";
export const MUSCLE_WEEK_CARD_EMPTY =
  "Нужна хотя бы одна тренировка за 7 дней.";

export type MuscleWeekRow = {
  label: string;
  sets_per_week: number;
};

export type MuscleWeekCard = {
  from: string;
  to: string;
  rows: MuscleWeekRow[];
  sessions: number;
};

export function buildMuscleWeekCard(
  snapshot: MuscleSnapshot,
): MuscleWeekCard | null {
  if (!isIsoDate(snapshot.since) || !isIsoDate(snapshot.until)) {
    return null;
  }
  if (snapshot.completed_sessions <= 0) {
    return null;
  }
  const rows = snapshot.muscles
    .filter((item) => item.sets > 0)
    .sort((left, right) => right.sets_per_week - left.sets_per_week)
    .slice(0, 6)
    .map((item) => ({
      label: MUSCLE_LABELS[item.id],
      sets_per_week: item.sets_per_week,
    }));
  if (rows.length === 0) {
    return null;
  }
  return {
    from: snapshot.since,
    to: snapshot.until,
    rows,
    sessions: snapshot.completed_sessions,
  };
}

export function muscleWeekCardCaption(card: MuscleWeekCard): string {
  return `${MUSCLE_WEEK_CARD_TITLE} · ${card.from} — ${card.to}`;
}

export function muscleWeekCardPhotoUrl(origin: string, query: string): string {
  return `${origin}/api/share/card?q=${encodeURIComponent(query)}`;
}

export function encodeMuscleWeekCard(
  card: MuscleWeekCard,
  secret: string,
): string {
  const body = [
    "mw",
    compactDate(card.from),
    compactDate(card.to),
    String(card.sessions),
    card.rows
      .map((row) => `${row.label}:${formatShareNumber(row.sets_per_week)}`)
      .join("|"),
    String(shareCardExpiresAt()),
  ].join(".");
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

export function decodeMuscleWeekCard(
  query: string,
  secret: string,
): MuscleWeekCard | null {
  const trimmed = query.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) {
    return null;
  }
  const body = trimmed.slice(0, lastDot);
  const sig = trimmed.slice(lastDot + 1);
  if (!signatureOk(sign(body, secret), sig)) {
    return null;
  }
  const parts = body.split(".");
  if (parts[0] !== "mw" || parts.length < 5) {
    return null;
  }
  const hasExp = parts.length >= 6;
  if (hasExp) {
    const exp = Number(parts[parts.length - 1]);
    if (shareCardExpired(exp)) {
      return null;
    }
  }
  const from = expandCompactDate(parts[1]);
  const to = expandCompactDate(parts[2]);
  const sessions = Number.parseInt(parts[3] ?? "", 10);
  if (!from || !to || !Number.isFinite(sessions)) {
    return null;
  }
  const rows: MuscleWeekRow[] = [];
  for (const chunk of (parts[4] ?? "").split("|")) {
    if (chunk === "") {
      continue;
    }
    const colon = chunk.lastIndexOf(":");
    if (colon <= 0) {
      continue;
    }
    const label = chunk.slice(0, colon);
    const sets = Number.parseFloat(chunk.slice(colon + 1));
    if (!Number.isFinite(sets)) {
      continue;
    }
    rows.push({ label, sets_per_week: sets });
  }
  if (rows.length === 0) {
    return null;
  }
  return { from, to, rows, sessions };
}

export function muscleWeekCardSvg(card: MuscleWeekCard): string {
  const width = 1080;
  const height = 1350;
  const pad = 72;
  let y = pad + 40;
  const lines: string[] = [];
  lines.push(
    `<text x="${pad}" y="${y}" font-size="52" font-weight="700" fill="#1a1a1a">${escapeXml(MUSCLE_WEEK_CARD_TITLE)}</text>`,
  );
  y += 56;
  lines.push(
    `<text x="${pad}" y="${y}" font-size="28" fill="#555">${escapeXml(card.from)} — ${escapeXml(card.to)} · ${card.sessions} трен.</text>`,
  );
  y += 72;
  const maxSets = Math.max(...card.rows.map((row) => row.sets_per_week), 1);
  for (const row of card.rows) {
    const barW = Math.round(
      ((width - pad * 2) * 0.55 * row.sets_per_week) / maxSets,
    );
    lines.push(
      `<text x="${pad}" y="${y}" font-size="30" fill="#222">${escapeXml(row.label)}</text>`,
    );
    y += 36;
    lines.push(
      `<rect x="${pad}" y="${y}" width="${barW}" height="28" rx="8" fill="#3d7a5f"/>`,
    );
    lines.push(
      `<text x="${pad + barW + 16}" y="${y + 22}" font-size="26" fill="#333">${formatShareNumber(row.sets_per_week)} подх./нед</text>`,
    );
    y += 56;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f6f3ee"/>${lines.join("")}</svg>`;
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

function formatShareNumber(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function compactDate(iso: string): string {
  return iso.replaceAll("-", "");
}

function expandCompactDate(value: string): string | null {
  if (!/^\d{8}$/.test(value)) {
    return null;
  }
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return isIsoDate(iso) ? iso : null;
}

import {
  HUNDRED_WEIGHT_LINE,
  hundredWeightLine,
  PROTEIN_CLOSED_LABEL,
  proteinWeekLine,
  sessionDoneHeadline,
  sessionMilestoneLine,
} from "@/lib/flavor";
import type { SessionFeel } from "@/lib/types";
import { recordLine } from "@/lib/workout/beats";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export const JOY_KINDS = [
  "session",
  "protein",
  "milestone",
  "hundred",
  "record",
] as const;
export type JoyKind = (typeof JOY_KINDS)[number];
export type JoyDoodle = "cookie" | "trex";

export interface JoyLift {
  name: string;
  kg: number;
}

export interface JoyMoment {
  kind: JoyKind;
  line: string;
  doodle: JoyDoodle;
  allowKg: boolean;
  feel?: SessionFeel | null;
  sessions?: number;
  proteinHits?: number;
  recordName?: string;
}

export interface JoyShareRequest {
  kind: JoyKind;
  feel?: SessionFeel | null;
  sessions?: number;
  proteinHits?: number;
  recordName?: string;
  lift?: JoyLift | null;
}

export const SHARE_TO_CHAT = "В чат";
export const SHARE_STORY_LABEL = "Сторис";
export const SHARE_STORY_UNAVAILABLE =
  "Сторис недоступны в этом Telegram — попробуй «В чат» или обнови приложение.";
export const SHARE_WRITE_KG = "Написать кг";
export const SHARE_HIDE_KG = "Без кг";
export const BOT_INSTALL_DIARY = "Поставить дневник";
export const SHARE_FAILED = "Не отправилось.";
export const JOY_INLINE_PREFIX = "joy ";
export const JOY_SESSION_COUNTS = [1, 10, 50, 100] as const;
export const JOY_PROTEIN_HITS = 7;

export function isJoyKind(value: string): value is JoyKind {
  return JOY_KINDS.some((kind) => kind === value);
}

export function heaviestWorkLift(
  exercises: ReadonlyArray<{
    exercise: { name: string; short_name: string | null };
    sets: ReadonlyArray<{
      set_type: string;
      planned_weight: number | null;
      actual_weight: number | null;
    }>;
  }>,
): JoyLift | null {
  let best: JoyLift | null = null;
  for (const item of exercises) {
    for (const set of item.sets) {
      if (set.set_type !== "work") {
        continue;
      }
      const kg = set.actual_weight ?? set.planned_weight;
      if (kg == null || kg <= 0) {
        continue;
      }
      if (best == null || kg > best.kg) {
        best = {
          name: exerciseShortLabel(
            item.exercise.short_name,
            item.exercise.name,
          ),
          kg,
        };
      }
    }
  }
  return best;
}

export function isJoySessionCount(count: number): boolean {
  return JOY_SESSION_COUNTS.some((value) => value === count);
}

export function sessionJoyMoment(input: {
  feel: SessionFeel | null;
  completedSessions: number;
  workKg: number | null;
  record?: { name: string; kg: number } | null;
}): JoyMoment | null {
  if (input.feel === "miss") {
    return null;
  }

  if (isJoySessionCount(input.completedSessions)) {
    const milestone = sessionMilestoneLine(input.completedSessions);
    if (milestone) {
      return {
        kind: "milestone",
        line: milestone,
        doodle: "trex",
        allowKg: true,
        sessions: input.completedSessions,
      };
    }
  }

  if (hundredWeightLine(input.workKg)) {
    return {
      kind: "hundred",
      line: HUNDRED_WEIGHT_LINE,
      doodle: "trex",
      allowKg: true,
    };
  }

  const record = input.record;
  if (record && record.name.trim() !== "" && record.kg > 0) {
    return {
      kind: "record",
      line: recordLine(record.name),
      doodle: "trex",
      allowKg: true,
      recordName: record.name,
    };
  }

  return null;
}

export function dayJoyMoment(input: {
  proteinClosed: boolean;
  bodyWeight: number | null;
  proteinHits?: number;
}): JoyMoment | null {
  if (hundredWeightLine(input.bodyWeight)) {
    return {
      kind: "hundred",
      line: HUNDRED_WEIGHT_LINE,
      doodle: "trex",
      allowKg: false,
    };
  }
  if (!input.proteinClosed || input.proteinHits !== JOY_PROTEIN_HITS) {
    return null;
  }
  const line = proteinWeekLine(input.proteinHits);
  if (!line) {
    return null;
  }
  return {
    kind: "protein",
    line,
    doodle: "cookie",
    allowKg: false,
    proteinHits: input.proteinHits,
  };
}

export function joyMomentFromRequest(
  request: JoyShareRequest,
): JoyMoment | null {
  if (request.kind === "session") {
    if (request.feel === "miss") {
      return null;
    }
    return {
      kind: "session",
      line: sessionDoneHeadline(request.feel ?? null),
      doodle: "trex",
      allowKg: true,
      feel: request.feel ?? null,
    };
  }

  if (request.kind === "milestone") {
    const sessions = request.sessions ?? 0;
    const line = sessionMilestoneLine(sessions);
    if (!line) {
      return null;
    }
    return {
      kind: "milestone",
      line,
      doodle: "trex",
      allowKg: true,
      sessions,
    };
  }

  if (request.kind === "protein") {
    const hits = request.proteinHits ?? 0;
    return {
      kind: "protein",
      line: proteinWeekLine(hits) ?? PROTEIN_CLOSED_LABEL,
      doodle: "cookie",
      allowKg: false,
      proteinHits: hits,
    };
  }

  if (request.kind === "record") {
    const name = cleanRecordName(request.recordName);
    if (!name) {
      return null;
    }
    return {
      kind: "record",
      line: recordLine(name),
      doodle: "trex",
      allowKg: true,
      recordName: name,
    };
  }

  return {
    kind: "hundred",
    line: HUNDRED_WEIGHT_LINE,
    doodle: "trex",
    allowKg: true,
  };
}

export function sanitizeJoyLift(
  lift: JoyLift | null | undefined,
): JoyLift | null {
  if (lift == null) {
    return null;
  }
  const name = lift.name.replaceAll(/\s+/g, " ").trim().slice(0, 40);
  if (
    name === "" ||
    !Number.isFinite(lift.kg) ||
    lift.kg <= 0 ||
    lift.kg >= 1000
  ) {
    return null;
  }
  return { name, kg: lift.kg };
}

export function joyShareRequest(
  moment: JoyMoment,
  lift: JoyLift | null,
): JoyShareRequest {
  const safeLift = moment.allowKg ? sanitizeJoyLift(lift) : null;
  return {
    kind: moment.kind,
    feel: moment.feel ?? null,
    sessions: moment.sessions,
    proteinHits: moment.proteinHits,
    recordName: moment.recordName,
    lift: safeLift,
  };
}

export function joyShareCaption(
  line: string,
  lift: JoyLift | null,
  allowKg: boolean,
): string {
  if (!allowKg || lift == null) {
    return line;
  }
  if (line.startsWith(`${lift.name}.`)) {
    return `${line} ${formatWeight(lift.kg)}`;
  }
  return `${line} ${lift.name} ${formatWeight(lift.kg)}`;
}

export function joyPhotoPath(doodle: JoyDoodle): string {
  return doodle === "cookie" ? "/share/cookie.jpg" : "/share/trex.jpg";
}

export function joyInlineQuery(
  moment: JoyMoment,
  lift: JoyLift | null,
): string {
  const parts = [JOY_INLINE_PREFIX.trim(), moment.kind];
  if (moment.kind === "session") {
    parts.push(moment.feel ?? "done");
  } else if (moment.kind === "milestone") {
    parts.push(String(moment.sessions ?? 0));
  } else if (moment.kind === "protein" && (moment.proteinHits ?? 0) > 0) {
    parts.push(String(moment.proteinHits));
  } else if (moment.kind === "record") {
    const name = moment.recordName?.trim() ?? "";
    if (name === "") {
      return parts.join(" ");
    }
    const safe = sanitizeJoyLift(lift);
    if (safe == null) {
      return `${parts.join(" ")} | ${name}`;
    }
    return `${parts.join(" ")} | ${name} | ${formatWeight(safe.kg)}`;
  }
  const base = parts.join(" ");
  const safe = sanitizeJoyLift(lift);
  if (!moment.allowKg || safe == null) {
    return base;
  }
  return `${base} | ${safe.name} | ${formatWeight(safe.kg)}`;
}

export function parseJoyInlineQuery(query: string): JoyShareRequest | null {
  const trimmed = query.trim();
  if (!trimmed.toLowerCase().startsWith("joy")) {
    return null;
  }

  const [head, nameRaw, kgRaw] = trimmed.split("|").map((part) => part.trim());
  const tokens = (head ?? "").split(/\s+/).filter(Boolean);
  const kind = tokens[1];
  if (!kind || !isJoyKind(kind)) {
    return null;
  }

  const lift = parseInlineLift(nameRaw, kgRaw);
  if (kind === "session") {
    return { kind, feel: parseInlineFeel(tokens[2]), lift };
  }
  if (kind === "milestone") {
    const sessions = Number(tokens[2]);
    if (!Number.isInteger(sessions) || sessions < 1) {
      return null;
    }
    return { kind, sessions, lift };
  }
  if (kind === "protein") {
    const hits = tokens[2] == null ? 0 : Number(tokens[2]);
    if (!Number.isInteger(hits) || hits < 0) {
      return null;
    }
    return { kind, proteinHits: hits, lift: null };
  }
  if (kind === "record") {
    const recordName = cleanRecordName(nameRaw);
    if (!recordName) {
      return null;
    }
    return { kind, recordName, lift: parseInlineLift(recordName, kgRaw) };
  }
  return { kind, lift };
}

function cleanRecordName(value: string | undefined): string | null {
  if (value == null) {
    return null;
  }
  const name = value.replaceAll(/\s+/g, " ").trim().slice(0, 40);
  return name === "" ? null : name;
}

function parseInlineFeel(value: string | undefined): SessionFeel | null {
  if (value === "easy" || value === "close" || value === "miss") {
    return value;
  }
  return null;
}

function parseInlineLift(
  nameRaw: string | undefined,
  kgRaw: string | undefined,
): JoyLift | null {
  if (nameRaw == null || kgRaw == null) {
    return null;
  }
  const kg = Number(kgRaw.replace(",", "."));
  return sanitizeJoyLift({ name: nameRaw, kg });
}

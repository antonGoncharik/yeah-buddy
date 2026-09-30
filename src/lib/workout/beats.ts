import { relativeStrength } from "@/lib/day/body-weight";
import type { SessionBeats } from "@/lib/types";
import { exerciseNameKey } from "@/lib/workout/dedupe-exercises";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { peakWorkWeight } from "@/lib/workout/session-format";

export const CIRCLE_OPENED_LINE = "Неделя пройдена. Следующая уже идёт.";
const OWN_WEIGHT = "Свой вес.";
const SQUAT_AND_A_HALF = "Полтора.";

const ANCHORS = {
  [exerciseNameKey("Приседания со штангой")]: "squat",
  [exerciseNameKey("Жим лёжа")]: "bench",
  [exerciseNameKey("Становая тяга")]: "deadlift",
} as const;

type AnchorLift = (typeof ANCHORS)[keyof typeof ANCHORS];

const MARKS: Record<
  AnchorLift,
  ReadonlyArray<{ ratio: number; phrase: string }>
> = {
  squat: [
    { ratio: 1.5, phrase: SQUAT_AND_A_HALF },
    { ratio: 1, phrase: OWN_WEIGHT },
  ],
  bench: [{ ratio: 1, phrase: OWN_WEIGHT }],
  deadlift: [{ ratio: 1, phrase: OWN_WEIGHT }],
};

export interface SessionBeat {
  kind: "record" | "relative";
  line: string;
  name: string;
  kg: number;
}

export function recordLine(name: string): string {
  return `${name}. Выше, чем было.`;
}

export function phaseOpenedItself(input: {
  autoEnd: boolean;
  completedCount: number;
  circleSize: number;
  previousCount: number | null;
  previousLast: boolean;
  previousIncreases: boolean;
}): boolean {
  if (!input.autoEnd || input.completedCount !== 0 || input.circleSize <= 0) {
    return false;
  }
  if (input.previousCount == null || input.previousCount < input.circleSize) {
    return false;
  }
  if (input.previousLast || input.previousIncreases) {
    return false;
  }
  return true;
}

export function sessionClosedCircle(input: {
  sessionDate: string;
  today: string;
  sessionPhaseId: string | null;
  currentPhaseId: string | null;
  openedItself: boolean;
}): boolean {
  return (
    input.openedItself &&
    input.sessionDate === input.today &&
    input.sessionPhaseId != null &&
    input.currentPhaseId != null &&
    input.sessionPhaseId !== input.currentPhaseId
  );
}

interface BeatRow {
  exerciseId: string;
  name: string;
  shortName: string | null;
  weight: number | null;
  priorPeak: number | null | undefined;
}

export function pickSessionBeat(
  rows: readonly BeatRow[],
  bodyWeight: number | null,
): SessionBeat | null {
  let record: { beat: SessionBeat; delta: number; index: number } | null = null;
  let relative: { beat: SessionBeat; ratio: number; index: number } | null =
    null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (
      row == null ||
      row.priorPeak === undefined ||
      row.weight == null ||
      row.weight <= 0
    ) {
      continue;
    }

    if (row.priorPeak != null && row.weight > row.priorPeak) {
      const delta = row.weight - row.priorPeak;
      const name = beatName(row.shortName, row.name);
      const next = {
        beat: {
          kind: "record" as const,
          line: recordLine(name),
          name,
          kg: row.weight,
        },
        delta,
        index,
      };
      if (
        record == null ||
        next.delta > record.delta ||
        (next.delta === record.delta && next.index < record.index)
      ) {
        record = next;
      }
    }

    const mark = relativeMark(row, bodyWeight);
    if (mark == null) {
      continue;
    }
    const name = beatName(row.shortName, row.name);
    const next = {
      beat: {
        kind: "relative" as const,
        line: `${name}. ${mark.phrase}`,
        name,
        kg: row.weight,
      },
      ratio: mark.ratio,
      index,
    };
    if (
      relative == null ||
      next.ratio > relative.ratio ||
      (next.ratio === relative.ratio && next.index < relative.index)
    ) {
      relative = next;
    }
  }

  return relative?.beat ?? record?.beat ?? null;
}

export function sessionDetailBeat(detail: {
  exercises: ReadonlyArray<{
    exercise_id: string;
    exercise: { name: string; short_name: string | null };
    sets: Parameters<typeof peakWorkWeight>[0];
  }>;
  beats: SessionBeats | null;
}): SessionBeat | null {
  if (detail.beats == null) {
    return null;
  }

  const peaks = new Map(
    detail.beats.peaks.map((row) => [row.exercise_id, row.prior_peak]),
  );

  return pickSessionBeat(
    detail.exercises.map((item) => ({
      exerciseId: item.exercise_id,
      name: item.exercise.name,
      shortName: item.exercise.short_name,
      weight: workWeight(item.sets),
      priorPeak: peaks.has(item.exercise_id)
        ? peaks.get(item.exercise_id)
        : undefined,
    })),
    detail.beats.body_weight,
  );
}

function workWeight(sets: Parameters<typeof peakWorkWeight>[0]): number | null {
  return peakWorkWeight(sets);
}

function beatName(shortName: string | null, name: string): string {
  const label = exerciseShortLabel(shortName, name).replace(/\s+/g, " ").trim();
  if (label === "") {
    return "Упражнение";
  }
  return label.charAt(0).toLocaleUpperCase("ru") + label.slice(1);
}

function relativeMark(
  row: BeatRow,
  bodyWeight: number | null,
): { ratio: number; phrase: string } | null {
  if (bodyWeight == null || row.weight == null || row.priorPeak === undefined) {
    return null;
  }

  const lift = ANCHORS[exerciseNameKey(row.name)];
  if (lift == null) {
    return null;
  }

  const current = relativeStrength(row.weight, bodyWeight);
  if (current == null) {
    return null;
  }

  const prior =
    row.priorPeak == null ? null : relativeStrength(row.priorPeak, bodyWeight);
  if (row.priorPeak != null && prior == null) {
    return null;
  }

  for (const mark of MARKS[lift]) {
    if (current >= mark.ratio && (prior == null || prior < mark.ratio)) {
      return mark;
    }
  }
  return null;
}

import { isRecord } from "@/lib/read";
import type { ExerciseTrack } from "@/lib/types";
import { floorToStep } from "@/lib/workout/formulas";
import { formatWeight, toNumber } from "@/lib/workout/numbers";
import { MAX_TRACK_STEPS } from "@/lib/workout/slot-plan-schema";

export const DEFAULT_TRACK_LENGTH = 6;

export function mapExerciseTrack(row: Record<string, unknown>): ExerciseTrack {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exercise_id: String(row.exercise_id),
    name: typeof row.name === "string" && row.name.trim() ? row.name : null,
    steps: parseTrackSteps(row.steps),
    position: Math.max(0, Math.floor(toNumber(row.position))),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function parseExerciseTrack(value: unknown): ExerciseTrack | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }
  const track = mapExerciseTrack(value);
  return track.steps.length > 0 ? track : null;
}

export function parseTrackSteps(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .slice(0, MAX_TRACK_STEPS);
}

/** Weight for a step index; past the end the line holds its last weight. */
export function trackWeightAt(
  track: Pick<ExerciseTrack, "steps">,
  index: number,
): number | null {
  if (track.steps.length === 0) {
    return null;
  }
  const clamped = Math.min(Math.max(index, 0), track.steps.length - 1);
  return track.steps[clamped] ?? null;
}

export function trackFinished(
  track: Pick<ExerciseTrack, "steps" | "position">,
): boolean {
  return track.position >= track.steps.length;
}

/** Weight the next planned session will use. */
export function trackCurrentWeight(
  track: Pick<ExerciseTrack, "steps" | "position">,
): number | null {
  return trackWeightAt(track, track.position);
}

export function generateTrackSteps(input: {
  start: number;
  step: number;
  count: number;
  /** Adds one lighter step at the end (~80 % of the start). */
  deload?: boolean;
  weightStep?: number;
}): number[] {
  const count = Math.min(
    Math.max(Math.floor(input.count), 1),
    MAX_TRACK_STEPS - (input.deload ? 1 : 0),
  );
  const round = input.weightStep ?? 0.5;
  const steps: number[] = [];
  for (let index = 0; index < count; index += 1) {
    steps.push(round2(input.start + input.step * index));
  }
  if (input.deload) {
    steps.push(Math.max(round, floorToStep(input.start * 0.8, round)));
  }
  return steps;
}

/**
 * Next line after this one is done: same shape, shifted up by two increments
 * (a 2.5 kg line becomes +5 kg), so «Цикл 2» starts where a lifter expects.
 */
export function nextTrackProposal(
  track: Pick<ExerciseTrack, "steps">,
  weightStep: number,
): number[] {
  const increment = trackIncrement(track) ?? weightStep;
  const shift = round2(increment * 2);
  return track.steps.map((step) => round2(step + shift));
}

/** Typical distance between neighbouring steps, ignoring a trailing deload. */
export function trackIncrement(
  track: Pick<ExerciseTrack, "steps">,
): number | null {
  const rising = track.steps.filter(
    (step, index) => index === 0 || step >= (track.steps[index - 1] ?? 0),
  );
  if (rising.length < 2) {
    return null;
  }
  const first = rising[0];
  const second = rising[1];
  if (first == null || second == null || second <= first) {
    return null;
  }
  return round2(second - first);
}

export function trackSummary(
  track: Pick<ExerciseTrack, "steps" | "position">,
): string {
  if (track.steps.length === 0) {
    return "нет";
  }
  const first = track.steps[0];
  const last = track.steps[track.steps.length - 1];
  const range =
    first != null && last != null && first !== last
      ? `${formatWeight(first)} → ${formatWeight(last)} кг`
      : `${formatWeight(first ?? 0)} кг`;
  if (trackFinished(track)) {
    return `${range} · пройдена`;
  }
  return `${range} · шаг ${track.position + 1} из ${track.steps.length}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Shift every step by kilograms. Position stays; the current weight moves. */
export function shiftTrackByKg(steps: number[], kg: number): number[] {
  if (!(kg > 0) || steps.length === 0) {
    return steps;
  }
  return steps.map((step) => round2(step + kg)).filter((step) => step > 0);
}

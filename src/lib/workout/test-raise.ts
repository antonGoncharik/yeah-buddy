import type { FormulaSetSpec, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { raisedMaxForPhase } from "@/lib/workout/cycle-query";
import { calcPlannedWeight, floorToStep } from "@/lib/workout/formulas";

/** The static test is a clean hold of this many seconds. */
export const STATIC_TEST_SECONDS = 8;

export interface ExerciseTestAttempt {
  kind: WorkoutKind;
  weight: number;
  reps: number | null;
  seconds: number | null;
  requiredReps: number | null;
  requiredSeconds: number | null;
}

/** New max after a passed dynamic test. Null when the reps were short. */
export function dynamicTestMax(input: {
  maxKg: number;
  stepKg: number;
  weight: number;
  reps: number;
  requiredReps: number;
}): number | null {
  if (!(input.weight > 0) || input.reps < input.requiredReps) {
    return null;
  }
  const estimated = floorToStep(
    input.weight * (1 + input.reps / 30),
    input.stepKg,
  );
  const stepUp = floorToStep(input.maxKg + input.stepKg, input.stepKg);
  return Math.max(stepUp, estimated);
}

/** New max after a clean 8s hold. Null when the hold was short. */
export function staticTestMax(input: {
  maxKg: number;
  stepKg: number;
  seconds: number;
  requiredSeconds: number;
}): number | null {
  if (
    input.requiredSeconds < STATIC_TEST_SECONDS ||
    input.seconds < STATIC_TEST_SECONDS ||
    input.seconds < input.requiredSeconds
  ) {
    return null;
  }
  return floorToStep(input.maxKg + input.stepKg, input.stepKg);
}

export function dropMaxFivePercent(maxKg: number, stepKg: number): number {
  return floorToStep(maxKg * 0.95, stepKg);
}

/**
 * Max for the next week. A passed dynamic test and a passed static test
 * both count; the higher one wins. Two macros in a row with no passed test
 * take 5% off.
 */
export function maxAfterTest(input: {
  maxKg: number;
  stepKg: number;
  attempts: ExerciseTestAttempt[];
  previousFailed: boolean;
}): number {
  let best: number | null = null;
  for (const attempt of input.attempts) {
    const next = raiseFromAttempt(input.maxKg, input.stepKg, attempt);
    if (next != null && (best == null || next > best)) {
      best = next;
    }
  }
  if (best != null) {
    return best;
  }
  if (input.previousFailed) {
    return dropMaxFivePercent(input.maxKg, input.stepKg);
  }
  return input.maxKg;
}

export function testWasPassed(input: {
  maxKg: number;
  stepKg: number;
  attempts: ExerciseTestAttempt[];
}): boolean {
  return input.attempts.some(
    (attempt) => raiseFromAttempt(input.maxKg, input.stepKg, attempt) != null,
  );
}

/**
 * Work sets that are the test. The heaviest load wins, wherever it sits.
 * A static test also has to be planned for at least 8 seconds. Several sets
 * at that same load all count; the better result is kept.
 */
export function heaviestWorkIndexes(
  kind: WorkoutKind,
  sets: Array<{ load: number; reps: number | null; seconds: number | null }>,
): number[] {
  const eligible = sets.flatMap((set, index) => {
    if (kind === "static") {
      return (set.seconds ?? 0) >= STATIC_TEST_SECONDS ? [index] : [];
    }
    return set.load > 0 && (set.reps ?? 0) > 0 ? [index] : [];
  });
  const top = eligible.reduce<number | null>((best, index) => {
    const load = sets[index]?.load ?? 0;
    return best == null || load > best ? load : best;
  }, null);
  if (top == null) {
    return [];
  }
  return eligible.filter((index) => (sets[index]?.load ?? 0) >= top - 0.001);
}

/** What the later weeks would use if the planned test is made as written. */
export function plannedTestMax(input: {
  maxKg: number;
  stepKg: number;
  kind: WorkoutKind;
  work: FormulaSetSpec[];
}): number | null {
  const indexes = heaviestWorkIndexes(
    input.kind,
    input.work.map((set) => ({
      load: set.percent,
      reps: set.reps,
      seconds: set.seconds,
    })),
  );
  let best: number | null = null;
  for (const index of indexes) {
    const set = input.work[index];
    if (!set) {
      continue;
    }
    const next =
      input.kind === "static"
        ? set.seconds == null
          ? null
          : staticTestMax({
              maxKg: input.maxKg,
              stepKg: input.stepKg,
              seconds: set.seconds,
              requiredSeconds: set.seconds,
            })
        : set.reps == null
          ? null
          : dynamicTestMax({
              maxKg: input.maxKg,
              stepKg: input.stepKg,
              weight: calcPlannedWeight(input.maxKg, set.percent, input.stepKg),
              reps: set.reps,
              requiredReps: set.reps,
            });
    if (next != null && (best == null || next > best)) {
      best = next;
    }
  }
  return best;
}

/** Example max on the formulas screen. Test weeks replace the percent bump. */
export function maxShownForPhase(input: {
  formulas: WorkoutFormulas;
  kind: WorkoutKind;
  phaseKey: string;
  maxKg: number;
  stepKg: number;
}): number {
  if (!raisedMaxForPhase(input.formulas.cycle, input.phaseKey)) {
    return input.maxKg;
  }

  const testPhase = input.formulas.cycle.find((phase) => phase.increase_on_end);
  if (!testPhase) {
    return input.maxKg;
  }

  const work =
    input.formulas[input.kind].phases[testPhase.key]?.work ??
    input.formulas[input.kind].base.work;
  return (
    plannedTestMax({
      maxKg: input.maxKg,
      stepKg: input.stepKg,
      kind: input.kind,
      work,
    }) ?? input.maxKg
  );
}

function raiseFromAttempt(
  maxKg: number,
  stepKg: number,
  attempt: ExerciseTestAttempt,
): number | null {
  if (attempt.kind === "static") {
    if (attempt.seconds == null || attempt.requiredSeconds == null) {
      return null;
    }
    return staticTestMax({
      maxKg,
      stepKg,
      seconds: attempt.seconds,
      requiredSeconds: attempt.requiredSeconds,
    });
  }
  if (attempt.reps == null || attempt.requiredReps == null) {
    return null;
  }
  return dynamicTestMax({
    maxKg,
    stepKg,
    weight: attempt.weight,
    reps: attempt.reps,
    requiredReps: attempt.requiredReps,
  });
}

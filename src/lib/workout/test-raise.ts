import type { FormulaSetSpec, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { raisedMaxForPhase } from "@/lib/workout/cycle-query";
import { calcPlannedWeight, floorToStep } from "@/lib/workout/formulas";
import { formatSeconds, formatWeight } from "@/lib/workout/numbers";

/**
 * A static max is the heaviest load held 5 seconds. The test asks for up to 8.
 * Extra seconds are not turned into a percent: the elbow endurance curve
 * (Frey-Law 2010) already predicts ~18s at true MVC, so it cannot price a
 * 5–8s hold. Surplus time adds one or two plate steps on the load that was held.
 */
export const STATIC_PASS_SECONDS = 5;
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

/**
 * 5s sets the max to the load that was held. 6–7s adds one step on that load,
 * 8s and more adds two. A lighter hold does not pull the max down.
 * Shorter than 5s is a miss. Null only on a miss.
 */
export function staticTestMax(input: {
  maxKg: number;
  stepKg: number;
  seconds: number;
  weightKg?: number;
}): number | null {
  if (!(input.seconds >= STATIC_PASS_SECONDS)) {
    return null;
  }
  const steps =
    input.seconds >= STATIC_TEST_SECONDS ? 2 : input.seconds >= 6 ? 1 : 0;
  const held =
    input.weightKg != null && input.weightKg > 0 ? input.weightKg : input.maxKg;
  const raised = floorToStep(held + steps * input.stepKg, input.stepKg);
  const kept = floorToStep(input.maxKg, input.stepKg);
  return Math.max(kept, raised);
}

export function dropMaxFivePercent(maxKg: number, stepKg: number): number {
  return floorToStep(maxKg * 0.95, stepKg);
}

/**
 * Max for the next week. A passed dynamic test and a passed static test
 * both count; the higher one wins. Two macros in a row with no passed test
 * take 5% off.
 */
export interface TestDecision {
  weight: number;
  note: string;
}

export function decideTest(input: {
  maxKg: number;
  stepKg: number;
  attempts: ExerciseTestAttempt[];
  previousFailed: boolean;
}): TestDecision {
  let best: TestDecision | null = null;
  let missed: string | null = null;
  for (const attempt of input.attempts) {
    const next = raiseFromAttempt(input.maxKg, input.stepKg, attempt);
    if (next == null) {
      missed = missed ?? attemptNote(attempt, false);
      continue;
    }
    if (best == null || next > best.weight) {
      const same = next <= floorToStep(input.maxKg, input.stepKg) + 0.001;
      best = { weight: next, note: attemptNote(attempt, true, same) };
    }
  }
  if (best != null) {
    return best;
  }
  if (input.previousFailed) {
    return {
      weight: dropMaxFivePercent(input.maxKg, input.stepKg),
      note: "два цикла без теста",
    };
  }
  return { weight: input.maxKg, note: missed ?? "без теста" };
}

export function maxAfterTest(input: {
  maxKg: number;
  stepKg: number;
  attempts: ExerciseTestAttempt[];
  previousFailed: boolean;
}): number {
  return decideTest(input).weight;
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
 * A static test also has to be planned for at least 5 seconds. Several sets
 * at that same load all count; the better result is kept.
 */
export function heaviestWorkIndexes(
  kind: WorkoutKind,
  sets: Array<{ load: number; reps: number | null; seconds: number | null }>,
): number[] {
  const eligible = sets.flatMap((set, index) => {
    if (kind === "static") {
      return (set.seconds ?? 0) >= STATIC_PASS_SECONDS ? [index] : [];
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
              weightKg: calcPlannedWeight(
                input.maxKg,
                set.percent,
                input.stepKg,
              ),
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

function attemptNote(
  attempt: ExerciseTestAttempt,
  passed: boolean,
  same = false,
): string {
  if (attempt.kind === "static") {
    const seconds = formatSeconds(attempt.seconds ?? 0);
    if (!passed) {
      return `${seconds} с, не сдан`;
    }
    return same ? `${seconds} с, тот же` : `${seconds} с`;
  }
  const line = `${formatWeight(attempt.weight)}×${attempt.reps ?? 0}`;
  return passed ? line : `${line}, не сдан`;
}

/** The work set that decides the max: heaviest reps, or heaviest hold of at least 5s. */
export function testSetId(
  sets: readonly {
    id: string;
    set_type: string;
    planned_weight: number | null;
    planned_reps: number | null;
    planned_seconds: number | null;
  }[],
): string | null {
  const work = sets.filter((set) => set.set_type === "work");
  const holds = work.filter(isHoldSet);
  const lifts = work.filter((set) => !isHoldSet(set));
  const group = holds.length > 0 && lifts.length === 0 ? holds : lifts;
  const kind: WorkoutKind = group === holds ? "static" : "dynamic";
  const indexes = heaviestWorkIndexes(
    kind,
    group.map((set) => ({
      load: set.planned_weight ?? 0,
      reps: set.planned_reps,
      seconds: set.planned_seconds,
    })),
  );
  const index = indexes[0];
  return index == null ? null : (group[index]?.id ?? null);
}

function isHoldSet(set: {
  planned_reps: number | null;
  planned_seconds: number | null;
}): boolean {
  return set.planned_seconds != null && set.planned_reps == null;
}

function raiseFromAttempt(
  maxKg: number,
  stepKg: number,
  attempt: ExerciseTestAttempt,
): number | null {
  if (attempt.kind === "static") {
    if (attempt.seconds == null) {
      return null;
    }
    return staticTestMax({
      maxKg,
      stepKg,
      seconds: attempt.seconds,
      weightKg: attempt.weight,
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

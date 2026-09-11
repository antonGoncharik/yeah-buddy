import type {
  SessionDetail,
  SessionFeel,
  SessionMaxRaiseOffer,
} from "@/lib/types";
import { floorToStep, increaseMax } from "@/lib/workout/formulas";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export function proposeMaxFromWorkSets(input: {
  sessionMax: number;
  step: number;
  sets: Array<{
    set_type: string;
    planned_weight: number | null;
    actual_weight: number | null;
  }>;
}): number | null {
  let best: number | null = null;
  for (const set of input.sets) {
    if (set.set_type !== "work") {
      continue;
    }
    if (set.planned_weight == null || set.planned_weight <= 0) {
      continue;
    }
    if (set.actual_weight == null || set.actual_weight <= set.planned_weight) {
      continue;
    }

    const next = floorToStep(
      (set.actual_weight * input.sessionMax) / set.planned_weight,
      input.step,
    );
    if (best == null || next > best) {
      best = next;
    }
  }

  return best;
}

export function proposeSessionMaxRaises(input: {
  inCycle: boolean;
  feel: SessionFeel | null;
  increasePercent: number;
  currentMaxByExercise: Map<string, number>;
  exercises: Array<{
    exercise_id: string;
    name: string;
    max_weight: number;
    weight_step: number;
    sets: Array<{
      set_type: string;
      planned_weight: number | null;
      actual_weight: number | null;
    }>;
  }>;
}): SessionMaxRaiseOffer[] {
  if (input.inCycle || input.feel === "miss") {
    return [];
  }

  const offers: SessionMaxRaiseOffer[] = [];
  for (const item of input.exercises) {
    const fromFact = proposeMaxFromWorkSets({
      sessionMax: item.max_weight,
      step: item.weight_step,
      sets: item.sets,
    });
    const fromEasy =
      input.feel === "easy"
        ? increaseMax(item.max_weight, input.increasePercent, item.weight_step)
        : null;
    const proposed = Math.max(fromFact ?? 0, fromEasy ?? 0);
    if (proposed <= 0) {
      continue;
    }

    const from =
      input.currentMaxByExercise.get(item.exercise_id) ?? item.max_weight;
    if (proposed <= from) {
      continue;
    }

    offers.push({
      exercise_id: item.exercise_id,
      name: item.name,
      from_weight: from,
      to_weight: proposed,
    });
  }

  return offers;
}

export function sessionRaiseOffers(
  detail: Pick<SessionDetail, "session" | "phase" | "exercises">,
  increasePercent: number,
  currentMaxByExercise: Map<string, number>,
): SessionMaxRaiseOffer[] {
  if (detail.session.status !== "completed") {
    return [];
  }

  return proposeSessionMaxRaises({
    inCycle: Boolean(detail.session.phase_id || detail.phase),
    feel: detail.session.feel,
    increasePercent,
    currentMaxByExercise,
    exercises: detail.exercises.map((item) => ({
      exercise_id: item.exercise_id,
      name: exerciseShortLabel(item.exercise.short_name, item.exercise.name),
      max_weight: item.max_weight,
      weight_step: item.exercise.weight_step,
      sets: item.sets,
    })),
  });
}

export function raiseMaxConfirmMessage(offers: SessionMaxRaiseOffer[]): string {
  const parts = offers.map(
    (item) =>
      `${item.name} ${formatWeight(item.from_weight)} → ${formatWeight(item.to_weight)}`,
  );
  if (parts.length === 1) {
    return `Поднять рабочий: ${parts[0]} кг?`;
  }
  return `Поднять рабочие: ${parts.join(", ")}?`;
}

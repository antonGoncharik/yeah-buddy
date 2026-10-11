import type {
  MuscleBalancePair,
  MuscleCell,
  MuscleId,
  MuscleMissedEvent,
} from "@/lib/types";
import {
  MUSCLE_LABELS,
  MUSCLE_LABELS_GENITIVE,
} from "@/lib/workout/muscle-taxonomy";

const STALE_DAYS = 10;

export function buildMuscleInsights(input: {
  muscles: MuscleCell[];
  missed: MuscleMissedEvent[];
  planned_template_name: string | null;
}): string[] {
  const lines: string[] = [];

  for (const pair of buildMuscleBalance(input.muscles)) {
    if (pair.ratio < 0.45) {
      lines.push(
        `${MUSCLE_LABELS[pair.a]} слабее ${MUSCLE_LABELS_GENITIVE[pair.b]} за период (${formatRatio(pair.ratio)}).`,
      );
    }
  }

  const stale = input.muscles
    .filter(
      (item) =>
        item.days_since != null &&
        item.days_since > STALE_DAYS &&
        item.sets > 0,
    )
    .sort((left, right) => (right.days_since ?? 0) - (left.days_since ?? 0))
    .slice(0, 2);

  for (const item of stale) {
    lines.push(
      `${item.label} не трогали ${item.days_since} дн — последний раз ${item.last_trained ?? "—"}.`,
    );
  }

  const lowVolume = input.muscles
    .filter((item) => item.volume_band <= 1 && item.sets > 0)
    .sort((left, right) => left.sets_per_week - right.sets_per_week)
    .slice(0, 1);

  for (const item of lowVolume) {
    lines.push(
      `${item.label} — мало объёма: ~${item.sets_per_week} раб. подх./нед.`,
    );
  }

  const lastMissed = input.missed.at(-1);
  if (lastMissed) {
    const name = lastMissed.template_name ?? "тренировку";
    lines.push(`Пропуск: «${name}» (${lastMissed.date}).`);
  }

  if (input.planned_template_name) {
    lines.push(`Дальше в очереди: «${input.planned_template_name}».`);
  }

  if (lines.length === 0) {
    lines.push("За период нагрузка выглядит ровно.");
  }

  return lines.slice(0, 4);
}

export function buildMuscleBalance(muscles: MuscleCell[]): MuscleBalancePair[] {
  const pick = (id: MuscleId) =>
    muscles.find((item) => item.id === id)?.sets_per_week ?? 0;

  return [
    balancePair(
      "chest",
      "upper_back",
      pick("chest"),
      pick("upper_back") + pick("lats"),
    ),
    balancePair("quads", "hamstrings", pick("quads"), pick("hamstrings")),
    balancePair(
      "front_delts",
      "rear_delts",
      pick("front_delts") + pick("side_delts"),
      pick("rear_delts"),
    ),
  ].filter((item): item is MuscleBalancePair => item != null);
}

function balancePair(
  a: MuscleId,
  b: MuscleId,
  aSets: number,
  bSets: number,
): MuscleBalancePair | null {
  const sum = aSets + bSets;
  if (sum < 2) {
    return null;
  }
  const hi = Math.max(aSets, bSets, 0.5);
  const lo = Math.min(aSets, bSets);
  const ratio = lo / hi;
  return {
    a,
    b,
    ratio: Math.round(ratio * 100) / 100,
    label: `${MUSCLE_LABELS[a]} / ${MUSCLE_LABELS[b]}`,
  };
}

function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

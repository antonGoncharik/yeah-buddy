import type {
  MuscleBalancePair,
  MuscleCell,
  MuscleId,
  MuscleMissedEvent,
  MuscleSnapshot,
} from "@/lib/types";
import { setsPerWeek } from "@/lib/workout/muscle-volume";
import { volumeLandmarksForMuscle } from "@/lib/workout/muscle-volume-landmarks";

const STALE_DAYS = 10;

export function buildMuscleInsights(input: {
  muscles: MuscleCell[];
  missed: MuscleMissedEvent[];
  planned_template_name: string | null;
}): string[] {
  const lines: string[] = [];
  const catchUp = catchUpLine(input.muscles);
  if (catchUp) {
    lines.push(catchUp);
  }
  const weekly = (id: MuscleId) =>
    input.muscles.find((item) => item.id === id)?.sets_per_week ?? 0;

  for (const line of [
    imbalanceLine(
      { name: "Грудь", genitive: "груди", sets: weekly("chest") },
      {
        name: "Спина",
        genitive: "спины",
        sets: weekly("upper_back") + weekly("lats"),
      },
    ),
    imbalanceLine(
      {
        name: "Квадрицепс",
        genitive: "квадрицепса",
        sets: weekly("quads"),
      },
      {
        name: "Бицепс бедра",
        genitive: "бицепса бедра",
        sets: weekly("hamstrings"),
      },
    ),
    imbalanceLine(
      {
        name: "Передняя и средняя дельта",
        genitive: "передней и средней дельты",
        sets: weekly("front_delts") + weekly("side_delts"),
      },
      {
        name: "Задняя дельта",
        genitive: "задней дельты",
        sets: weekly("rear_delts"),
      },
    ),
  ]) {
    if (line) {
      lines.push(line);
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

export function buildMuscleBalance(
  muscles: MuscleCell[],
  horizonDays: number,
  effectiveDays?: number,
): MuscleBalancePair[] {
  const pickWeighted = (id: MuscleId) => {
    const cell = muscles.find((item) => item.id === id);
    if (!cell) {
      return 0;
    }
    return setsPerWeek(cell.sets, horizonDays, effectiveDays);
  };

  return [
    balancePair(
      "chest",
      "upper_back",
      pickWeighted("chest"),
      pickWeighted("upper_back") + pickWeighted("lats"),
      "Грудь",
      "Спина",
    ),
    balancePair(
      "quads",
      "hamstrings",
      pickWeighted("quads"),
      pickWeighted("hamstrings"),
      "Квадрицепс",
      "Бицепс бедра",
    ),
    balancePair(
      "front_delts",
      "rear_delts",
      pickWeighted("front_delts") + pickWeighted("side_delts"),
      pickWeighted("rear_delts"),
      "Передняя и средняя дельта",
      "Задняя дельта",
    ),
  ].filter((item): item is MuscleBalancePair => item != null);
}

function balancePair(
  a: MuscleId,
  b: MuscleId,
  aSets: number,
  bSets: number,
  labelA: string,
  labelB: string,
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
    sets_a: Math.round(aSets * 10) / 10,
    sets_b: Math.round(bSets * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    label: `${labelA} / ${labelB}`,
    label_a: labelA,
    label_b: labelB,
  };
}

/** How many weighted sets a muscle still needs to reach its growth zone. */
export function setsShortOfGrowthZone(cell: MuscleCell): number | null {
  if (cell.sets <= 0) {
    return null;
  }
  const mav = volumeLandmarksForMuscle(cell.id).mav;
  if (cell.sets_per_week >= mav) {
    return null;
  }
  return Math.round((mav - cell.sets_per_week) * 10) / 10;
}

export function catchUpLine(muscles: MuscleCell[]): string | null {
  const short = muscles
    .filter((item) => setsShortOfGrowthZone(item) != null)
    .sort(
      (left, right) =>
        (setsShortOfGrowthZone(right) ?? 0) -
        (setsShortOfGrowthZone(left) ?? 0),
    )[0];
  if (!short) {
    return null;
  }
  const gap = setsShortOfGrowthZone(short);
  if (gap == null) {
    return null;
  }
  return `${short.label}: до зоны роста ещё ~${gap} прямых подх./нед.`;
}

/** Lowest recovery among muscles in the next template — for the gym hub. */
export function muscleHubRecoveryHint(muscles: MuscleCell[]): string | null {
  const planned = muscles.filter(
    (item) =>
      item.in_next_session &&
      item.recovery_percent != null &&
      item.recovery_percent < 70,
  );
  if (planned.length === 0) {
    return null;
  }
  const weakest = planned.reduce((left, right) =>
    (left.recovery_percent ?? 100) <= (right.recovery_percent ?? 100)
      ? left
      : right,
  );
  const pct = weakest.recovery_percent;
  if (pct == null) {
    return null;
  }
  return `${weakest.label} ещё восстанавливается (~${pct}%) — можно сместить акцент на другие зоны.`;
}

export function todayMuscleProteinHint(
  snapshot: MuscleSnapshot,
  remainingProtein: number,
): string | null {
  if (remainingProtein <= 30) {
    return null;
  }
  const target = snapshot.muscles
    .filter((item) => item.in_next_session)
    .map((item) => ({ item, gap: setsShortOfGrowthZone(item) }))
    .filter((row) => row.gap != null && row.gap > 0)
    .sort((left, right) => (right.gap ?? 0) - (left.gap ?? 0))[0];
  if (!target?.gap) {
    return null;
  }
  return `На ${target.item.label.toLowerCase()} не хватает ~${target.gap} прямых подх./нед — белка ещё ${Math.round(remainingProtein)} г, можно добрать после зала.`;
}

function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function imbalanceLine(
  left: { name: string; genitive: string; sets: number },
  right: { name: string; genitive: string; sets: number },
): string | null {
  const sum = left.sets + right.sets;
  if (sum < 2) {
    return null;
  }
  const hi = Math.max(left.sets, right.sets, 0.5);
  const lo = Math.min(left.sets, right.sets);
  const ratio = lo / hi;
  if (ratio >= 0.45) {
    return null;
  }
  const weaker = left.sets <= right.sets ? left : right;
  const stronger = left.sets <= right.sets ? right : left;
  return `${weaker.name} слабее ${stronger.genitive} за период (${formatRatio(ratio)}).`;
}

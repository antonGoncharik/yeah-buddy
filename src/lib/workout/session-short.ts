export const SHORT_WORK_SETS = 2;

/** True while some exercise still has more than two work sets left to log. */
export function canShortenSession(
  exercises: readonly {
    sets: readonly { set_type: string; is_completed: boolean }[];
  }[],
): boolean {
  return exercises.some((exercise) => {
    const work = exercise.sets.filter((set) => set.set_type === "work");
    const open = work.filter((set) => !set.is_completed).length;
    return open > 0 && work.length > SHORT_WORK_SETS;
  });
}

export interface ShortExercise {
  id: string;
  muscle: string | null;
  sets: readonly {
    id: string;
    set_type: string;
    set_number: number;
    is_completed: boolean;
  }[];
}

export interface ShortSessionPlan {
  dropSetIds: string[];
  pairs: Array<[string, string]>;
}

/** Keep two work sets and pair neighbours that train different muscles. */
export function shortSessionPlan(
  exercises: readonly ShortExercise[],
): ShortSessionPlan {
  const dropSetIds: string[] = [];
  for (const exercise of exercises) {
    const work = exercise.sets
      .filter((set) => set.set_type === "work")
      .slice()
      .sort((left, right) => left.set_number - right.set_number);
    const done = work.filter((set) => set.is_completed).length;
    const room = Math.max(0, SHORT_WORK_SETS - done);
    const extra = work.filter((set) => !set.is_completed).slice(room);
    for (const set of extra) {
      dropSetIds.push(set.id);
    }
  }

  const pairs: Array<[string, string]> = [];
  const used = new Set<string>();
  for (let index = 0; index < exercises.length - 1; index += 1) {
    const left = exercises[index];
    const right = exercises[index + 1];
    if (!left || !right || used.has(left.id) || used.has(right.id)) {
      continue;
    }
    if (!left.muscle || !right.muscle || left.muscle === right.muscle) {
      continue;
    }
    pairs.push([left.id, right.id]);
    used.add(left.id);
    used.add(right.id);
  }

  return { dropSetIds, pairs };
}

export function readShortResult(data: unknown): {
  pairs: Array<[string, string]>;
  dropped: number;
} {
  if (typeof data !== "object" || data == null) {
    return { pairs: [], dropped: 0 };
  }
  const dropped =
    "droppedSets" in data && typeof data.droppedSets === "number"
      ? data.droppedSets
      : 0;
  const raw =
    "shortPairs" in data && Array.isArray(data.shortPairs)
      ? data.shortPairs
      : [];
  const pairs = raw.flatMap((item) => {
    if (!Array.isArray(item) || item.length !== 2) {
      return [];
    }
    const [left, right] = item;
    if (typeof left !== "string" || typeof right !== "string") {
      return [];
    }
    return [[left, right] as [string, string]];
  });
  return { pairs, dropped };
}

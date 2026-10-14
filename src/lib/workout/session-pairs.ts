const PAIR_KEY = "yeah-buddy-pairs:";

export function readSessionPairs(sessionId: string): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = sessionStorage.getItem(`${PAIR_KEY}${sessionId}`);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
      return {};
    }
    const pairs: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") {
        pairs[key] = value;
      }
    }
    return pairs;
  } catch {
    return {};
  }
}

export function writeSessionPairs(
  sessionId: string,
  pairs: Record<string, string>,
) {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(`${PAIR_KEY}${sessionId}`, JSON.stringify(pairs));
}

export function pairWith(
  pairs: Readonly<Record<string, string>>,
  leftId: string,
  rightId: string,
): Record<string, string> {
  const next = forgetPair(pairs, leftId);
  const cleared = forgetPair(next, rightId);
  return { ...cleared, [leftId]: rightId, [rightId]: leftId };
}

export function forgetPair(
  pairs: Readonly<Record<string, string>>,
  id: string,
): Record<string, string> {
  const partner = pairs[id];
  const next = { ...pairs };
  delete next[id];
  if (partner) {
    delete next[partner];
  }
  return next;
}

export function nextFocusSetId(
  exercises: readonly {
    id: string;
    sets: readonly { id: string; set_type: string; is_completed: boolean }[];
  }[],
  exerciseId: string,
  loggedSetId: string,
  partnerId: string | null,
): string | null {
  const own = exercises.find((item) => item.id === exerciseId) ?? null;
  const partner = partnerId
    ? (exercises.find((item) => item.id === partnerId) ?? null)
    : null;
  if (partner) {
    const across = firstOpen(partner, loggedSetId);
    if (across) {
      return across;
    }
  }
  return own ? firstOpen(own, loggedSetId) : null;
}

function firstOpen(
  exercise: {
    sets: readonly { id: string; set_type: string; is_completed: boolean }[];
  },
  skipId: string,
): string | null {
  const open = exercise.sets.find(
    (set) => set.set_type === "work" && !set.is_completed && set.id !== skipId,
  );
  return open?.id ?? null;
}

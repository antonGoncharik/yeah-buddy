import { shiftIsoDate } from "@/lib/day/dates";

const STORAGE_KEY = "yb.barbell-daily";

export interface BarbellDailyProgress {
  dayKey: string;
  bestMoves: number | null;
  completed: boolean;
  streak: number;
}

interface StoredBarbellDaily {
  dayKey: string;
  bestMoves: number | null;
  completed: boolean;
  lastCompletedDay: string | null;
  streak: number;
}

export function readBarbellDailyProgress(dayKey: string): BarbellDailyProgress {
  const stored = readStored();
  if (!stored) {
    return {
      dayKey,
      bestMoves: null,
      completed: false,
      streak: 0,
    };
  }

  if (stored.dayKey !== dayKey) {
    const streak =
      stored.lastCompletedDay === shiftIsoDate(dayKey, -1) ? stored.streak : 0;
    return {
      dayKey,
      bestMoves: null,
      completed: false,
      streak,
    };
  }

  return {
    dayKey: stored.dayKey,
    bestMoves: stored.bestMoves,
    completed: stored.completed,
    streak: stored.streak,
  };
}

export function recordBarbellDailyWin(
  dayKey: string,
  moves: number,
): BarbellDailyProgress {
  const previous = readStored();
  const sameDay = previous?.dayKey === dayKey;
  const bestMoves =
    sameDay && previous?.bestMoves != null
      ? Math.min(previous.bestMoves, moves)
      : moves;

  let streak = 1;
  if (sameDay && previous?.completed) {
    streak = previous.streak;
  } else if (previous?.lastCompletedDay === shiftIsoDate(dayKey, -1)) {
    streak = previous.streak + 1;
  }

  const next: StoredBarbellDaily = {
    dayKey,
    bestMoves,
    completed: true,
    lastCompletedDay: dayKey,
    streak,
  };
  writeStored(next);
  return {
    dayKey: next.dayKey,
    bestMoves: next.bestMoves,
    completed: next.completed,
    streak: next.streak,
  };
}

function readStored(): StoredBarbellDaily | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredBarbellDaily;
    if (
      typeof parsed.dayKey !== "string" ||
      typeof parsed.completed !== "boolean" ||
      typeof parsed.streak !== "number" ||
      (parsed.bestMoves != null && typeof parsed.bestMoves !== "number") ||
      (parsed.lastCompletedDay != null &&
        typeof parsed.lastCompletedDay !== "string")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: StoredBarbellDaily): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // quota or private mode
  }
}

const STORAGE_KEY = "yb.barbell-pendulum";

export function readPendulumBest(): number {
  return readStored();
}

export function recordPendulumHeight(height: number): number {
  const next = Math.max(readStored(), Math.max(0, Math.floor(height)));
  writeStored(next);
  return next;
}

function readStored(): number {
  if (typeof localStorage === "undefined") {
    return 0;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return 0;
    }
    const parsed = JSON.parse(raw) as { best?: unknown };
    if (typeof parsed.best !== "number" || !Number.isFinite(parsed.best)) {
      return 0;
    }
    return Math.max(0, Math.floor(parsed.best));
  } catch {
    return 0;
  }
}

function writeStored(best: number): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ best }));
  } catch {
    // quota or private mode
  }
}

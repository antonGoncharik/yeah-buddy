export const TAB_ROOT_PATHS = ["/today", "/workouts", "/settings"] as const;

export type TabRootPath = (typeof TAB_ROOT_PATHS)[number];

export function isExactTabRoot(pathname: string): pathname is TabRootPath {
  return (TAB_ROOT_PATHS as readonly string[]).includes(pathname);
}

export type BackSwipeGuardState = {
  exitArmed: boolean;
};

export type BackPopDecision = "pass" | "arm" | "reset";

export function decideBackPop(
  state: BackSwipeGuardState,
  fromPath: string,
  toPath: string,
): { decision: BackPopDecision; next: BackSwipeGuardState } {
  if (!isExactTabRoot(toPath) || !isExactTabRoot(fromPath)) {
    return { decision: "reset", next: { exitArmed: false } };
  }
  if (state.exitArmed) {
    return { decision: "pass", next: { exitArmed: false } };
  }
  return { decision: "arm", next: { exitArmed: true } };
}

export const EXIT_ARM_MS = 3_000;

export function bindTelegramBackSwipeGuard(
  onArm: () => void,
  getPath: () => string,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let state: BackSwipeGuardState = { exitArmed: false };
  let armTimer = 0;
  let pathRef = getPath();

  const disarm = () => {
    state = { exitArmed: false };
    window.clearTimeout(armTimer);
    armTimer = 0;
  };

  const ensureAnchor = () => {
    const path = getPath();
    if (!isExactTabRoot(path)) {
      return;
    }
    const current = window.history.state as Record<string, unknown> | null;
    if (current?.ybExitAnchor) {
      return;
    }
    try {
      window.history.pushState({ ...current, ybExitAnchor: true }, "");
    } catch {
      // ignore
    }
  };

  const onPop = () => {
    const fromPath = pathRef;
    const toPath = getPath();
    pathRef = toPath;

    const { decision, next } = decideBackPop(state, fromPath, toPath);
    state = next;

    if (decision === "reset") {
      disarm();
      return;
    }
    if (decision === "pass") {
      window.clearTimeout(armTimer);
      armTimer = 0;
      return;
    }

    try {
      window.history.pushState({ ybExitAnchor: true }, "");
    } catch {
      disarm();
      return;
    }
    onArm();
    window.clearTimeout(armTimer);
    armTimer = window.setTimeout(disarm, EXIT_ARM_MS);
  };

  ensureAnchor();
  window.addEventListener("popstate", onPop);

  return () => {
    window.removeEventListener("popstate", onPop);
    disarm();
  };
}

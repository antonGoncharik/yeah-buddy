export const WIZARD_SCREEN_KEY = "ybWizardScreen";

export type WizardScreenEntry = {
  flow: string;
  step: string;
  sub: string | null;
};

export function readWizardScreenEntry(state: unknown): WizardScreenEntry | null {
  if (state == null || typeof state !== "object") {
    return null;
  }
  const row = (state as Record<string, unknown>)[WIZARD_SCREEN_KEY];
  if (row == null || typeof row !== "object") {
    return null;
  }
  const value = row as Record<string, unknown>;
  if (typeof value.flow !== "string" || typeof value.step !== "string") {
    return null;
  }
  const sub =
    value.sub == null
      ? null
      : typeof value.sub === "string"
        ? value.sub
        : null;
  return { flow: value.flow, step: value.step, sub };
}

export function writeWizardScreenEntry(
  state: unknown,
  entry: WizardScreenEntry,
): Record<string, unknown> {
  const base =
    state != null && typeof state === "object"
      ? { ...(state as Record<string, unknown>) }
      : {};
  return { ...base, [WIZARD_SCREEN_KEY]: entry };
}

export function pushWizardScreenEntry(entry: WizardScreenEntry): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.history.pushState(writeWizardScreenEntry(window.history.state, entry), "");
    return true;
  } catch {
    return false;
  }
}

export function replaceWizardScreenEntry(entry: WizardScreenEntry): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.history.replaceState(
      writeWizardScreenEntry(window.history.state, entry),
      "",
    );
    return true;
  } catch {
    return false;
  }
}

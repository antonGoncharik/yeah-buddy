export const CIRCLE_OPENED_KEY = "yb.circle.opened";

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function isCircleOpenedSeen(phaseId: string): boolean {
  const store = storage();
  if (!store || phaseId === "") {
    return false;
  }
  try {
    return store.getItem(CIRCLE_OPENED_KEY) === phaseId;
  } catch {
    return false;
  }
}

export function markCircleOpenedSeen(phaseId: string): void {
  const store = storage();
  if (!store || phaseId === "") {
    return;
  }
  try {
    store.setItem(CIRCLE_OPENED_KEY, phaseId);
  } catch {
    // quota, private mode, or disabled storage
  }
}

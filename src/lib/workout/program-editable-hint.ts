export const PROGRAM_EDITABLE_HINT_KEY = "yb.program.editable-hint";
export const PROGRAM_EDITABLE_HINT_EVENT = "yb-program-editable-hint";

export const PROGRAM_EDITABLE_HINT_TITLE = "Твоя программа";
export const PROGRAM_EDITABLE_HINT_BODY =
  "Готовая — только старт. Меняй дни, упражнения и порядок в «Программе» — очередь пойдёт по твоей версии. Ту же готовую поставить снова — сбросит правки в этих днях.";

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function isProgramEditableHintPending(): boolean {
  const store = storage();
  if (!store) {
    return false;
  }
  try {
    return store.getItem(PROGRAM_EDITABLE_HINT_KEY) === "pending";
  } catch {
    return false;
  }
}

export function markProgramEditableHintPending(): void {
  const store = storage();
  if (!store) {
    return;
  }
  try {
    store.setItem(PROGRAM_EDITABLE_HINT_KEY, "pending");
  } catch {
    // quota, private mode
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRAM_EDITABLE_HINT_EVENT));
  }
}

export function dismissProgramEditableHint(): void {
  const store = storage();
  if (!store) {
    return;
  }
  try {
    store.removeItem(PROGRAM_EDITABLE_HINT_KEY);
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROGRAM_EDITABLE_HINT_EVENT));
  }
}

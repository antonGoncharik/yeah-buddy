const TRAINING_FLIP_KEY = "yb.day-became-training";

export function markTrainingFlip(date: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(TRAINING_FLIP_KEY, date);
}

export function readTrainingFlip(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  return sessionStorage.getItem(TRAINING_FLIP_KEY);
}

export function clearTrainingFlip(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(TRAINING_FLIP_KEY);
}

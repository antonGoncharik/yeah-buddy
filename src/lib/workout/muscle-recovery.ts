/** 0–100: higher = more recovered and ready for hard work. */
export function muscleRecoveryPercent(input: {
  days_since: number | null;
  sets_per_week: number;
  sets: number;
}): number | null {
  if (input.sets <= 0 || input.days_since == null) {
    return null;
  }

  let fromRecency = 1;
  if (input.days_since <= 1) {
    fromRecency = 0.5;
  } else if (input.days_since === 2) {
    fromRecency = 0.72;
  } else if (input.days_since === 3) {
    fromRecency = 0.85;
  } else if (input.days_since <= 5) {
    fromRecency = 0.94;
  }

  const landmarks = input.sets_per_week;
  const volumeDrag =
    landmarks > 22 ? 0.82 : landmarks > 18 ? 0.9 : landmarks > 14 ? 0.96 : 1;

  return Math.round(Math.min(100, fromRecency * volumeDrag * 100));
}

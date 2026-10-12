/** Shared rule: a day counts toward streaks, expenditure, and adaptive-goal coverage. */
export function dayCountsAsFoodLogged(day: {
  fact_kcal: number;
  target_kcal?: number;
}): boolean {
  if (day.fact_kcal <= 0) {
    return false;
  }
  const floor = Math.max(
    800,
    0.5 *
      (day.target_kcal != null && day.target_kcal > 0 ? day.target_kcal : 0),
  );
  return day.fact_kcal >= floor;
}

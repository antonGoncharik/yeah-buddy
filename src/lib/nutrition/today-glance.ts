import { formatGrams, formatKcal } from "@/lib/nutrition";

/** One sticky line for Today: what's left, while the meals scroll. */
export function todayGlanceLine(input: {
  protein: number;
  kcal: number;
  targetProtein: number;
  targetKcal: number;
}): string | null {
  if (input.protein <= 0 && input.kcal <= 0) {
    return null;
  }

  const kcalLeft = input.targetKcal - input.kcal;
  const proteinLeft = input.targetProtein - input.protein;
  const kcal =
    kcalLeft < 0
      ? `перебор ${formatKcal(Math.abs(kcalLeft))} ккал`
      : `ещё ${formatKcal(Math.max(0, kcalLeft))} ккал`;
  const protein =
    input.protein > 0 && proteinLeft <= 0.5
      ? "белок закрыт"
      : `ещё ${formatGrams(Math.max(0, proteinLeft))} г белка`;

  return `${kcal} · ${protein}`;
}

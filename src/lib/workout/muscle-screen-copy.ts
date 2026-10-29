import { pluralSets } from "@/lib/i18n/plural";

export function formatMuscleSetCount(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function unmappedExerciseLine(count: number): string {
  const n = Math.abs(Math.trunc(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  const verb =
    mod10 === 1 && mod100 !== 11
      ? "упражнение не попало"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "упражнения не попали"
        : "упражнений не попали";
  return `${n} ${verb} на схему`;
}

export function muscleShortfallLine(shortfall: number): string {
  return `Ещё ~${shortfall} ${pluralSets(shortfall)} в неделю, чтобы хватало.`;
}

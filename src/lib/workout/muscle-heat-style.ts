import type { MuscleCell, MuscleStatus } from "@/lib/types";

export function muscleHeatFill(cell: MuscleCell | undefined): string {
  if (!cell || cell.status === "idle") {
    return "color-mix(in oklch, var(--muted) 88%, transparent)";
  }
  const alpha = 0.28 + cell.load * 0.72;
  if (cell.status === "missed") {
    return `color-mix(in oklch, var(--destructive) ${Math.round(38 + cell.missed_sessions * 10)}%, var(--muted))`;
  }
  if (cell.status === "planned") {
    return "color-mix(in oklch, var(--primary) 32%, var(--muted))";
  }
  if (cell.status === "stale") {
    return `color-mix(in oklch, var(--primary) ${Math.round(alpha * 42)}%, var(--muted))`;
  }
  return `color-mix(in oklch, var(--primary) ${Math.round(alpha * 100)}%, var(--muted))`;
}

export function muscleHeatRing(
  cell: MuscleCell | undefined,
  selected: boolean,
): string {
  if (selected) {
    return "var(--primary)";
  }
  if (cell?.status === "missed") {
    return "color-mix(in oklch, var(--destructive) 75%, transparent)";
  }
  if (cell?.status === "planned") {
    return "var(--primary)";
  }
  return "color-mix(in oklch, var(--foreground) 14%, transparent)";
}

export function muscleStatusLabel(status: MuscleStatus): string {
  switch (status) {
    case "trained":
      return "Был объём";
    case "stale":
      return "Давно";
    case "missed":
      return "Пропуск";
    case "planned":
      return "В очереди";
    default:
      return "Тихо";
  }
}

import type { MuscleSnapshot } from "@/lib/types";

export function compactMuscleSignals(
  snapshot: MuscleSnapshot | null | undefined,
): string[] {
  if (!snapshot || snapshot.completed_sessions === 0) {
    return [];
  }
  const lines: string[] = [];
  const low = snapshot.muscles
    .filter((item) => item.volume_band <= 1 && item.sets > 0)
    .sort((left, right) => left.sets_per_week - right.sets_per_week)
    .slice(0, 2);
  for (const item of low) {
    lines.push(
      `Мышцы: ${item.label} мало объёма (~${item.sets_per_week} подх./нед).`,
    );
  }
  for (const line of snapshot.insights.slice(0, 2)) {
    if (!lines.some((row) => row.includes(line.slice(0, 12)))) {
      lines.push(`Мышцы: ${line}`);
    }
  }
  return lines.slice(0, 3);
}

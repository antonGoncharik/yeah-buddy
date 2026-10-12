import type { ReviewBrief } from "@/lib/ai/types";

/** Short non-LLM lines for Telegram and Today (from review brief). */
export function templateInsightsFromBrief(brief: ReviewBrief): string[] {
  if (brief.coverage === "empty") {
    return [];
  }

  const lines: string[] = [];

  if (brief.nutrition.protein_total > 0) {
    const { protein_hit, protein_total } = brief.nutrition;
    if (protein_hit < protein_total) {
      lines.push(`Белок по плану ${protein_hit} из ${protein_total} дней.`);
    }
  }

  if (brief.gym.completed > 0) {
    lines.push(`Зал: ${brief.gym.completed} тренировок за ${brief.range} дн.`);
  }

  const delta = brief.nutrition.weight?.delta;
  if (delta != null && Math.abs(delta) >= 0.2) {
    const dir = delta < 0 ? "минус" : "плюс";
    lines.push(`Вес: ${dir} ${Math.abs(delta).toFixed(1)} кг за период.`);
  }

  for (const signal of brief.signals.slice(0, 2)) {
    if (signal.trim()) {
      lines.push(signal);
    }
  }

  return lines.slice(0, 4);
}

export function dayInsightFromBrief(brief: ReviewBrief): string | null {
  const lines = templateInsightsFromBrief(brief);
  return lines[0] ?? null;
}

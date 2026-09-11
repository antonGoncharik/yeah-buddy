import { formatPct } from "@/lib/ai/format";
import type { CurrentMacroState } from "@/lib/types";
import { pluralWorkouts } from "@/lib/workout/history-stats";
import { phaseLabel } from "@/lib/workout/labels";

export function gymSignalLines(input: {
  gym: {
    completed: number;
    skipped: number;
    planHit: number;
    planTotal: number;
    templates: Array<{ name: string; count: number }>;
    weak: string[];
  };
  phase: CurrentMacroState;
}): string[] {
  const lines: string[] = [];

  if (input.gym.completed > 0) {
    const plan =
      input.gym.planTotal > 0
        ? `, не слабее плана ${input.gym.planHit} из ${input.gym.planTotal}`
        : "";
    lines.push(
      `Зал: ${input.gym.completed} ${pluralWorkouts(input.gym.completed)}${plan}.`,
    );
  }
  if (input.gym.skipped > 0) {
    lines.push(`Пропусков: ${input.gym.skipped}.`);
  }
  if (input.gym.templates.length > 0) {
    lines.push(
      `Тренировки: ${input.gym.templates
        .map((item) => `${item.name} · ${item.count}`)
        .join(", ")}.`,
    );
  }
  if (input.gym.weak.length > 0) {
    lines.push(`Слабее плана: ${input.gym.weak.join(", ")}.`);
  }

  const circle = input.phase.phase_circle;
  if (input.phase.phase && circle) {
    const extra = circle.suggest_end ? ", круг можно закрыть" : "";
    lines.push(
      `Этап «${phaseLabel(input.phase.phase.phase_type, input.phase.phase.name)}» · ${circle.completed_count} из ${circle.circle_size}${extra}.`,
    );
  }

  const recap = input.phase.last_recap;
  if (recap) {
    const from = recap.from_name || phaseLabel(recap.from_phase);
    const to = recap.to_name || phaseLabel(recap.to_phase);
    const pct = recap.avg_percent == null ? null : formatPct(recap.avg_percent);
    lines.push(
      pct == null
        ? `Прошлый цикл «${from}» → «${to}», выросли ${recap.grown_count}.`
        : `Прошлый цикл «${from}» → «${to}»: рабочие ${pct}, выросли ${recap.grown_count}.`,
    );
  }

  return lines;
}

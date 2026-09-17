import { formatPct } from "@/lib/ai/format";
import type { CurrentMacroState } from "@/lib/types";
import {
  formatFrequencyVsProgram,
  formatSessionRateHalves,
  formatWeekRate,
  pluralWorkouts,
} from "@/lib/workout/history-stats";
import { phaseLabel, SESSION_FEEL_LABELS } from "@/lib/workout/labels";
import { formatTonnage } from "@/lib/workout/numbers";
import {
  formatPeakRecord,
  formatWeeklyTonnageLine,
  type PeakRecord,
  type WeekTonnage,
} from "@/lib/workout/progress-control";

export function gymSignalLines(input: {
  gym: {
    completed: number;
    skipped: number;
    planHit: number;
    planTotal: number;
    templates: Array<{ name: string; count: number }>;
    weak: string[];
    feels?: { easy: number; close: number; miss: number };
    perWeek?: number | null;
    circleSize?: number;
    records?: PeakRecord[];
    tonnageWeeks?: WeekTonnage[];
    rateHalves?: { first: number; second: number } | null;
    gapDays?: number | null;
  };
  phase: CurrentMacroState;
  windowDays?: number;
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

  const frequency = formatFrequencyVsProgram(
    input.gym.completed,
    input.windowDays ?? 0,
    input.gym.circleSize ?? 0,
  );
  if (frequency) {
    lines.push(`Частота: ${frequency}.`);
  } else if (input.gym.perWeek != null && input.gym.perWeek > 0) {
    lines.push(`Частота: ${formatWeekRate(input.gym.perWeek)} в неделю.`);
  }
  if (input.gym.rateHalves) {
    lines.push(`Темп зала: ${formatSessionRateHalves(input.gym.rateHalves)}.`);
  }
  if (input.gym.gapDays != null && input.gym.gapDays > 0) {
    lines.push(`Дыра в зале: ${input.gym.gapDays} дн.`);
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

  const feelLine = gymFeelLine(input.gym.feels, input.phase.phase == null);
  if (feelLine) {
    lines.push(feelLine);
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

  const records = input.gym.records ?? [];
  if (records.length > 0) {
    lines.push(
      `Рекорды: ${records.slice(0, 6).map(formatPeakRecord).join("; ")}.`,
    );
  }

  const weeks = input.gym.tonnageWeeks ?? [];
  const tonnageLine = formatWeeklyTonnageLine(weeks);
  if (tonnageLine) {
    lines.push(`Тоннаж по неделям: ${tonnageLine}.`);
  } else if (weeks.length === 1 && weeks[0]) {
    lines.push(`Тоннаж за неделю: ${formatTonnage(weeks[0].tonnage)}.`);
  }

  return lines;
}

function gymFeelLine(
  feels: { easy: number; close: number; miss: number } | undefined,
  withoutCycle: boolean,
): string | null {
  if (!feels) {
    return null;
  }

  const parts = (["easy", "close", "miss"] as const).flatMap((key) => {
    const count = feels[key];
    if (count <= 0) {
      return [];
    }
    return [`${SESSION_FEEL_LABELS[key].toLowerCase()} ${count}`];
  });
  if (parts.length === 0) {
    return null;
  }

  const raise =
    withoutCycle && feels.easy > 0 ? " Без цикла можно поднять 1ПМ." : "";
  return `Как прошло: ${parts.join(", ")}.${raise}`;
}

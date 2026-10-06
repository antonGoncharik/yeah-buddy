import type { GymLoop } from "@/lib/day/loop";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import {
  macroGoalToleranceGrams,
  macroInGoal,
} from "@/lib/nutrition/macro-hit";

const KCAL_GAP = 50;

export type TodayGlancePhase = "morning" | "day" | "evening";

export type TodayGlancePillarState = "ok" | "warn" | "muted";

export interface TodayGlancePillar {
  label: string;
  state: TodayGlancePillarState;
  short: string;
}

export interface TodayDayGlance {
  title: string;
  lead: string | null;
  pillars: [TodayGlancePillar, TodayGlancePillar, TodayGlancePillar];
}

export function todayGlancePhase(hour: number): TodayGlancePhase {
  if (hour < 12) {
    return "morning";
  }
  if (hour >= 17) {
    return "evening";
  }
  return "day";
}

export function buildTodayDayGlance(input: {
  protein: number;
  targetProtein: number;
  kcal: number;
  targetKcal: number;
  gym: Pick<GymLoop, "kind" | "label">;
  isTrainingDay: boolean;
  nowMs?: number;
}): TodayDayGlance {
  const hour = new Date(input.nowMs ?? Date.now()).getHours();
  const phase = todayGlancePhase(hour);
  const proteinPillar = macroPillar(
    "Белок",
    input.protein,
    input.targetProtein,
    true,
  );
  const kcalPillar = kcalPillarRow(input.kcal, input.targetKcal);
  const gymRow = buildGymPillar(input.gym, input.isTrainingDay);
  const pillars: [TodayGlancePillar, TodayGlancePillar, TodayGlancePillar] = [
    proteinPillar,
    kcalPillar,
    gymRow,
  ];
  const done =
    proteinPillar.state === "ok" &&
    kcalPillar.state === "ok" &&
    gymRow.state !== "warn";
  const title = glanceTitle(phase, done);
  const lead = done
    ? null
    : glanceLead({
        phase,
        protein: input.protein,
        targetProtein: input.targetProtein,
        kcal: input.kcal,
        targetKcal: input.targetKcal,
        gym: input.gym,
        isTrainingDay: input.isTrainingDay,
        proteinOk: proteinPillar.state === "ok",
        kcalOk: kcalPillar.state === "ok",
      });

  return { title, lead, pillars };
}

function glanceTitle(phase: TodayGlancePhase, done: boolean): string {
  if (done) {
    return "День в порядке";
  }
  if (phase === "morning") {
    return "План на сегодня";
  }
  if (phase === "evening") {
    return "Итог дня";
  }
  return "Сейчас";
}

function glanceLead(input: {
  phase: TodayGlancePhase;
  protein: number;
  targetProtein: number;
  kcal: number;
  targetKcal: number;
  gym: Pick<GymLoop, "kind" | "label">;
  isTrainingDay: boolean;
  proteinOk: boolean;
  kcalOk: boolean;
}): string | null {
  if (input.gym.kind === "open") {
    return `«${input.gym.label}» не закрыта — допиши подходы или оставь на завтра.`;
  }
  if (input.gym.kind === "queue" && input.isTrainingDay) {
    return `В очереди «${input.gym.label}» — зайди в Тренировки, когда будешь готов.`;
  }
  if (
    input.gym.kind === "rest" &&
    input.isTrainingDay &&
    input.gym.label === "нет программы"
  ) {
    return "Тренировочный день, а программы нет — выбери шаблон в Тренировках.";
  }

  if (!input.proteinOk && input.targetProtein > 0) {
    const delta = input.targetProtein - input.protein;
    const tol = Math.max(0.5, macroGoalToleranceGrams(input.targetProtein));
    if (delta > tol) {
      const grams = formatMacro(delta);
      if (input.phase === "morning") {
        return `До цели ещё ${grams} г белка — распредели по приёмам.`;
      }
      if (input.phase === "evening") {
        return `Закрой белок: ещё ${grams} г.`;
      }
      return `Белка не хватает: ещё ${grams} г.`;
    }
    if (input.protein > input.targetProtein + tol) {
      return `Белок выше цели на ${formatMacro(input.protein - input.targetProtein)} г — ок, если так задумано.`;
    }
  }

  if (!input.kcalOk && input.targetKcal > 0) {
    const delta = Math.round(input.targetKcal) - Math.round(input.kcal);
    if (delta > KCAL_GAP && input.phase !== "morning") {
      return `Калорий маловато — ещё около ${formatKcal(delta)}.`;
    }
    if (delta < -KCAL_GAP && input.phase === "evening") {
      return `Калорий выше цели на ${formatKcal(-delta)} — смотри по самочувствию.`;
    }
  }

  return null;
}

function macroPillar(
  label: string,
  fact: number,
  target: number,
  protein: boolean,
): TodayGlancePillar {
  if (target <= 0) {
    return {
      label,
      state: fact > 0.5 ? "ok" : "muted",
      short: fact > 0.5 ? formatMacro(fact) : "—",
    };
  }
  if (macroInGoal(fact, target)) {
    return { label, state: "ok", short: "в цели" };
  }
  const delta = fact - target;
  const tol = Math.max(0.5, macroGoalToleranceGrams(target));
  if (Math.abs(delta) <= tol) {
    return { label, state: "ok", short: "в цели" };
  }
  if (delta < 0) {
    const short = protein
      ? `ещё ${formatMacro(-delta)}`
      : `−${formatMacro(-delta)}`;
    return { label, state: "warn", short };
  }
  return {
    label,
    state: "warn",
    short: `+${formatMacro(delta)}`,
  };
}

function kcalPillarRow(fact: number, target: number): TodayGlancePillar {
  const label = "Ккал";
  if (target <= 0) {
    return {
      label,
      state: fact >= 1 ? "ok" : "muted",
      short: fact >= 1 ? formatKcal(fact) : "—",
    };
  }
  const delta = Math.round(fact) - Math.round(target);
  if (Math.abs(delta) < KCAL_GAP) {
    return { label, state: "ok", short: "в цели" };
  }
  if (delta < 0) {
    return {
      label,
      state: "warn",
      short: `ещё ${formatKcal(-delta)}`,
    };
  }
  return {
    label,
    state: "warn",
    short: `+${formatKcal(delta)}`,
  };
}

function buildGymPillar(
  gym: Pick<GymLoop, "kind" | "label">,
  isTrainingDay: boolean,
): TodayGlancePillar {
  const label = "Зал";
  if (gym.kind === "done") {
    return { label, state: "ok", short: "готово" };
  }
  if (gym.kind === "open") {
    return { label, state: "warn", short: truncateGymLabel(gym.label) };
  }
  if (gym.kind === "queue") {
    return { label, state: "warn", short: truncateGymLabel(gym.label) };
  }
  if (isTrainingDay && gym.label === "нет программы") {
    return { label, state: "warn", short: "нет плана" };
  }
  if (!isTrainingDay) {
    return { label, state: "muted", short: "отдых" };
  }
  return { label, state: "muted", short: truncateGymLabel(gym.label) };
}

function truncateGymLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= 14) {
    return trimmed;
  }
  return `${trimmed.slice(0, 13)}…`;
}

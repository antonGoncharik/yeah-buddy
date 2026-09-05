import type {
  PhaseCircleProgress,
  PhaseType,
  TransitionPreview,
} from "@/lib/types";
import { nextPhaseType } from "@/lib/workout/formulas";
import { PHASE_TYPE_LABELS } from "@/lib/workout/labels";

export function phaseLinkLabel(
  macroNumber: number,
  progress: PhaseCircleProgress | null,
  phaseType: PhaseType,
): string {
  const head = `№${macroNumber} · ${PHASE_TYPE_LABELS[phaseType]}`;
  if (!progress || progress.completed_count === 0) {
    return head;
  }

  return `${head} · ${progress.completed_count} из ${progress.circle_size}`;
}

export function phaseEndHint(progress: PhaseCircleProgress): string | null {
  if (!progress.suggest_end) {
    return null;
  }

  const rounds = Math.max(
    1,
    Math.floor(progress.completed_count / progress.circle_size),
  );
  const phase = PHASE_TYPE_LABELS[progress.phase_type];
  const next = nextPhaseType(progress.phase_type);
  const nextLabel = next ? PHASE_TYPE_LABELS[next] : null;

  if (progress.phase_type === "deload") {
    if (rounds >= 2) {
      return `Сброс: ${rounds} ${circleWord(rounds)}. Можно закрыть макроцикл.`;
    }
    return "Сброс пройден. Можно закрыть макроцикл.";
  }

  if (rounds >= 2) {
    return `«${phase}»: ${rounds} ${circleWord(rounds)}. Можно завершить${nextLabel ? ` — дальше «${nextLabel}»` : ""}.`;
  }

  return `«${phase}» пройдена. Можно завершить${nextLabel ? ` — дальше «${nextLabel}»` : ""}.`;
}

export function completePhaseHint(phaseType: PhaseType): string {
  if (phaseType === "ramp") {
    return "Дальше набор: те же максимумы, другие проценты и повторы.";
  }
  if (phaseType === "volume") {
    return "Дальше рывок: максимумы +5%, меньше повторов. Можно поправить.";
  }
  if (phaseType === "peak") {
    return "Дальше сброс: легче. Максимумы как в рывке.";
  }
  return "Закроет этот макроцикл и начнёт следующий с разгона. Максимумы возьмутся с рывка.";
}

export function transitionExplain(preview: TransitionPreview): string {
  if (preview.new_macro) {
    return "Сброс закрывается, начинается следующий макроцикл с разгона. Максимумы — с рывка, можно поправить.";
  }
  if (preview.increased) {
    return "Рывок: меньше повторов, больше процент. Максимумы +5% — можно поправить.";
  }
  if (preview.to_phase === "volume") {
    return "Набор: те же максимумы, другие проценты и повторы. Можно поправить.";
  }
  if (preview.to_phase === "deload") {
    return "Сброс: легче, максимумы как в рывке. Можно поправить.";
  }
  return "Максимумы копируются. Можно поправить.";
}

export function readPhaseCircle(data: unknown): PhaseCircleProgress | null {
  if (!data || typeof data !== "object" || !("phase_circle" in data)) {
    return null;
  }

  const value = (data as { phase_circle: unknown }).phase_circle;
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Partial<PhaseCircleProgress>;
  if (
    row.phase_type !== "ramp" &&
    row.phase_type !== "volume" &&
    row.phase_type !== "peak" &&
    row.phase_type !== "deload"
  ) {
    return null;
  }

  if (
    typeof row.completed_count !== "number" ||
    typeof row.circle_size !== "number" ||
    typeof row.suggest_end !== "boolean"
  ) {
    return null;
  }

  return {
    phase_type: row.phase_type,
    completed_count: row.completed_count,
    circle_size: row.circle_size,
    suggest_end: row.suggest_end,
  };
}

function circleWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "круг";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "круга";
  }
  return "кругов";
}

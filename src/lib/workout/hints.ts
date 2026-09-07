import type {
  PhaseCircleProgress,
  PhaseType,
  TransitionPreview,
} from "@/lib/types";
import { nextPhaseType } from "@/lib/workout/formulas";
import { PHASE_TYPE_LABELS } from "@/lib/workout/labels";

export function todayWeightsHint(
  phaseType: PhaseType | null,
  macroNumber: number | null,
): string {
  if (phaseType == null || macroNumber == null) {
    return "Макроцикла нет — так тоже можно. Веса сегодня как в разгоне: от максимума упражнения. Макроцикл — четыре фазы подряд: разгон, набор, рывок, сброс. Он нужен, если хочешь менять нагрузку кусками, а не руками каждую тренировку.";
  }

  return `Веса сегодня от фазы «${PHASE_TYPE_LABELS[phaseType]}» макроцикла №${macroNumber}. Макроцикл — кусок подготовки: разгон → набор → рывок → сброс. От фазы зависят проценты и повторы. Фаза сама не закроется: когда круг очереди пройден, решишь сам.`;
}

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
      return `Сброс уже ${rounds} ${circleWord(rounds)}. Можно закрыть макроцикл — сам, когда восстановился.`;
    }
    return "Круг сброса пройден. Макроцикл можно закрыть, если тело уже отошло.";
  }

  if (rounds >= 2) {
    return `«${phase}» уже ${rounds} ${circleWord(rounds)}. Можно ещё покрутить или закрыть${nextLabel ? ` — дальше будет «${nextLabel}»` : ""}.`;
  }

  return `Круг «${phase}» пройден. Это не автопереход: фазу оставляешь или закрываешь сам${nextLabel ? `. Дальше — «${nextLabel}»` : ""}.`;
}

export function completePhaseHint(phaseType: PhaseType): string {
  if (phaseType === "ramp") {
    return "Дальше набор: максимумы те же, в рабочих больше повторов. Веса не прыгнут сами.";
  }
  if (phaseType === "volume") {
    return "Дальше рывок. Предложит поднять максимумы — не всем упражнениям нужно расти, цифры можно поправить до подтверждения.";
  }
  if (phaseType === "peak") {
    return "Дальше сброс: легче, чтобы восстановиться. Максимумы останутся как в рывке.";
  }
  return "Этот макроцикл закроется, следующий начнётся с разгона. Максимумы возьмутся с рывка.";
}

export function transitionExplain(preview: TransitionPreview): string {
  if (preview.new_macro) {
    return "Сброс закроется, начнётся следующий макроцикл с разгона. Максимумы — с рывка, их ещё можно поправить.";
  }
  if (preview.increased) {
    return "На рывке максимумы предложат поднять. Можно оставить как есть или поднять не все.";
  }
  if (preview.to_phase === "volume") {
    return "Набор: максимумы те же, другие проценты и повторы. Цифры ещё можно поправить.";
  }
  if (preview.to_phase === "deload") {
    return "Сброс: легче, максимумы как в рывке. Цифры ещё можно поправить.";
  }
  return "Максимумы скопируются в новую фазу. Цифры ещё можно поправить.";
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

import { isRecord } from "@/lib/read";
import type {
  Exercise,
  ExerciseWithMax,
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
    return "Веса от рабочего веса упражнения, как в разгоне.";
  }

  return `Веса сегодня от фазы «${PHASE_TYPE_LABELS[phaseType]}» макроцикла №${macroNumber}.`;
}

export function queueItemMark(options: {
  templateId: string;
  sessionTemplateId: string | null;
  nextTemplateId: string | null;
}): string {
  if (options.sessionTemplateId === options.templateId) {
    return " · сегодня";
  }
  if (options.nextTemplateId === options.templateId) {
    return " · дальше";
  }
  return "";
}

export function templateHasPlanMaxes(
  template: { exercises: Exercise[] },
  catalog: ExerciseWithMax[],
): boolean {
  const maxById = new Map(
    catalog.map((exercise) => [
      exercise.id,
      exercise.current_max?.max_weight ?? 0,
    ]),
  );

  return template.exercises.some((exercise) => {
    if (exercise.formula_preset === "none") {
      return false;
    }
    return (maxById.get(exercise.id) ?? 0) > 0;
  });
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
      return `Сброс уже ${rounds} ${circleWord(rounds)}. Можно закрыть макроцикл, когда восстановился.`;
    }
    return "Круг сброса пройден. Можно закрыть макроцикл, когда восстановился.";
  }

  if (rounds >= 2) {
    return `«${phase}» уже ${rounds} ${circleWord(rounds)}. Можно ещё покрутить или закрыть${nextLabel ? ` — дальше «${nextLabel}»` : ""}.`;
  }

  return `Круг «${phase}» пройден. Фазу оставляешь или закрываешь сам${nextLabel ? `. Дальше — «${nextLabel}»` : ""}.`;
}

export function completePhaseHint(phaseType: PhaseType): string {
  if (phaseType === "ramp") {
    return "Дальше набор: рабочие веса те же, в рабочих больше повторов. Килограммы сами не вырастут.";
  }
  if (phaseType === "volume") {
    return "Дальше рывок. Можно поднять рабочие веса — не всем упражнениям нужно, цифры поправишь до подтверждения.";
  }
  if (phaseType === "peak") {
    return "Дальше сброс: легче, чтобы восстановиться. Рабочие веса останутся как в рывке.";
  }
  return "Этот макроцикл закроется, следующий начнётся с разгона. Рабочие веса возьмутся с рывка.";
}

export function transitionExplain(preview: TransitionPreview): string {
  if (preview.new_macro) {
    return "Сброс закроется, начнётся следующий макроцикл с разгона. Рабочие веса — с рывка, их ещё можно поправить.";
  }
  if (preview.increased) {
    return "На рывке можно поднять рабочие веса. Можно оставить как есть или поднять не все.";
  }
  if (preview.to_phase === "volume") {
    return "Набор: рабочие веса те же, другие проценты и повторы. Цифры ещё можно поправить.";
  }
  if (preview.to_phase === "deload") {
    return "Сброс: легче, рабочие веса как в рывке. Цифры ещё можно поправить.";
  }
  return "Рабочие веса скопируются в новую фазу. Цифры ещё можно поправить.";
}

export function readPhaseCircle(data: unknown): PhaseCircleProgress | null {
  if (!isRecord(data)) {
    return null;
  }

  const row = isRecord(data.phase_circle) ? data.phase_circle : null;
  if (!row) {
    return null;
  }

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

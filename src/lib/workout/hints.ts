import { isRecord } from "@/lib/read";
import type {
  Exercise,
  ExerciseWithMax,
  PhaseCircleProgress,
  PhaseType,
  PlannedCyclePhase,
  TransitionPreview,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import { phaseLabel } from "@/lib/workout/labels";

export type CycleTimelineState = "completed" | "current" | "upcoming";

export interface CycleTimelineStep {
  key: string;
  name: string;
  state: CycleTimelineState;
}

export function cycleTimeline(
  planned: PlannedCyclePhase[],
  currentKey: string | null,
  currentName?: string | null,
): CycleTimelineStep[] {
  const currentIndex = currentKey
    ? planned.findIndex((phase) => phase.key === currentKey)
    : -1;

  const steps: CycleTimelineStep[] = planned.map((phase, index) => ({
    key: phase.key,
    name: phase.name,
    state:
      currentIndex < 0
        ? "upcoming"
        : index < currentIndex
          ? "completed"
          : index === currentIndex
            ? "current"
            : "upcoming",
  }));

  if (currentKey && currentIndex < 0) {
    return [
      {
        key: currentKey,
        name: currentName?.trim() || currentKey,
        state: "current",
      },
      ...steps,
    ];
  }

  return steps;
}

export function cycleSequenceLabel(planned: PlannedCyclePhase[]): string {
  return planned.map((phase) => phase.name).join(" → ");
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
  phaseName?: string | null,
): string {
  const name = progress?.phase_name ?? phaseLabel(phaseType, phaseName);
  const head = `№${macroNumber} · ${name}`;
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
  const phase = progress.phase_name;
  const nextLabel = progress.next_phase_name;

  if (progress.last_in_cycle) {
    if (rounds >= 2) {
      return `«${phase}» идёт уже ${rounds} ${circleWord(rounds)}. Когда восстановился — можно закрыть цикл.`;
    }
    return `Круг «${phase}» пройден. Когда восстановился — можно закрыть цикл.`;
  }

  if (rounds >= 2) {
    return `«${phase}» идёт уже ${rounds} ${circleWord(rounds)}. Можно продолжить или закрыть этап${nextLabel ? ` — дальше «${nextLabel}»` : ""}.`;
  }

  return `Круг «${phase}» пройден. Закрой этап, когда будешь готов${nextLabel ? ` — дальше «${nextLabel}»` : ""}.`;
}

export function completePhaseHint(
  progress: PhaseCircleProgress | null,
): string {
  if (!progress) {
    return "Рабочие веса перейдут как есть. Перед подтверждением можно поправить.";
  }
  if (progress.hold_weights) {
    return "Не пошло — рабочие веса не трогаем.";
  }
  if (progress.last_in_cycle) {
    if (progress.increases_on_end) {
      return "Цикл закроется и начнётся новый. Можно поднять рабочие веса — не всем сразу.";
    }
    return "Цикл закроется и начнётся новый. Веса возьмём с последней тяжёлой недели.";
  }
  if (progress.increases_on_end) {
    return `Дальше «${progress.next_phase_name}». Можно поднять рабочие веса — не всем сразу.`;
  }
  if (progress.next_phase_name) {
    return `Дальше «${progress.next_phase_name}». Веса те же, можно поправить.`;
  }
  return "Рабочие веса перейдут как есть. Перед подтверждением можно поправить.";
}

export function phaseHoldHint(progress: PhaseCircleProgress): string | null {
  if (!progress.hold_weights) {
    return null;
  }
  return "Не пошло — рабочие веса не трогаем.";
}

export function transitionExplain(preview: TransitionPreview): string {
  if (preview.hold_weights) {
    return "Не пошло — рабочие веса не трогаем, можно поправить.";
  }
  if (preview.new_macro && preview.increased) {
    return "Цикл закроется и начнётся новый. Можно поднять рабочие веса — не всем сразу.";
  }
  if (preview.new_macro) {
    return "Цикл закроется и начнётся новый. Веса возьмём с последней тяжёлой недели, можно поправить.";
  }
  if (preview.increased) {
    return `На «${preview.to_name}» можно поднять рабочие веса. Не всем сразу.`;
  }
  if (preview.to_name) {
    return `Дальше «${preview.to_name}». Веса те же, можно поправить.`;
  }
  return "Рабочие веса перейдут как есть. Перед подтверждением можно поправить.";
}

export function readPhaseCircle(data: unknown): PhaseCircleProgress | null {
  if (!isRecord(data)) {
    return null;
  }

  const row = isRecord(data.phase_circle) ? data.phase_circle : null;
  if (!row) {
    return null;
  }

  if (!isPhaseType(row.phase_type)) {
    return null;
  }

  if (
    typeof row.completed_count !== "number" ||
    typeof row.circle_size !== "number" ||
    typeof row.suggest_end !== "boolean"
  ) {
    return null;
  }

  const nextType =
    row.next_phase_type == null
      ? null
      : isPhaseType(row.next_phase_type)
        ? row.next_phase_type
        : null;
  const last =
    row.last_in_cycle === true ||
    (row.last_in_cycle !== false && row.phase_type === "deload");

  return {
    phase_type: row.phase_type,
    phase_name:
      typeof row.phase_name === "string"
        ? row.phase_name
        : phaseLabel(row.phase_type),
    next_phase_type: nextType,
    next_phase_name:
      typeof row.next_phase_name === "string"
        ? row.next_phase_name
        : nextType
          ? phaseLabel(nextType)
          : null,
    last_in_cycle: last,
    increases_on_end:
      row.increases_on_end === true ||
      (row.increases_on_end !== false && row.phase_type === "volume"),
    hold_weights: row.hold_weights === true,
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

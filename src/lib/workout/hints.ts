import { isRecord } from "@/lib/read";
import type {
  Exercise,
  ExerciseWithMax,
  PhaseCircleProgress,
  PhaseType,
  PlannedCyclePhase,
  TemplateSlot,
  TransitionPreview,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import { phaseLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";
import {
  slotCanPlan,
  slotFor,
  slotNeedsMax,
  slotNeedsTrack,
} from "@/lib/workout/slot-plan";
import { trackCurrentWeight } from "@/lib/workout/track-line";

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

interface TemplateLike {
  exercises: Exercise[];
  /** Absent for old payloads: every exercise goes by the shared scheme. */
  slots?: TemplateSlot[];
}

export function templateHasPlanMaxes(
  template: TemplateLike,
  catalog: ExerciseWithMax[],
): boolean {
  const maxById = new Map(
    catalog.map((exercise) => [
      exercise.id,
      exercise.current_max?.max_weight ?? 0,
    ]),
  );

  return template.exercises.some((exercise) => {
    const plan = slotFor(template.slots, exercise.id);
    if (!slotCanPlan(plan, exercise)) {
      return false;
    }
    if (!slotNeedsMax(plan, exercise)) {
      return true;
    }
    return (maxById.get(exercise.id) ?? 0) > 0;
  });
}

/** A workout can start when at least one exercise gets a plan of sets. */
export function templateCanPlan(template: TemplateLike): boolean {
  return template.exercises.some((exercise) =>
    slotCanPlan(slotFor(template.slots, exercise.id), exercise),
  );
}

/**
 * Number shown next to a lift on the hub: 1RM, or the next kilogram on a
 * track. Null means a dash — we'll ask in the session.
 */
export function templateExerciseLoadPreview(
  template: { slots: TemplateSlot[] },
  exercise: ExerciseWithMax,
): { value: number; kind: "max" | "track" } | null {
  const plan = slotFor(template.slots, exercise.id);
  if (slotNeedsTrack(plan)) {
    const weight = exercise.track ? trackCurrentWeight(exercise.track) : null;
    return weight != null && weight > 0
      ? { value: weight, kind: "track" }
      : null;
  }
  if (slotNeedsMax(plan, exercise)) {
    const max = exercise.current_max?.max_weight ?? 0;
    return max > 0 ? { value: max, kind: "max" } : null;
  }
  return null;
}

/**
 * Template exercises that need 1RM before they can get a plan.
 * `phaseKey` omitted — «где угодно в цикле»: спросим вес заранее.
 */
export function templateMissingMaxes(
  template: TemplateLike,
  catalog: ExerciseWithMax[],
  plannedExerciseIds: Iterable<string> = [],
  phaseKey?: string | null,
): Exercise[] {
  const planned = new Set(plannedExerciseIds);
  const maxById = new Map(
    catalog.map((exercise) => [
      exercise.id,
      exercise.current_max?.max_weight ?? 0,
    ]),
  );

  return template.exercises.filter((exercise) => {
    if (planned.has(exercise.id)) {
      return false;
    }
    const plan = slotFor(template.slots, exercise.id);
    if (
      !slotCanPlan(plan, exercise, phaseKey) ||
      !slotNeedsMax(plan, exercise, phaseKey)
    ) {
      return false;
    }
    return (maxById.get(exercise.id) ?? 0) <= 0;
  });
}

/** Template exercises whose slot uses working kg that is not set yet. */
export function templateMissingTracks(
  template: TemplateLike,
  catalog: Array<Pick<ExerciseWithMax, "id" | "track">>,
  plannedExerciseIds: Iterable<string> = [],
  phaseKey?: string | null,
): Exercise[] {
  const planned = new Set(plannedExerciseIds);
  const hasTrack = new Set(
    catalog
      .filter((exercise) => exercise.track && exercise.track.steps.length > 0)
      .map((exercise) => exercise.id),
  );

  return template.exercises.filter((exercise) => {
    if (planned.has(exercise.id) || hasTrack.has(exercise.id)) {
      return false;
    }
    return slotNeedsTrack(slotFor(template.slots, exercise.id), phaseKey);
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
    return "Максимум перейдёт как есть. Перед подтверждением можно поправить.";
  }
  if (progress.hold_weights) {
    return "Не пошло — максимум на раз и рабочий кг не трогаем.";
  }
  const kg = kgBumpLabel(progress.kg_increase_on_end);
  if (progress.last_in_cycle) {
    if (progress.increases_on_end && kg) {
      return `Цикл закроется и начнётся новый. Можно поднять максимум, ${kg}.`;
    }
    if (progress.increases_on_end) {
      return "Цикл закроется и начнётся новый. Можно поднять максимум — не всем сразу.";
    }
    if (kg) {
      return `Цикл закроется и начнётся новый. ${capitalize(kg)}.`;
    }
    return "Цикл закроется и начнётся новый. Веса возьмём с последней тяжёлой недели.";
  }
  if (progress.increases_on_end && kg) {
    return `Дальше «${progress.next_phase_name}». Можно поднять максимум, ${kg}.`;
  }
  if (progress.increases_on_end) {
    return `Дальше «${progress.next_phase_name}». Можно поднять максимум — не всем сразу.`;
  }
  if (kg && progress.next_phase_name) {
    return `Дальше «${progress.next_phase_name}». ${capitalize(kg)}.`;
  }
  if (progress.next_phase_name) {
    return `Дальше «${progress.next_phase_name}». Веса те же, можно поправить.`;
  }
  return "Максимум перейдёт как есть. Перед подтверждением можно поправить.";
}

export function phaseHoldHint(progress: PhaseCircleProgress): string | null {
  if (!progress.hold_weights) {
    return null;
  }
  return "Не пошло — максимум на раз и рабочий кг не трогаем.";
}

export function transitionExplain(preview: TransitionPreview): string {
  if (preview.hold_weights) {
    return "Не пошло — максимум на раз и рабочий кг не трогаем, можно поправить.";
  }
  const kg = kgBumpLabel(preview.kg_increase);
  if (preview.new_macro && preview.increased && kg) {
    return `Цикл закроется и начнётся новый. Можно поднять максимум, ${kg}.`;
  }
  if (preview.new_macro && preview.increased) {
    return "Цикл закроется и начнётся новый. Можно поднять максимум — не всем сразу.";
  }
  if (preview.new_macro && kg) {
    return `Цикл закроется и начнётся новый. ${capitalize(kg)}.`;
  }
  if (preview.new_macro) {
    return "Цикл закроется и начнётся новый. Веса возьмём с последней тяжёлой недели, можно поправить.";
  }
  if (preview.increased && kg) {
    return `На «${preview.to_name}» можно поднять максимум, ${kg}.`;
  }
  if (preview.increased) {
    return `На «${preview.to_name}» можно поднять максимум. Не всем сразу.`;
  }
  if (kg && preview.to_name) {
    return `Дальше «${preview.to_name}». ${capitalize(kg)}.`;
  }
  if (preview.to_name) {
    return `Дальше «${preview.to_name}». Веса те же, можно поправить.`;
  }
  return "Максимум перейдёт как есть. Перед подтверждением можно поправить.";
}

function kgBumpLabel(kg: number | null | undefined): string | null {
  if (kg == null || !(kg > 0)) {
    return null;
  }
  return `рабочий вес +${formatWeight(kg)} кг`;
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
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
    kg_increase_on_end:
      typeof row.kg_increase_on_end === "number" &&
      Number.isFinite(row.kg_increase_on_end) &&
      row.kg_increase_on_end > 0
        ? row.kg_increase_on_end
        : null,
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

import { isRecord } from "@/lib/read";
import type {
  Exercise,
  ExerciseWithMax,
  PhaseCircleProgress,
  PhaseType,
  TransitionPreview,
} from "@/lib/types";
import { isPhaseType } from "@/lib/workout/default-formulas";
import { phaseLabel } from "@/lib/workout/labels";

export function todayWeightsHint(
  phaseType: PhaseType | null,
  macroNumber: number | null,
  phaseName?: string | null,
): string {
  if (phaseType == null || macroNumber == null) {
    return "Веса от рабочего веса упражнения, как в рабочей схеме.";
  }

  return `Веса сегодня от фазы «${phaseLabel(phaseType, phaseName)}» макроцикла №${macroNumber}.`;
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
      return `«${phase}» уже ${rounds} ${circleWord(rounds)}. Можно закрыть макроцикл, когда восстановился.`;
    }
    return `Круг «${phase}» пройден. Можно закрыть макроцикл, когда восстановился.`;
  }

  if (rounds >= 2) {
    return `«${phase}» уже ${rounds} ${circleWord(rounds)}. Можно ещё покрутить или закрыть${nextLabel ? ` — дальше «${nextLabel}»` : ""}.`;
  }

  return `Круг «${phase}» пройден. Фазу оставляешь или закрываешь сам${nextLabel ? `. Дальше — «${nextLabel}»` : ""}.`;
}

export function completePhaseHint(
  progress: PhaseCircleProgress | null,
): string {
  if (!progress) {
    return "Рабочие веса скопируются в новую фазу. Цифры ещё можно поправить.";
  }
  if (progress.last_in_cycle) {
    return "Этот макроцикл закроется, следующий начнётся с первой фазы. Рабочие веса возьмутся с последней тяжёлой фазы.";
  }
  if (progress.increases_on_end) {
    return `Дальше «${progress.next_phase_name}». Можно поднять рабочие веса — не всем упражнениям нужно, цифры поправишь до подтверждения.`;
  }
  if (progress.next_phase_name) {
    return `Дальше «${progress.next_phase_name}». Рабочие веса скопируются, цифры ещё можно поправить.`;
  }
  return "Рабочие веса скопируются в новую фазу. Цифры ещё можно поправить.";
}

export function transitionExplain(preview: TransitionPreview): string {
  if (preview.new_macro) {
    return "Текущий макроцикл закроется, начнётся следующий с первой фазы. Рабочие веса — с последней тяжёлой фазы, их ещё можно поправить.";
  }
  if (preview.increased) {
    return `На фазе «${preview.to_name}» можно поднять рабочие веса. Можно оставить как есть или поднять не все.`;
  }
  if (preview.to_name) {
    return `Дальше «${preview.to_name}». Рабочие веса скопируются. Цифры ещё можно поправить.`;
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

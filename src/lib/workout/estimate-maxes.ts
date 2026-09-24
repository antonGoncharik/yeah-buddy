import type { UserSex } from "@/lib/types";

export type TrainingAge = "beginner" | "year" | "years";
export type AnchorLift = "squat" | "bench" | "deadlift";

export const TRAINING_AGE_OPTIONS: Array<{
  id: TrainingAge;
  label: string;
}> = [
  { id: "beginner", label: "Только начал" },
  { id: "year", label: "Около года" },
  { id: "years", label: "Несколько лет" },
];

export function isTrainingAge(value: unknown): value is TrainingAge {
  return value === "beginner" || value === "year" || value === "years";
}

/** Bodyweight coefficients when the person does not know the lift. */
const ANCHOR_COEF: Record<
  UserSex,
  Record<TrainingAge, Record<AnchorLift, number>>
> = {
  male: {
    beginner: { squat: 0.8, bench: 0.6, deadlift: 1 },
    year: { squat: 1.25, bench: 0.9, deadlift: 1.5 },
    years: { squat: 1.6, bench: 1.2, deadlift: 1.9 },
  },
  female: {
    beginner: { squat: 0.6, bench: 0.35, deadlift: 0.8 },
    year: { squat: 0.95, bench: 0.55, deadlift: 1.2 },
    years: { squat: 1.25, bench: 0.75, deadlift: 1.6 },
  },
};

/**
 * Each starter strength lift → closest big three, as a fraction of that
 * anchor's максимум на раз. Anchors themselves are 1.
 */
const LIFT_SCALE: Array<{
  name: string;
  anchor: AnchorLift;
  factor: number;
}> = [
  { name: "Приседания со штангой", anchor: "squat", factor: 1 },
  { name: "Становая тяга", anchor: "deadlift", factor: 1 },
  { name: "Жим лёжа", anchor: "bench", factor: 1 },
  { name: "Гак-приседания", anchor: "squat", factor: 0.85 },
  { name: "Жим ногами", anchor: "squat", factor: 1.5 },
  { name: "Выпады", anchor: "squat", factor: 0.5 },
  { name: "Разгибание ног", anchor: "squat", factor: 0.4 },
  { name: "Сгибание ног", anchor: "squat", factor: 0.35 },
  { name: "Подъём на носки стоя", anchor: "squat", factor: 0.45 },
  { name: "Подъём на носки сидя", anchor: "squat", factor: 0.4 },
  { name: "Румынская тяга", anchor: "deadlift", factor: 0.7 },
  { name: "Наклоны со штангой", anchor: "deadlift", factor: 0.7 },
  { name: "Тяга штанги в наклоне", anchor: "deadlift", factor: 0.45 },
  { name: "Тяга Т-штанги", anchor: "deadlift", factor: 0.45 },
  { name: "Тяга гантели в наклоне", anchor: "deadlift", factor: 0.35 },
  { name: "Тяга верхнего блока", anchor: "deadlift", factor: 0.55 },
  { name: "Тяга горизонтального блока", anchor: "deadlift", factor: 0.5 },
  { name: "Шраги со штангой", anchor: "deadlift", factor: 0.5 },
  { name: "Гиперэкстензия", anchor: "deadlift", factor: 0.4 },
  { name: "Подтягивания", anchor: "deadlift", factor: 0.3 },
  { name: "Жим лёжа под наклоном", anchor: "bench", factor: 0.8 },
  { name: "Жим гантелей лёжа", anchor: "bench", factor: 0.75 },
  { name: "Жим гантелей под наклоном", anchor: "bench", factor: 0.7 },
  { name: "Жим узким хватом", anchor: "bench", factor: 0.8 },
  { name: "Жим стоя", anchor: "bench", factor: 0.65 },
  { name: "Жим гантелей стоя", anchor: "bench", factor: 0.55 },
  { name: "Жим гантелей сидя", anchor: "bench", factor: 0.55 },
  { name: "Отжимания на брусьях", anchor: "bench", factor: 0.7 },
  { name: "Отжимания от пола", anchor: "bench", factor: 0.5 },
  { name: "Жим от груди в тренажёре", anchor: "bench", factor: 0.85 },
  { name: "Французский жим", anchor: "bench", factor: 0.35 },
  { name: "Разгибание на блоке", anchor: "bench", factor: 0.3 },
  { name: "Подъём штанги на бицепс", anchor: "bench", factor: 0.25 },
  { name: "Подъём гантелей на бицепс", anchor: "bench", factor: 0.2 },
  { name: "Молотковый подъём", anchor: "bench", factor: 0.2 },
  { name: "Подъём на скамье Скотта", anchor: "bench", factor: 0.22 },
  { name: "Концентрированный подъём", anchor: "bench", factor: 0.15 },
  { name: "Разведение гантелей в стороны", anchor: "bench", factor: 0.15 },
  { name: "Махи в наклоне", anchor: "bench", factor: 0.12 },
  { name: "Подъём гантелей перед собой", anchor: "bench", factor: 0.15 },
  { name: "Обратные разведения в тренажёре", anchor: "bench", factor: 0.12 },
  { name: "Разведение гантелей лёжа", anchor: "bench", factor: 0.25 },
  { name: "Сведение в кроссовере", anchor: "bench", factor: 0.25 },
  { name: "Пуловер", anchor: "bench", factor: 0.3 },
  { name: "Тяга штанги к подбородку", anchor: "bench", factor: 0.4 },
  { name: "Скручивания на блоке", anchor: "bench", factor: 0.2 },
  { name: "Пресс", anchor: "bench", factor: 0.1 },
];

const SCALE_BY_NAME = new Map(
  LIFT_SCALE.map((item) => [item.name, item] as const),
);

export interface EstimateExerciseInput {
  id: string;
  name: string;
  weight_step: number;
  workout_type: "dynamic" | "static" | "both";
  /** Skip if already has a максимум на раз. */
  has_max: boolean;
}

export interface EstimateMaxesInput {
  sex: UserSex;
  trainingAge: TrainingAge;
  weightKg: number;
  known: Partial<Record<AnchorLift, number | null>>;
  exercises: EstimateExerciseInput[];
}

export interface EstimatedMax {
  exerciseId: string;
  name: string;
  maxWeight: number;
  anchor: AnchorLift;
}

export function estimateAnchorMax(input: {
  sex: UserSex;
  trainingAge: TrainingAge;
  weightKg: number;
  lift: AnchorLift;
  knownKg: number | null | undefined;
  step?: number;
}): number {
  const step = input.step != null && input.step > 0 ? input.step : 2.5;
  if (input.knownKg != null && input.knownKg > 0) {
    // Keep the typed lift; only snap to the plate step and the hard ceiling.
    return clampMax(roundToStep(input.knownKg, step), step);
  }
  const coef = ANCHOR_COEF[input.sex][input.trainingAge][input.lift];
  return clampMax(roundToStep(input.weightKg * coef, step));
}

export function estimateExerciseMaxes(
  input: EstimateMaxesInput,
): EstimatedMax[] {
  if (!(input.weightKg >= 30 && input.weightKg <= 250)) {
    return [];
  }

  const anchors: Record<AnchorLift, number> = {
    squat: estimateAnchorMax({
      sex: input.sex,
      trainingAge: input.trainingAge,
      weightKg: input.weightKg,
      lift: "squat",
      knownKg: input.known.squat,
    }),
    bench: estimateAnchorMax({
      sex: input.sex,
      trainingAge: input.trainingAge,
      weightKg: input.weightKg,
      lift: "bench",
      knownKg: input.known.bench,
    }),
    deadlift: estimateAnchorMax({
      sex: input.sex,
      trainingAge: input.trainingAge,
      weightKg: input.weightKg,
      lift: "deadlift",
      knownKg: input.known.deadlift,
    }),
  };

  const out: EstimatedMax[] = [];
  for (const exercise of input.exercises) {
    if (exercise.has_max || exercise.workout_type === "static") {
      continue;
    }
    const scale = SCALE_BY_NAME.get(exercise.name);
    if (!scale) {
      continue;
    }
    const raw = anchors[scale.anchor] * scale.factor;
    const step = exercise.weight_step > 0 ? exercise.weight_step : 2.5;
    out.push({
      exerciseId: exercise.id,
      name: exercise.name,
      maxWeight: clampMax(roundToStep(raw, step), step),
      anchor: scale.anchor,
    });
  }
  return out;
}

export function roundToStep(value: number, step: number): number {
  if (!(step > 0)) {
    return Math.round(value);
  }
  return Math.round(value / step) * step;
}

export function clampMax(value: number, floor = 20): number {
  const min = floor > 0 ? floor : 20;
  if (value < min) {
    return min;
  }
  if (value > 300) {
    return 300;
  }
  return value;
}

import type {
  ExerciseCategory,
  ExerciseSlot,
  ExerciseWorkoutType,
  FormulaPreset,
} from "@/lib/types";

export interface StarterExercise {
  name: string;
  short_name: string;
  category: ExerciseCategory;
  workout_type: ExerciseWorkoutType;
  slot: ExerciseSlot;
  weight_step: number;
  formula_preset: FormulaPreset;
}

interface LiftOptions {
  category?: ExerciseCategory;
  weight_step?: number;
  formula_preset?: FormulaPreset;
}

export const STARTER_EXERCISES: StarterExercise[] = [
  lift("Приседания со штангой", "присед", "a"),
  lift("Румынская тяга", "RDL", "a"),
  lift("Жим лёжа", "жим лёжа", "b"),
  lift("Жим стоя", "жим стоя", "b"),
  lift("Тяга штанги в наклоне", "тяга в наклоне", "c"),
  lift("Тяга верхнего блока", "тяга блока", "c", {
    weight_step: 1,
    formula_preset: "cable",
  }),
  lift("Становая тяга", "становая", "a"),
  lift("Выпады", "выпады", "a"),
  lift("Жим гантелей лёжа", "жим гантелей", "b"),
  lift("Отжимания на брусьях", "брусья", "b"),
  lift("Подтягивания", "подтягивания", "c"),
  lift("Тяга горизонтального блока", "тяга гориз.", "c", {
    weight_step: 1,
    formula_preset: "cable",
  }),
  lift("Жим ногами", "жим ногами", "a", { weight_step: 5 }),
  lift("Отжимания от пола", "отжимания", "b"),
  lift("Жим гантелей стоя", "жим гантелей стоя", "b"),
  lift("Тяга гантели в наклоне", "тяга гантели", "c"),
  lift("Жим лёжа под наклоном", "жим наклон", "b"),
  lift("Жим гантелей под наклоном", "жим гантелей наклон", "b"),
  lift("Жим гантелей сидя", "жим сидя", "b"),
  lift("Разведение гантелей в стороны", "махи в стороны", "b", {
    category: "isolation",
    formula_preset: "none",
  }),
  lift("Жим узким хватом", "жим узкий", "b"),
  lift("Французский жим", "французский", "b", { category: "isolation" }),
  lift("Разгибание на блоке", "трицепс блок", "b", {
    category: "isolation",
    weight_step: 1,
    formula_preset: "cable",
  }),
  lift("Подъём штанги на бицепс", "бицепс штанга", "c"),
  lift("Подъём гантелей на бицепс", "бицепс гантели", "c", {
    category: "isolation",
  }),
  lift("Молотковый подъём", "молотки", "c", { category: "isolation" }),
];

function lift(
  name: string,
  shortName: string,
  slot: ExerciseSlot,
  options: LiftOptions = {},
): StarterExercise {
  return {
    name,
    short_name: shortName,
    category: options.category ?? "base",
    workout_type: "dynamic",
    slot,
    weight_step: options.weight_step ?? 2.5,
    formula_preset: options.formula_preset ?? "barbell",
  };
}

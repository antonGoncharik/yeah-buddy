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
  lift("Румынская тяга", "румынская", "a"),
  lift("Жим лёжа", "жим лёжа", "b"),
  lift("Жим стоя", "жим стоя", "b"),
  lift("Тяга штанги в наклоне", "тяга в наклоне", "c"),
  lift("Тяга верхнего блока", "тяга блока", "c", { formula_preset: "cable" }),
  lift("Становая тяга", "становая", "a"),
  lift("Выпады", "выпады", "a"),
  lift("Жим гантелей лёжа", "жим гантелей", "b"),
  lift("Отжимания на брусьях", "брусья", "b"),
  lift("Подтягивания", "подтягивания", "c"),
  lift("Тяга горизонтального блока", "тяга гориз.", "c", {
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
  }),
  lift("Жим узким хватом", "жим узкий", "b"),
  lift("Французский жим", "французский", "b", {
    category: "isolation",
    formula_preset: "barbell",
  }),
  lift("Разгибание на блоке", "трицепс блок", "b", {
    category: "isolation",
    formula_preset: "cable",
  }),
  lift("Подъём штанги на бицепс", "бицепс штанга", "c"),
  lift("Подъём гантелей на бицепс", "бицепс гантели", "c", {
    category: "isolation",
    formula_preset: "barbell",
  }),
  lift("Молотковый подъём", "молотки", "c", {
    category: "isolation",
    formula_preset: "barbell",
  }),
  lift("Сгибание ног", "сгибание ног", "a", { category: "isolation" }),
  lift("Махи в наклоне", "махи в наклоне", "b", { category: "isolation" }),
  lift("Гак-приседания", "гак", "a", { weight_step: 5 }),
  lift("Разгибание ног", "разгибание ног", "a", { category: "isolation" }),
  lift("Гиперэкстензия", "гиперэкстензия", "a", { category: "isolation" }),
  lift("Подъём на носки стоя", "икры стоя", "a", { category: "isolation" }),
  lift("Подъём на носки сидя", "икры сидя", "a", { category: "isolation" }),
  lift("Наклоны со штангой", "гудмонинг", "a"),
  lift("Тяга Т-штанги", "Т-тяга", "c"),
  lift("Шраги со штангой", "шраги", "c"),
  lift("Тяга штанги к подбородку", "протяжка", "b"),
  lift("Подъём гантелей перед собой", "махи вперёд", "b", {
    category: "isolation",
  }),
  lift("Обратные разведения в тренажёре", "задние дельты", "b", {
    category: "isolation",
  }),
  lift("Жим от груди в тренажёре", "жим в тренажёре", "b", {
    formula_preset: "none",
  }),
  lift("Разведение гантелей лёжа", "разводка", "b", { category: "isolation" }),
  lift("Сведение в кроссовере", "кроссовер", "b", {
    category: "isolation",
    formula_preset: "cable",
  }),
  lift("Пуловер", "пуловер", "c", { category: "isolation" }),
  lift("Скручивания на блоке", "скручивания", "c", {
    category: "isolation",
    formula_preset: "cable",
  }),
  lift("Подъём на скамье Скотта", "скамья Скотта", "c", {
    category: "isolation",
    formula_preset: "barbell",
  }),
  lift("Концентрированный подъём", "концентрированный", "c", {
    category: "isolation",
  }),
];

function lift(
  name: string,
  shortName: string,
  slot: ExerciseSlot,
  options: LiftOptions = {},
): StarterExercise {
  const category = options.category ?? "base";
  const formulaPreset =
    options.formula_preset ?? (category === "isolation" ? "none" : "barbell");
  return {
    name,
    short_name: shortName,
    category,
    workout_type: "dynamic",
    slot,
    weight_step: options.weight_step ?? (formulaPreset === "cable" ? 1 : 2.5),
    formula_preset: formulaPreset,
  };
}

import type { WorkoutKind } from "@/lib/types";
import { STARTER_EXERCISES } from "@/lib/workout/starter-exercises";

export interface ProgramDay {
  name: string;
  kind: WorkoutKind;
  exercises: string[];
}

export interface ProgramPreset {
  id: "ppl" | "upper_lower";
  name: string;
  hint: string;
  templates: ProgramDay[];
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: "ppl",
    name: "Ноги / Жим / Тяга",
    hint: "Три тренировки по кругу: ноги, жим, тяга.",
    templates: [
      {
        name: "Ноги",
        kind: "dynamic",
        exercises: ["Приседания со штангой", "Румынская тяга"],
      },
      {
        name: "Жим",
        kind: "dynamic",
        exercises: ["Жим лёжа", "Жим стоя"],
      },
      {
        name: "Тяга",
        kind: "dynamic",
        exercises: ["Тяга штанги в наклоне", "Тяга верхнего блока"],
      },
    ],
  },
  {
    id: "upper_lower",
    name: "Верх / Низ",
    hint: "Две тренировки по кругу: верх, потом низ.",
    templates: [
      {
        name: "Верх",
        kind: "dynamic",
        exercises: [
          "Жим лёжа",
          "Жим стоя",
          "Тяга штанги в наклоне",
          "Тяга верхнего блока",
        ],
      },
      {
        name: "Низ",
        kind: "dynamic",
        exercises: ["Приседания со штангой", "Румынская тяга"],
      },
    ],
  },
];

export function isProgramPresetId(
  value: unknown,
): value is ProgramPreset["id"] {
  return value === "ppl" || value === "upper_lower";
}

const STARTER_NAMES = new Set(
  STARTER_EXERCISES.map((exercise) => exercise.name),
);

export function programPresetExerciseNames(): string[] {
  return [
    ...new Set(
      PROGRAM_PRESETS.flatMap((preset) =>
        preset.templates.flatMap((day) => day.exercises),
      ),
    ),
  ];
}

export function unknownProgramExercises(): string[] {
  return programPresetExerciseNames().filter(
    (name) => !STARTER_NAMES.has(name),
  );
}

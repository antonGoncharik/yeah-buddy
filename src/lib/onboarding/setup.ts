import type { UserTrainingAge } from "@/lib/types";
import {
  isProgramPresetId,
  type ProgramPresetId,
  RECOMMENDED_PROGRAM_PRESET_ID,
} from "@/lib/workout/program-presets";

export type OnboardingCircleChoice = ProgramPresetId | "empty";

/** Linear full body, then 5×5, then upper/lower. Home stays a separate shelf. */
export function programForTrainingAge(
  trainingAge: UserTrainingAge | null,
): ProgramPresetId {
  if (trainingAge === "years") {
    return "upper_lower";
  }
  if (trainingAge === "year") {
    return "five_by_five";
  }
  return RECOMMENDED_PROGRAM_PRESET_ID;
}

export function beginnerProgramPitch(trainingAge: UserTrainingAge | null): {
  hint: string;
} {
  const id = programForTrainingAge(trainingAge);
  if (id === "five_by_five") {
    return {
      hint: "Поставим «Пять по пять»: одни и те же движения, вес растёт, когда зал идёт.",
    };
  }
  if (id === "upper_lower") {
    return {
      hint: "Поставим «Верх / Низ»: один день верх, другой ноги.",
    };
  }
  return {
    hint: "Поставим «Всё тело»: 2 разные тренировки, обычно ходят 2–3 раза в неделю.",
  };
}

export function defaultOnboardingCircle(
  circle: OnboardingCircleChoice,
  replay: boolean,
  trainingAge: UserTrainingAge | null = null,
): OnboardingCircleChoice {
  if (replay || circle !== "empty") {
    return circle;
  }
  return programForTrainingAge(trainingAge);
}

export function isExtraProgram(circle: OnboardingCircleChoice): boolean {
  return isProgramPresetId(circle) && circle !== RECOMMENDED_PROGRAM_PRESET_ID;
}

export function scaledTemplateGrams(
  items: Array<{ id: string; grams: number; protein: number }>,
  targetProtein: number,
): Array<{ id: string; grams: number }> {
  if (!(targetProtein > 0) || items.length === 0) {
    return [];
  }

  const current = items.reduce((sum, item) => sum + item.protein, 0);
  if (!(current > 0)) {
    return [];
  }

  const factor = targetProtein / current;
  if (Math.abs(factor - 1) < 0.05) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    grams: clampPortion(Math.round((item.grams * factor) / 5) * 5),
  }));
}

function clampPortion(value: number): number {
  if (value < 5) {
    return 5;
  }
  if (value > 1000) {
    return 1000;
  }
  return value;
}

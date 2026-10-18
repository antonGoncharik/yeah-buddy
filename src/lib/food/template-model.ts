import { reviewVisibleTemplates } from "@/lib/food/template-audit";
import {
  type TemplateGoalSettings,
  templateMacroTarget,
  visibleTemplateFitItems,
} from "@/lib/food/template-fit";
import {
  calcMacrosFromPer100,
  DAY_TEMPLATE_TITLES,
  getMealLabel,
  roundMacros,
} from "@/lib/nutrition";
import type {
  MealTemplateDetail,
  UserGoal,
  UserSex,
  UserTrainingAge,
} from "@/lib/types";

export interface MealTemplateModelItem {
  meal: string;
  name: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}

export interface MealTemplateModelDay {
  title: string;
  target: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
  items: MealTemplateModelItem[];
}

export interface MealTemplateModelInput {
  sex: string | null;
  goal: string | null;
  training_age: string | null;
  rest: MealTemplateModelDay;
  training: MealTemplateModelDay | null;
  notes: string[];
}

export function mealTemplateModelInput(
  templates: readonly MealTemplateDetail[],
  settings: TemplateModelSettings | null,
): MealTemplateModelInput | null {
  const gym = settings?.gym_enabled !== false;
  const rest = templates.find((template) => template.day_type === "rest");
  const training = gym
    ? templates.find((template) => template.day_type === "training")
    : undefined;
  if (!rest) {
    return null;
  }
  const restDay = modelDay(rest, settings);
  const trainingDay = training ? modelDay(training, settings) : null;
  if (restDay.items.length === 0 && (trainingDay?.items.length ?? 0) === 0) {
    return null;
  }
  return {
    sex: sexLabel(settings?.sex),
    goal: goalLabel(settings?.goal),
    training_age: trainingAgeLabel(settings?.training_age),
    rest: restDay,
    training: trainingDay,
    notes: reviewVisibleTemplates(templates, settings, gym).lines,
  };
}

type TemplateModelSettings = TemplateGoalSettings & {
  sex?: UserSex | null;
  goal?: UserGoal | null;
  training_age?: UserTrainingAge | null;
  gym_enabled?: boolean;
};

function modelDay(
  template: MealTemplateDetail,
  settings: TemplateGoalSettings | null,
): MealTemplateModelDay {
  const target = roundMacros(templateMacroTarget(template.day_type, settings));
  return {
    title: DAY_TEMPLATE_TITLES[template.day_type],
    target,
    items: visibleTemplateFitItems(template).map((item) => {
      const macros = roundMacros(calcMacrosFromPer100(item.per100, item.grams));
      return {
        meal: getMealLabel(item.mealType),
        name: item.name,
        grams: item.grams,
        protein: macros.protein,
        fat: macros.fat,
        carbs: macros.carbs,
        kcal: macros.kcal,
      };
    }),
  };
}

function sexLabel(sex: UserSex | null | undefined): string | null {
  if (sex === "male") {
    return "мужчина";
  }
  if (sex === "female") {
    return "женщина";
  }
  return null;
}

function goalLabel(goal: UserGoal | null | undefined): string | null {
  if (goal === "lose") {
    return "похудеть";
  }
  if (goal === "keep") {
    return "держать";
  }
  if (goal === "gain") {
    return "набрать";
  }
  return null;
}

function trainingAgeLabel(
  age: UserTrainingAge | null | undefined,
): string | null {
  if (age === "beginner") {
    return "новичок";
  }
  if (age === "year") {
    return "около года";
  }
  if (age === "years") {
    return "несколько лет";
  }
  return null;
}

import { fitVisibleTemplate } from "@/lib/food/template-fit";
import {
  listMealTemplates,
  updateTemplateItemsGrams,
} from "@/lib/meal-templates";
import { getUserSettings } from "@/lib/settings";
import { gymFeaturesEnabled } from "@/lib/settings/gym-mode";
import type { DayType, MealTemplateDetail } from "@/lib/types";

export async function fitMealTemplates(
  userId: string,
  dayType: DayType | null,
): Promise<{ templates: MealTemplateDetail[]; changed: boolean }> {
  const settings = await getUserSettings(userId);
  const gym = gymFeaturesEnabled(settings);
  if (dayType === "training" && !gym) {
    throw new TemplateFitUnavailableError();
  }

  const days: DayType[] = dayType
    ? [dayType]
    : gym
      ? ["rest", "training"]
      : ["rest"];
  const current = await listMealTemplates(userId);
  let changed = false;

  for (const day of days) {
    const template = current.find((row) => row.day_type === day);
    if (!template) {
      continue;
    }
    const fitted = fitVisibleTemplate(template, settings);
    if (!fitted.changed) {
      continue;
    }
    const updates = fitted.grams.flatMap((line) => {
      const previous = template.items.find((item) => item.id === line.id);
      if (!previous || previous.grams === line.grams) {
        return [];
      }
      return [{ id: line.id, grams: line.grams }];
    });
    if (updates.length === 0) {
      continue;
    }
    await updateTemplateItemsGrams(userId, updates);
    changed = true;
  }

  return {
    templates: changed ? await listMealTemplates(userId) : current,
    changed,
  };
}

export class TemplateFitUnavailableError extends Error {
  constructor() {
    super("День тренировки сейчас выключен.");
    this.name = "TemplateFitUnavailableError";
  }
}

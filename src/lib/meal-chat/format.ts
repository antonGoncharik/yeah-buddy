import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { getMealLabel } from "@/lib/nutrition";
import type { MealType } from "@/lib/types";

export function formatMealChatHeader(mealType: MealType, date: string): string {
  return `${getMealLabel(mealType)} · ${date}`;
}

export function formatMealChatItems(items: PlateDraftItem[]): string {
  return items
    .map((item) => {
      if (item.kind === "food") {
        return `· ${item.name} ${item.grams} г`;
      }
      return `· ${item.name}`;
    })
    .join("\n");
}

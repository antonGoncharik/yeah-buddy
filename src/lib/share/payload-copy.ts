import {
  calcKcalFromMacros,
  calcMacrosFromPer100,
  formatKcal,
  roundMacros,
  sumMealItems,
} from "@/lib/nutrition";
import type {
  MealsPackPayload,
  PackMealItem,
  SharePackKind,
  WorkoutsPackPayload,
} from "@/lib/share/payload-schema";
import type { WorkoutFormulas } from "@/lib/types";

export function mealsPackHint(payload: MealsPackPayload): string {
  const rest = payload.templates.find((row) => row.day_type === "rest");
  const training = payload.templates.find((row) => row.day_type === "training");
  const restKcal = rest ? dayKcal(rest.items) : 0;
  const trainingKcal = training ? dayKcal(training.items) : 0;
  return `Отдых ${formatKcal(restKcal)} · зал ${formatKcal(trainingKcal)} ккал`;
}

export function workoutsPackHint(payload: WorkoutsPackPayload): string {
  const names = payload.templates.map((day) => day.name);
  if (names.length <= 3) {
    return names.join(" · ");
  }

  return `${names.slice(0, 2).join(" · ")} и ещё ${names.length - 2}`;
}

export function defaultMealsTitle(payload: MealsPackPayload): string {
  const rest = payload.templates.find((row) => row.day_type === "rest");
  const training = payload.templates.find((row) => row.day_type === "training");
  const restKcal = rest ? dayKcal(rest.items) : 0;
  const trainingKcal = training ? dayKcal(training.items) : 0;
  return `Еда · ${formatKcal(restKcal)} / ${formatKcal(trainingKcal)} ккал`;
}

export function defaultWorkoutsTitle(payload: WorkoutsPackPayload): string {
  return payload.templates.map((day) => day.name).join(" / ");
}

export function packShareText(kind: SharePackKind, title?: string): string {
  const name = title?.trim();
  if (name) {
    return `${name} — Yeah Buddy`;
  }
  return kind === "meals"
    ? "Еда на день из Yeah Buddy"
    : "Тренировки из Yeah Buddy";
}

export function mealDayTotals(items: PackMealItem[]): {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
} {
  return roundMacros(
    sumMealItems(
      items.map((item) =>
        calcMacrosFromPer100(
          {
            protein: item.protein_per_100,
            fat: item.fat_per_100,
            carbs: item.carbs_per_100,
            kcal: calcKcalFromMacros(
              item.protein_per_100,
              item.fat_per_100,
              item.carbs_per_100,
            ),
          },
          item.grams,
        ),
      ),
    ),
  );
}

export function formulaHint(
  formulas: Pick<WorkoutFormulas, "dynamic">,
): string {
  const work = formulas.dynamic.base.work;
  if (work.length === 0) {
    return "своя схема";
  }

  const first = work[0];
  const same = work.every(
    (set) => set.percent === first?.percent && set.reps === first.reps,
  );
  if (same && first?.reps != null) {
    return `${work.length}×${first.reps}`;
  }

  return "своя схема";
}

function dayKcal(items: PackMealItem[]): number {
  return mealDayTotals(items).kcal;
}

import {
  CookieDoodle,
  DumbbellDoodle,
  MugDoodle,
} from "@/components/layout/doodles";
import type { MealType } from "@/lib/types";

export function MealTypeMark({ mealType }: { mealType: MealType }) {
  if (mealType === "breakfast" || mealType === "dinner") {
    return <MugDoodle className="h-5 w-4 shrink-0 text-primary/80" />;
  }

  if (mealType === "pre_workout" || mealType === "post_workout") {
    return <DumbbellDoodle className="h-3.5 w-7 shrink-0 text-primary/80" />;
  }

  return <CookieDoodle className="size-4 shrink-0 text-primary/80" />;
}

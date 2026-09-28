import {
  BarbellDoodle,
  CookieDoodle,
  DumbbellDoodle,
  MugDoodle,
  PlateDoodle,
  SandwichDoodle,
} from "@/components/layout/doodles";
import type { MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

const markClass = "shrink-0 text-primary/80";

export function MealTypeMark({ mealType }: { mealType: MealType }) {
  switch (mealType) {
    case "breakfast":
      return <MugDoodle className={cn("h-5 w-4", markClass)} />;
    case "lunch":
      return <SandwichDoodle className={cn("size-4", markClass)} />;
    case "snack":
      return <CookieDoodle className={cn("size-4", markClass)} />;
    case "dinner":
      return <PlateDoodle className={cn("size-4", markClass)} />;
    case "pre_workout":
      return <DumbbellDoodle className={cn("h-3.5 w-7", markClass)} />;
    case "post_workout":
      return <BarbellDoodle className={cn("h-3.5 w-8", markClass)} />;
  }
}

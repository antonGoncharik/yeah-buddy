import { DumbbellDoodle, MealDayDoodle } from "@/components/layout/doodles";
import { cn } from "@/lib/utils";

export function DayTypeMark({
  training,
  className,
}: {
  training: boolean;
  className?: string;
}) {
  if (training) {
    return <DumbbellDoodle className={cn("h-3.5 w-7", className)} />;
  }
  return <MealDayDoodle className={cn("size-4", className)} />;
}

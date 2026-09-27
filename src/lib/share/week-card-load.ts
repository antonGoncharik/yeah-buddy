import { listWeek } from "@/lib/day/week-load";
import {
  buildWeekCard,
  type WeekCard,
  type WeekCardExercise,
} from "@/lib/share/week-card";
import { getStrengthProgress } from "@/lib/workout/progress";

export async function loadWeekCard(userId: string): Promise<WeekCard | null> {
  const [week, progress] = await Promise.all([
    listWeek(userId),
    getStrengthProgress(userId),
  ]);
  const exercises: WeekCardExercise[] = progress.exercises.map((exercise) => ({
    name: exercise.name,
    category: exercise.category,
    fromWork: exercise.from_work,
    points: exercise.points.map((point) => ({
      date: point.date,
      weight: point.weight,
      fromPlan: point.from_plan,
    })),
  }));

  return buildWeekCard({
    today: week.today,
    slots: week.items,
    exercises,
  });
}

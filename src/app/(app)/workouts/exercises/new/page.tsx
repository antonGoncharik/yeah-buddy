import { AppHeader } from "@/components/layout/app-header";
import { ExerciseForm } from "@/components/workout/exercise-form";

export default function NewExercisePage() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новое упражнение" backHref="/workouts/exercises" />
      <div className="px-4 pb-4">
        <ExerciseForm />
      </div>
    </div>
  );
}

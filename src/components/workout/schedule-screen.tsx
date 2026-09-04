"use client";

import { AppHeader } from "@/components/layout/app-header";
import { WORKOUT_SLOT_LABELS } from "@/lib/workout/labels";

export function ScheduleScreen() {
  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Ротация" backHref="/workouts" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <section className="card-surface flex flex-col gap-3 px-5 py-5">
          <h2 className="text-xl font-semibold">Один проход фазы</h2>
          <p className="text-base text-muted-foreground">
            Не привязывайтесь к дням недели. После каждой тренировки система
            предлагает следующий слот.
          </p>
          <ol className="flex flex-col gap-2 text-base">
            <li>1. {WORKOUT_SLOT_LABELS.a}</li>
            <li>2. {WORKOUT_SLOT_LABELS.static}</li>
            <li>3. {WORKOUT_SLOT_LABELS.b}</li>
            <li>4. {WORKOUT_SLOT_LABELS.c}</li>
          </ol>
          <p className="text-base text-muted-foreground">
            Потом снова A. Дату выбираете сами. Веса, повторы и секунды
            считаются от максимума фазы.
          </p>
        </section>
      </div>
    </div>
  );
}

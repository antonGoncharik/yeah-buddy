"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { CycleTimeline } from "@/components/workout/cycle-timeline";
import { MacroRecapCard } from "@/components/workout/macro-recap-card";
import type { CurrentMacroState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { cycleSequenceLabel } from "@/lib/workout/hints";

export function MacroScreenNoMacro({
  state,
  justClosed,
}: {
  state: CurrentMacroState;
  justClosed: boolean;
}) {
  return (
    <>
      {state.last_recap ? (
        <MacroRecapCard
          key={state.last_recap.macro_id}
          recap={state.last_recap}
          featured={justClosed}
        />
      ) : null}
      <section className="card-surface flex flex-col gap-3 px-5 py-5">
        <p className="text-lg font-medium">Недель ещё нет</p>
        <p className="text-base leading-relaxed text-muted-foreground">
          {state.planned_cycle.length > 0
            ? `Круг: ${cycleSequenceLabel(state.planned_cycle)}. Тренировки те же — по неделям меняется вес.`
            : "Сначала выбери недели, потом запусти. Тренировки те же — меняется вес: проценты от «на раз» или килограммы на штанге."}
        </p>
        {state.planned_cycle.length > 0 ? (
          <CycleTimeline
            steps={state.planned_cycle.map((phase) => ({
              key: phase.key,
              name: phase.name,
              state: "upcoming",
            }))}
          />
        ) : null}
        <Link
          href="/workouts/macro/new"
          className={cn(buttonVariants(), "h-14 text-lg")}
        >
          Запустить недели
        </Link>
        <Link
          href="/settings/formulas/cycle"
          className="text-center text-base font-medium text-primary"
        >
          Выбрать недели
        </Link>
      </section>
    </>
  );
}

export function MacroScreenLoadError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <p className="text-center font-medium">{error}</p>
      <Button className="h-12 min-w-40 text-base" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

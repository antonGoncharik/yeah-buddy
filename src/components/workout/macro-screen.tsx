"use client";

import Link from "next/link";
import { useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CycleTimeline } from "@/components/workout/cycle-timeline";
import { MacroPhaseHeader } from "@/components/workout/macro-phase-header";
import { MacroPhaseMaxes } from "@/components/workout/macro-phase-maxes";
import { MacroRecapCard } from "@/components/workout/macro-recap-card";
import { useMacroScreen } from "@/components/workout/use-macro-screen";
import { cn } from "@/lib/utils";
import { cycleSequenceLabel } from "@/lib/workout/hints";
import { CYCLE_LABEL, phaseLabel } from "@/lib/workout/labels";

export function MacroScreen() {
  const {
    state,
    loading,
    error,
    drafts,
    forward,
    transitionDate,
    setTransitionDate,
    pendingTitle,
    advancing,
    justClosed,
    load,
    changeDraft,
    changeForward,
    completeWeek,
  } = useMacroScreen();
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={CYCLE_LABEL}
        subtitle="Какой сейчас круг. Веса считаются сами"
        backHref="/workouts"
      />

      <div className="flex flex-col gap-4 px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && !state ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && state && !state.macro ? (
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
                  : "Сначала выбери недели, потом запусти. Тренировки те же — меняется вес: проценты от максимума на раз или рабочие килограммы."}
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
        ) : null}

        {!loading && state?.macro && state.phase ? (
          <>
            {state.last_recap ? (
              <MacroRecapCard
                key={state.last_recap.macro_id}
                recap={state.last_recap}
                featured={justClosed}
              />
            ) : null}
            <MacroPhaseHeader
              state={{
                ...state,
                macro: state.macro,
                phase: state.phase,
              }}
              titleOverride={pendingTitle}
            />

            <MacroPhaseMaxes
              maxes={state.maxes}
              drafts={drafts}
              forward={pendingTitle ? {} : forward}
              onDraftChange={changeDraft}
              onForwardChange={changeForward}
            />

            {dateOpen ? (
              <Input
                type="date"
                aria-label="Дата"
                value={transitionDate}
                onChange={(event) => setTransitionDate(event.target.value)}
                className="h-12 text-base"
              />
            ) : (
              <button
                type="button"
                className="self-start text-base text-muted-foreground"
                onClick={() => setDateOpen(true)}
              >
                Другая дата
              </button>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <StickyActions>
              <Button
                type="button"
                className="h-14 text-lg"
                disabled={advancing}
                onClick={() => void completeWeek()}
              >
                {state.phase_circle?.last_in_cycle
                  ? "Закрыть цикл"
                  : `Завершить: ${phaseLabel(state.phase.phase_type, state.phase.name)}`}
              </Button>
            </StickyActions>
          </>
        ) : null}
      </div>
    </div>
  );
}

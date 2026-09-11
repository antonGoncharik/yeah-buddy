"use client";

import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { MacroPhaseHeader } from "@/components/workout/macro-phase-header";
import { MacroPhaseMaxes } from "@/components/workout/macro-phase-maxes";
import { MacroRecapCard } from "@/components/workout/macro-recap-card";
import { MacroTransitionPanel } from "@/components/workout/macro-transition-panel";
import { useMacroScreen } from "@/components/workout/use-macro-screen";
import { cn } from "@/lib/utils";
import { completePhaseHint } from "@/lib/workout/hints";
import { CYCLE_LABEL, phaseLabel } from "@/lib/workout/labels";

export function MacroScreen() {
  const {
    state,
    loading,
    error,
    drafts,
    setDrafts,
    savingId,
    preview,
    setPreview,
    transitionDate,
    setTransitionDate,
    transitionMaxes,
    setTransitionMaxes,
    transitioning,
    justClosed,
    load,
    saveMax,
    openTransition,
    confirmTransition,
  } = useMacroScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={CYCLE_LABEL}
        subtitle="То легче, то тяжелее"
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
              <p className="text-lg font-medium">Цикла ещё нет</p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Тренировки те же, просто легче или тяжелее. Этап закрываешь сам.
              </p>
              <Link
                href="/workouts/macro/new"
                className={cn(buttonVariants(), "h-14 text-lg")}
              >
                Создать цикл
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
            />

            <MacroPhaseMaxes
              maxes={state.maxes}
              drafts={drafts}
              savingId={savingId}
              onDraftChange={(exerciseId, value) =>
                setDrafts((current) => ({
                  ...current,
                  [exerciseId]: value,
                }))
              }
              onSave={(exerciseId) => void saveMax(exerciseId)}
            />

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {preview ? (
              <MacroTransitionPanel
                preview={preview}
                transitionDate={transitionDate}
                transitionMaxes={transitionMaxes}
                transitioning={transitioning}
                onDateChange={setTransitionDate}
                onMaxChange={(exerciseId, value) =>
                  setTransitionMaxes((current) => ({
                    ...current,
                    [exerciseId]: value,
                  }))
                }
                onConfirm={() => void confirmTransition()}
                onCancel={() => setPreview(null)}
              />
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {completePhaseHint(state.phase_circle)}
                </p>
                <StickyActions>
                  <Button
                    type="button"
                    className="h-14 text-lg"
                    disabled={transitioning}
                    onClick={() => void openTransition()}
                  >
                    {state.phase_circle?.last_in_cycle
                      ? "Закрыть цикл"
                      : `Завершить: ${phaseLabel(state.phase.phase_type, state.phase.name)}`}
                  </Button>
                </StickyActions>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

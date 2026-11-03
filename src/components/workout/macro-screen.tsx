"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { MacroScreenActiveMacro } from "@/components/workout/macro-screen-active";
import {
  MacroScreenLoadError,
  MacroScreenNoMacro,
} from "@/components/workout/macro-screen-empty";
import { useMacroScreen } from "@/components/workout/use-macro-screen";
import { CYCLE_LABEL } from "@/lib/workout/labels";

export function MacroScreen() {
  const {
    state,
    loading,
    error,
    rows,
    drafts,
    nextTitle,
    transitionDate,
    setTransitionDate,
    advancing,
    advanceStep,
    justClosed,
    load,
    changeDraft,
    completeWeek,
  } = useMacroScreen();

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
          <MacroScreenLoadError error={error} onRetry={() => void load()} />
        ) : null}

        {!loading && state && !state.macro ? (
          <MacroScreenNoMacro state={state} justClosed={justClosed} />
        ) : null}

        {!loading && state?.macro && state.phase ? (
          <MacroScreenActiveMacro
            state={{
              ...state,
              macro: state.macro,
              phase: state.phase,
            }}
            justClosed={justClosed}
            rows={rows}
            drafts={drafts}
            nextTitle={nextTitle}
            transitionDate={transitionDate}
            setTransitionDate={setTransitionDate}
            error={error}
            advancing={advancing}
            advanceStep={advanceStep}
            onDraftChange={changeDraft}
            onCompleteWeek={() => void completeWeek()}
          />
        ) : null}
      </div>
    </div>
  );
}

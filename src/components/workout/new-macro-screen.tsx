"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { NewMacroScreenStartForm } from "@/components/workout/new-macro-screen-form";
import {
  NewMacroScreenLoadError,
  NewMacroScreenQueueEmpty,
} from "@/components/workout/new-macro-screen-states";
import { useNewMacroScreen } from "@/components/workout/use-new-macro-screen";

export function NewMacroScreen() {
  const {
    exercises,
    formulas,
    startDate,
    setStartDate,
    note,
    setNote,
    maxes,
    setMaxes,
    loading,
    saving,
    applying,
    error,
    load,
    applyCycle,
    onSubmit,
    cycle,
    queueEmpty,
  } = useNewMacroScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый цикл" backHref="/workouts" />

      <div className="px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && exercises.length === 0 ? (
          <NewMacroScreenLoadError error={error} onRetry={() => void load()} />
        ) : null}

        {queueEmpty ? <NewMacroScreenQueueEmpty /> : null}

        {!loading && exercises.length > 0 ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <NewMacroScreenStartForm
              cycle={cycle}
              startDate={startDate}
              setStartDate={setStartDate}
              note={note}
              setNote={setNote}
              exercises={exercises}
              maxes={maxes}
              setMaxes={setMaxes}
              error={error}
              saving={saving}
              applying={applying}
              formulas={formulas}
              applyCycle={applyCycle}
            />
          </form>
        ) : null}
      </div>
    </div>
  );
}

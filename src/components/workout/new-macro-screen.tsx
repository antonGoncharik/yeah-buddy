"use client";

import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewMacroMaxes } from "@/components/workout/new-macro-maxes";
import { useNewMacroScreen } from "@/components/workout/use-new-macro-screen";
import { CYCLE_TEMPLATES } from "@/lib/workout/default-formulas";

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
  } = useNewMacroScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый цикл" backHref="/workouts" />

      <div className="px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && exercises.length === 0 ? (
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

        {!loading && exercises.length > 0 ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            {cycle.length === 0 ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-4">
                <h2 className="text-xl font-semibold">Сначала этапы</h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Выбери цикл или собери в подходах.
                </p>
                {CYCLE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    disabled={applying || !formulas}
                    className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
                    onClick={() => void applyCycle(template.cycle)}
                  >
                    <p className="text-base font-medium">{template.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {template.hint}
                    </p>
                  </button>
                ))}
                <Link
                  href="/settings/formulas"
                  className="text-base font-medium text-primary"
                >
                  Собрать свой в подходах
                </Link>
              </section>
            ) : (
              <>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {`${cycle.map((phase) => phase.name).join(" → ")}. Начнётся с «${cycle[0]?.name}». Веса ниже — что потянешь сейчас.`}
                </p>
                <div className="flex flex-col gap-2">
                  <Label className="text-base">Дата начала</Label>
                  <Input
                    type="date"
                    required
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-base">Примечание</Label>
                  <Input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <NewMacroMaxes
                  exercises={exercises}
                  maxes={maxes}
                  onChange={(exerciseId, value) =>
                    setMaxes((current) => ({
                      ...current,
                      [exerciseId]: value,
                    }))
                  }
                />
              </>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {cycle.length > 0 ? (
              <StickyActions>
                <Button
                  type="submit"
                  className="h-14 text-lg"
                  disabled={saving}
                >
                  {saving ? "Создание…" : "Создать цикл"}
                </Button>
              </StickyActions>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}

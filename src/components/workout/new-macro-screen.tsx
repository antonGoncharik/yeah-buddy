"use client";

import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormulaCycleTemplates } from "@/components/workout/formula-cycle-templates";
import { NewMacroMaxes } from "@/components/workout/new-macro-maxes";
import { useNewMacroScreen } from "@/components/workout/use-new-macro-screen";
import { cn } from "@/lib/utils";

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

        {queueEmpty ? (
          <section className="card-surface flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">Программа пустая</p>
            <p className="text-base leading-relaxed text-muted-foreground">
              Недели меняют вес в тех тренировках, что стоят в программе.
              Сначала поставь готовую или собери день.
            </p>
            <Link
              href="/workouts/schedule"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              К программе
            </Link>
          </section>
        ) : null}

        {!loading && exercises.length > 0 ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            {cycle.length === 0 ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-4">
                <h2 className="text-xl font-semibold">Сначала недели</h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Тренировки те же, что в программе. Недели меняют вес: проценты
                  от 1ПМ или рабочие килограммы.
                </p>
                <FormulaCycleTemplates
                  disabled={applying || !formulas}
                  onApply={(cycle, _name, extra) =>
                    void applyCycle(cycle, extra)
                  }
                />
              </section>
            ) : (
              <>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {`${cycle.map((phase) => phase.name).join(" → ")}. Тренировки те же, что в программе. Начнётся с «${cycle[0]?.name}».`}
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
                  {saving ? "Запуск…" : "Запустить недели"}
                </Button>
              </StickyActions>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}

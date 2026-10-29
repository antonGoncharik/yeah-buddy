"use client";

import type { Dispatch, SetStateAction } from "react";

import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormulaCycleTemplates } from "@/components/workout/formula-cycle-templates";
import { NewMacroMaxes } from "@/components/workout/new-macro-maxes";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  WorkoutFormulas,
} from "@/lib/types";

export function NewMacroScreenStartForm({
  cycle,
  startDate,
  setStartDate,
  note,
  setNote,
  exercises,
  maxes,
  setMaxes,
  error,
  saving,
  applying,
  formulas,
  applyCycle,
}: {
  cycle: CyclePhaseDef[];
  startDate: string;
  setStartDate: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  exercises: ExerciseWithMax[];
  maxes: Record<string, string>;
  setMaxes: Dispatch<SetStateAction<Record<string, string>>>;
  error: string | null;
  saving: boolean;
  applying: boolean;
  formulas: WorkoutFormulas | null;
  applyCycle: (
    cycle: CyclePhaseDef[],
    extra?: { auto_end?: boolean; loop?: boolean },
  ) => void | Promise<void>;
}) {
  if (cycle.length === 0) {
    return (
      <section className="card-surface flex flex-col gap-3 px-5 py-4">
        <h2 className="text-xl font-semibold">Сначала недели</h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Тренировки те же, что в программе. Недели меняют вес: проценты от «на
          раз» или килограммы на штанге.
        </p>
        <FormulaCycleTemplates
          disabled={applying || !formulas}
          onApply={(nextCycle, _name, extra) =>
            void applyCycle(nextCycle, extra)
          }
        />
      </section>
    );
  }

  return (
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

      {error ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}

      <StickyActions>
        <Button type="submit" className="h-14 text-lg" disabled={saving}>
          {saving ? "Запуск…" : "Запустить недели"}
        </Button>
      </StickyActions>
    </>
  );
}

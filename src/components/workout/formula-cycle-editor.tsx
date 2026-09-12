"use client";

import { Plus } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormulaCyclePhaseRow } from "@/components/workout/formula-cycle-phase-row";
import { FormulaCycleTemplates } from "@/components/workout/formula-cycle-templates";
import { MAX_PHASES } from "@/components/workout/formula-form";
import { SortableList } from "@/components/workout/sortable-list";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { addCyclePhase, reorderCycle } from "@/lib/workout/cycle";
import { cycleSequenceLabel } from "@/lib/workout/hints";

export function FormulaCycleEditor({
  formulas,
  kind,
  exampleMax,
  exampleStep,
  increasePercent,
  setFormulas,
  setSaved,
  applyCycleTemplate,
  clearCycle,
}: {
  formulas: WorkoutFormulas;
  kind: WorkoutKind;
  exampleMax: number;
  exampleStep: number;
  increasePercent: number;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  applyCycleTemplate: (cycle: CyclePhaseDef[], name: string) => Promise<void>;
  clearCycle: () => Promise<void>;
}) {
  const [picking, setPicking] = useState(false);
  const hasCycle = formulas.cycle.length > 0;

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div>
        <h2 className="text-xl font-semibold">Цикл</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {hasCycle
            ? `${cycleSequenceLabel(formulas.cycle)}. Тренировки те же, что в очереди — этап меняет веса.`
            : "Без цикла одна схема на все дни. Тренировки — в очереди."}
        </p>
      </div>

      {hasCycle ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Потяни номер — порядок. Новые тренировки по этой схеме. Уже начатый
            цикл не переписывается.
          </p>
          <SortableList
            variant="cards"
            items={formulas.cycle.map((phase) => ({
              ...phase,
              id: phase.key,
            }))}
            onReorder={(next) => {
              setSaved(false);
              setFormulas((current) =>
                current
                  ? reorderCycle(
                      current,
                      next.map((phase) => phase.key),
                    )
                  : current,
              );
            }}
            renderItem={(phase) => {
              const spec = formulas[kind].phases[phase.key];
              const work = spec?.work ?? formulas[kind].base.work;
              return (
                <FormulaCyclePhaseRow
                  phase={phase}
                  kind={kind}
                  work={work}
                  cycle={formulas.cycle}
                  exampleMax={exampleMax}
                  exampleStep={exampleStep}
                  increasePercent={increasePercent}
                  formulas={formulas}
                  setFormulas={setFormulas}
                  setSaved={setSaved}
                />
              );
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-12 text-base"
            disabled={formulas.cycle.length >= MAX_PHASES}
            onClick={() => {
              setSaved(false);
              setFormulas((current) =>
                current
                  ? addCyclePhase(current, `Этап ${current.cycle.length + 1}`)
                  : current,
              );
            }}
          >
            <Plus className="size-4" />
            Этап
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-base"
            onClick={() => void clearCycle()}
          >
            Убрать цикл
          </Button>
        </div>
      ) : picking ? (
        <FormulaCycleTemplates
          onApply={(cycle, name) => void applyCycleTemplate(cycle, name)}
          onCustom={() => {
            setFormulas((current) =>
              current ? addCyclePhase(current, "Этап 1") : current,
            );
            setSaved(false);
          }}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          onClick={() => setPicking(true)}
        >
          Включить цикл
        </Button>
      )}
    </section>
  );
}

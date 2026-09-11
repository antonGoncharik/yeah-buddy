"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { FormulaCyclePhaseRow } from "@/components/workout/formula-cycle-phase-row";
import { FormulaCycleTemplates } from "@/components/workout/formula-cycle-templates";
import { MAX_PHASES } from "@/components/workout/formula-form";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { addCyclePhase } from "@/lib/workout/cycle";

export function FormulaCycleEditor({
  formulas,
  kind,
  exampleMax,
  exampleStep,
  increasePercent,
  cycleOpen,
  setCycleOpen,
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
  cycleOpen: boolean;
  setCycleOpen: Dispatch<SetStateAction<boolean>>;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  applyCycleTemplate: (cycle: CyclePhaseDef[], name: string) => Promise<void>;
  clearCycle: () => Promise<void>;
}) {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setCycleOpen((open) => !open)}
      >
        <div>
          <h2 className="text-xl font-semibold">Этапы</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {formulas.cycle.length > 0
              ? formulas.cycle.map((phase) => phase.name).join(" → ")
              : "Разные недели — если надо."}
          </p>
        </div>
        {cycleOpen ? (
          <ChevronUp className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {cycleOpen ? (
        <div className="flex flex-col gap-3">
          <p className="text-base leading-relaxed text-muted-foreground">
            Текущий цикл не меняется.
          </p>
          {formulas.cycle.length === 0 ? (
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
            <>
              {formulas.cycle.map((phase, index) => {
                const spec = formulas[kind].phases[phase.key];
                const work = spec?.work ?? formulas[kind].base.work;
                return (
                  <FormulaCyclePhaseRow
                    key={phase.key}
                    phase={phase}
                    index={index}
                    cycleLength={formulas.cycle.length}
                    kind={kind}
                    work={work}
                    cycle={formulas.cycle}
                    exampleMax={exampleMax}
                    exampleStep={exampleStep}
                    increasePercent={increasePercent}
                    setFormulas={setFormulas}
                    setSaved={setSaved}
                  />
                );
              })}
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-base"
                disabled={formulas.cycle.length >= MAX_PHASES}
                onClick={() => {
                  setSaved(false);
                  setFormulas((current) =>
                    current
                      ? addCyclePhase(
                          current,
                          `Этап ${current.cycle.length + 1}`,
                        )
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
                Убрать этапы
              </Button>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

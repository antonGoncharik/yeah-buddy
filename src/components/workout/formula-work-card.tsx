"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { patchBaseWork } from "@/components/workout/formula-form";
import { FormulaSetList } from "@/components/workout/formula-set-list";
import type { WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { workSetsEqual, workSummary } from "@/lib/workout/cycle";
import {
  FORMULA_SYSTEMS,
  type FormulaSystemId,
} from "@/lib/workout/default-formulas";

export function FormulaWorkCard({
  formulas,
  kind,
  exampleMax,
  exampleStep,
  previewMax,
  setPreviewMax,
  setFormulas,
  setSaved,
  applySystem,
}: {
  formulas: WorkoutFormulas;
  kind: WorkoutKind;
  exampleMax: number;
  exampleStep: number;
  previewMax: string;
  setPreviewMax: (value: string) => void;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  applySystem: (id: FormulaSystemId) => void;
}) {
  const work = formulas[kind].base.work;
  const activeSystem = FORMULA_SYSTEMS.find((system) =>
    workSetsEqual(system.formulas[kind].base.work, work),
  );

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <h2 className="text-xl font-semibold">Рабочие подходы</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          Общая схема на день без своей. Проценты — от 1ПМ, либо в дне поставишь
          килограммы.
        </p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {workSummary(work)}
        </p>
      </div>

      {kind === "dynamic" ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {FORMULA_SYSTEMS.map((system) => {
            const active = system.id === activeSystem?.id;
            return (
              <button
                key={system.id}
                type="button"
                aria-pressed={active}
                title={system.hint}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/12 font-medium text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
                onClick={() => applySystem(system.id)}
              >
                {system.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <FormulaSetList
        sets={work}
        exampleMax={exampleMax}
        exampleStep={exampleStep}
        defaultHold={kind === "static"}
        onChange={(next) => {
          setSaved(false);
          setFormulas((current) =>
            current ? patchBaseWork(current, kind, next) : current,
          );
        }}
      />

      <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">
        <span className="min-w-0 flex-1">
          Килограммы справа — пример при 1ПМ
        </span>
        <Input
          inputMode="decimal"
          value={previewMax}
          onChange={(event) => setPreviewMax(event.target.value)}
          className="h-10 w-16 px-2 text-center text-sm tabular-nums"
          aria-label="Пример 1ПМ, кг"
        />
        <span>кг</span>
      </div>
    </section>
  );
}

"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

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
  const [customOpen, setCustomOpen] = useState(false);
  const showEditor = kind !== "dynamic" || activeSystem == null || customOpen;

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <h2 className="text-xl font-semibold">Рабочие подходы</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          Если в упражнении нет своих — будут эти.
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
                onClick={() => {
                  setCustomOpen(false);
                  applySystem(system.id);
                }}
              >
                {system.name}
              </button>
            );
          })}
        </div>
      ) : null}

      {showEditor ? (
        <FormulaSetList
          sets={work}
          exampleMax={exampleMax}
          exampleStep={exampleStep}
          defaultHold={kind === "static"}
          previewMax={previewMax}
          onPreviewMaxChange={setPreviewMax}
          onChange={(next) => {
            setSaved(false);
            setFormulas((current) =>
              current ? patchBaseWork(current, kind, next) : current,
            );
          }}
        />
      ) : (
        <button
          type="button"
          className="self-start py-1 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setCustomOpen(true)}
        >
          Настроить самому
        </button>
      )}
    </section>
  );
}

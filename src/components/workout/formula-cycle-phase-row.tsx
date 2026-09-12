"use client";

import { type Dispatch, type SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  patchPhaseWork,
  phaseWorkHint,
} from "@/components/workout/formula-form";
import { SetCard, ToggleChip } from "@/components/workout/formula-set-card";
import type {
  CyclePhaseDef,
  FormulaSetSpec,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import {
  patchCyclePhase,
  phaseHasCustomWork,
  phaseSchemeHint,
  removeCyclePhase,
  resetPhaseWork,
} from "@/lib/workout/cycle";
import { previewMaxForPhase } from "@/lib/workout/formulas";

export function FormulaCyclePhaseRow({
  phase,
  kind,
  work,
  cycle,
  exampleMax,
  exampleStep,
  increasePercent,
  formulas,
  setFormulas,
  setSaved,
}: {
  phase: CyclePhaseDef;
  kind: WorkoutKind;
  work: FormulaSetSpec[];
  cycle: CyclePhaseDef[];
  exampleMax: number;
  exampleStep: number;
  increasePercent: number;
  formulas: WorkoutFormulas;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const custom = phaseHasCustomWork(formulas, kind, phase);
  const [editing, setEditing] = useState(false);
  const showSets = custom || editing;
  const phaseMax = previewMaxForPhase(
    cycle,
    phase.key,
    exampleMax,
    increasePercent,
    exampleStep,
  );

  function markDirty() {
    setSaved(false);
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-border/70 px-4 py-3">
      <div className="flex items-center gap-2">
        <Input
          value={phase.name}
          onChange={(event) => {
            markDirty();
            setFormulas((current) =>
              current
                ? patchCyclePhase(current, phase.key, {
                    name: event.target.value.slice(0, 40),
                  })
                : current,
            );
          }}
          className="h-12 flex-1 text-base"
          aria-label="Название этапа"
        />
        <RemoveRowButton
          label={`Убрать этап ${phase.name}`}
          onClick={() => {
            markDirty();
            setFormulas((current) =>
              current ? removeCyclePhase(current, phase.key) : current,
            );
          }}
        />
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {phaseSchemeHint(phase, custom, work)}
      </p>
      <div className="flex flex-wrap gap-2">
        <ToggleChip
          on={phase.skip_warmup}
          label="Без разминки"
          onClick={() => {
            markDirty();
            setFormulas((current) =>
              current
                ? patchCyclePhase(current, phase.key, {
                    skip_warmup: !phase.skip_warmup,
                  })
                : current,
            );
          }}
        />
        <ToggleChip
          on={phase.increase_on_end}
          label="Поднять веса в конце"
          onClick={() => {
            markDirty();
            setFormulas((current) =>
              current
                ? patchCyclePhase(current, phase.key, {
                    increase_on_end: !phase.increase_on_end,
                  })
                : current,
            );
          }}
        />
      </div>
      {showSets ? (
        <>
          <SetCard
            title={phase.name}
            hint={phaseWorkHint(phase, exampleMax, phaseMax)}
            defaultHold={kind === "static"}
            sets={work}
            exampleMax={phaseMax}
            exampleStep={exampleStep}
            onChange={(nextWork) => {
              markDirty();
              setFormulas((current) =>
                current
                  ? patchPhaseWork(current, kind, phase.key, nextWork)
                  : current,
              );
            }}
          />
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-base"
            onClick={() => {
              markDirty();
              setEditing(false);
              setFormulas((current) =>
                current ? resetPhaseWork(current, kind, phase.key) : current,
              );
            }}
          >
            Как в рабочих
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="h-11 text-base"
          onClick={() => setEditing(true)}
        >
          Свои подходы
        </Button>
      )}
    </div>
  );
}

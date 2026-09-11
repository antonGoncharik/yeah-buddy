"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

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
  moveCyclePhase,
  patchCyclePhase,
  removeCyclePhase,
} from "@/lib/workout/cycle";
import { previewMaxForPhase } from "@/lib/workout/formulas";

export function FormulaCyclePhaseRow({
  phase,
  index,
  cycleLength,
  kind,
  work,
  cycle,
  exampleMax,
  exampleStep,
  increasePercent,
  setFormulas,
  setSaved,
}: {
  phase: CyclePhaseDef;
  index: number;
  cycleLength: number;
  kind: WorkoutKind;
  work: FormulaSetSpec[];
  cycle: CyclePhaseDef[];
  exampleMax: number;
  exampleStep: number;
  increasePercent: number;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const phaseMax = previewMaxForPhase(
    cycle,
    phase.key,
    exampleMax,
    increasePercent,
    exampleStep,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          value={phase.name}
          onChange={(event) => {
            setSaved(false);
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
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-12 p-0"
          disabled={index === 0}
          aria-label="Выше"
          onClick={() => {
            setSaved(false);
            setFormulas((current) =>
              current ? moveCyclePhase(current, phase.key, -1) : current,
            );
          }}
        >
          <ChevronUp className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-12 p-0"
          disabled={index === cycleLength - 1}
          aria-label="Ниже"
          onClick={() => {
            setSaved(false);
            setFormulas((current) =>
              current ? moveCyclePhase(current, phase.key, 1) : current,
            );
          }}
        >
          <ChevronDown className="size-5" />
        </Button>
        <RemoveRowButton
          label={`Убрать этап ${phase.name}`}
          onClick={() => {
            setSaved(false);
            setFormulas((current) =>
              current ? removeCyclePhase(current, phase.key) : current,
            );
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <ToggleChip
          on={phase.skip_warmup}
          label="Без разминки"
          onClick={() => {
            setSaved(false);
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
            setSaved(false);
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
      <SetCard
        title={phase.name}
        hint={phaseWorkHint(phase, exampleMax, phaseMax)}
        defaultHold={kind === "static"}
        sets={work}
        exampleMax={phaseMax}
        exampleStep={exampleStep}
        onChange={(nextWork) => {
          setSaved(false);
          setFormulas((current) =>
            current
              ? patchPhaseWork(current, kind, phase.key, nextWork)
              : current,
          );
        }}
      />
    </div>
  );
}

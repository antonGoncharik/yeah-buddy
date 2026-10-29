"use client";

import { ChevronDown } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";

import { FormulaCyclePhaseRowEditor } from "@/components/workout/formula-cycle-phase-row-editor";
import { haptic } from "@/lib/telegram/haptic";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { phaseHasCustomWork, phaseSchemeHint } from "@/lib/workout/cycle";
import { formatWeight } from "@/lib/workout/numbers";
import { maxShownForPhase } from "@/lib/workout/test-raise";

/** One phase of the cycle. Collapsed: name + how the weight is derived. Expanded: editing. */
export function FormulaCyclePhaseRow({
  phase,
  kind,
  open,
  onToggle,
  exampleMax,
  exampleStep,
  formulas,
  setFormulas,
  setSaved,
}: {
  phase: CyclePhaseDef;
  kind: WorkoutKind;
  open: boolean;
  onToggle: () => void;
  exampleMax: number;
  exampleStep: number;
  formulas: WorkoutFormulas;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const work =
    formulas[kind].phases[phase.key]?.work ?? formulas[kind].base.work;
  const [editing, setEditing] = useState(false);
  const custom = editing || phaseHasCustomWork(formulas, kind, phase);
  const phaseMax = maxShownForPhase({
    formulas,
    kind,
    phaseKey: phase.key,
    maxKg: exampleMax,
    stepKg: exampleStep,
  });
  const tags = [
    phase.skip_warmup ? "без разминки" : null,
    phase.increase_on_end ? "в конце максимум по тесту" : null,
    phase.kg_increase_on_end
      ? `в конце +${formatWeight(phase.kg_increase_on_end)} кг`
      : null,
  ].filter(Boolean);

  return (
    <div className="flex w-full min-w-0 flex-col rounded-2xl border border-border/70">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => {
          haptic("tap");
          onToggle();
        }}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-medium">
            {phase.name.trim() || "Без названия"}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">
            {phaseSchemeHint(phase, custom, work)}
            {tags.length > 0 ? ` · ${tags.join(", ")}` : ""}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <FormulaCyclePhaseRowEditor
          phase={phase}
          kind={kind}
          work={work}
          custom={custom}
          setEditing={setEditing}
          phaseMax={phaseMax}
          exampleMax={exampleMax}
          exampleStep={exampleStep}
          setFormulas={setFormulas}
          setSaved={setSaved}
        />
      ) : null}
    </div>
  );
}

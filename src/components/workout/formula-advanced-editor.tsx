"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { FormulaCycleEditor } from "@/components/workout/formula-cycle-editor";
import { patchBaseWork, patchWarmup } from "@/components/workout/formula-form";
import { SetCard } from "@/components/workout/formula-set-card";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import {
  FORMULA_PRESET_LABELS,
  WARMUP_PRESET_IDS,
  WEIGHT_STEP_OPTIONS,
  WORKOUT_KIND_LABELS,
} from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export function FormulaAdvancedEditor({
  formulas,
  kind,
  exampleMax,
  exampleStep,
  increasePercent,
  cycleOpen,
  previewMax,
  raisedExample,
  showsIncrease,
  setKind,
  setPreviewMax,
  setPreviewStep,
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
  previewMax: { dynamic: string; static: string };
  raisedExample: number;
  showsIncrease: boolean;
  setKind: Dispatch<SetStateAction<WorkoutKind>>;
  setPreviewMax: Dispatch<SetStateAction<{ dynamic: string; static: string }>>;
  setPreviewStep: Dispatch<SetStateAction<{ dynamic: number; static: number }>>;
  setCycleOpen: Dispatch<SetStateAction<boolean>>;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  applyCycleTemplate: (cycle: CyclePhaseDef[], name: string) => Promise<void>;
  clearCycle: () => Promise<void>;
}) {
  return (
    <>
      <Segmented
        value={kind}
        options={[
          { id: "dynamic", label: WORKOUT_KIND_LABELS.dynamic },
          { id: "static", label: WORKOUT_KIND_LABELS.static },
        ]}
        onChange={setKind}
      />

      <section className="card-surface flex flex-col gap-3 px-5 py-4">
        <h2 className="text-lg font-semibold">Пример веса</h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Справа килограммы, если подставить вес. В дневник не пишется.
          {raisedExample > 0 && raisedExample !== exampleMax && showsIncrease
            ? ` После плюса — от ${formatWeight(raisedExample)} кг.`
            : ""}
        </p>
        <div className="flex items-center gap-2">
          <Input
            inputMode="decimal"
            value={previewMax[kind]}
            onChange={(event) =>
              setPreviewMax((current) => ({
                ...current,
                [kind]: event.target.value,
              }))
            }
            className="h-12 flex-1 text-base"
            aria-label="Пример рабочего веса"
          />
          <span className="text-base text-muted-foreground">кг</span>
        </div>
        <Segmented
          value={String(exampleStep)}
          options={WEIGHT_STEP_OPTIONS.map((step) => ({
            id: String(step),
            label: `${step}`,
          }))}
          onChange={(step) =>
            setPreviewStep((current) => ({
              ...current,
              [kind]: Number(step),
            }))
          }
        />
      </section>

      <p className="px-1 text-base leading-relaxed text-muted-foreground">
        {kind === "dynamic"
          ? "Разминка — штанга или блок, как в упражнении. Повторы можно сменить на секунды."
          : "Разминка обычно в повторах, рабочие — в секундах. Можно наоборот."}
      </p>
      {WARMUP_PRESET_IDS.map((preset) => (
        <SetCard
          key={preset}
          title={FORMULA_PRESET_LABELS[preset]}
          hint="Разминка"
          defaultHold={false}
          sets={formulas.warmups[kind][preset]}
          exampleMax={exampleMax}
          exampleStep={exampleStep}
          allowEmpty
          onChange={(sets) => {
            setSaved(false);
            setFormulas((current) =>
              current ? patchWarmup(current, kind, preset, sets) : current,
            );
          }}
        />
      ))}
      <SetCard
        title="Рабочие"
        hint={formulas.cycle.length > 0 ? "Без цикла" : "От рабочего веса"}
        defaultHold={kind === "static"}
        sets={formulas[kind].base.work}
        exampleMax={exampleMax}
        exampleStep={exampleStep}
        onChange={(work) => {
          setSaved(false);
          setFormulas((current) =>
            current ? patchBaseWork(current, kind, work) : current,
          );
        }}
      />

      <FormulaCycleEditor
        formulas={formulas}
        kind={kind}
        exampleMax={exampleMax}
        exampleStep={exampleStep}
        increasePercent={increasePercent}
        cycleOpen={cycleOpen}
        setCycleOpen={setCycleOpen}
        setFormulas={setFormulas}
        setSaved={setSaved}
        applyCycleTemplate={applyCycleTemplate}
        clearCycle={clearCycle}
      />
    </>
  );
}

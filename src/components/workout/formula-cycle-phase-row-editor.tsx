"use client";

import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { FormulaCyclePhaseToggle } from "@/components/workout/formula-cycle-phase-toggle";
import { patchPhaseWork } from "@/components/workout/formula-form";
import { FormulaSetList } from "@/components/workout/formula-set-list";
import type {
  CyclePhaseDef,
  FormulaSetSpec,
  WorkoutFormulas,
  WorkoutKind,
} from "@/lib/types";
import {
  patchCyclePhase,
  phaseSchemeHint,
  removeCyclePhase,
  resetPhaseWork,
} from "@/lib/workout/cycle";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function FormulaCyclePhaseRowEditor({
  phase,
  kind,
  work,
  custom,
  setEditing,
  phaseMax,
  exampleMax,
  exampleStep,
  setFormulas,
  setSaved,
}: {
  phase: CyclePhaseDef;
  kind: WorkoutKind;
  work: FormulaSetSpec[];
  custom: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  phaseMax: number;
  exampleMax: number;
  exampleStep: number;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const confirm = useConfirm();

  function patch(next: Partial<Omit<CyclePhaseDef, "key">>) {
    setSaved(false);
    setFormulas((current) =>
      current ? patchCyclePhase(current, phase.key, next) : current,
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-4">
      <Input
        value={phase.name}
        onChange={(event) => patch({ name: event.target.value.slice(0, 40) })}
        className="h-12 text-base"
        aria-label="Название этапа"
        placeholder="Название этапа"
      />

      <div className="flex flex-col gap-2">
        <FormulaCyclePhaseToggle
          on={phase.skip_warmup}
          label="Без разминки"
          hint="Лёгкий этап: сразу рабочие подходы"
          onClick={() => patch({ skip_warmup: !phase.skip_warmup })}
        />
        <FormulaCyclePhaseToggle
          on={phase.increase_on_end}
          label="В конце поднять максимум"
          hint="Новый максимум по самому тяжёлому рабочему подходу"
          onClick={() => patch({ increase_on_end: !phase.increase_on_end })}
        />
        <FormulaCyclePhaseToggle
          on={(phase.kg_increase_on_end ?? 0) > 0}
          label="В конце прибавить кг"
          hint="Рабочий вес в кг, когда этап закроется"
          onClick={() =>
            patch({
              kg_increase_on_end:
                (phase.kg_increase_on_end ?? 0) > 0 ? undefined : 2.5,
            })
          }
        />
        {(phase.kg_increase_on_end ?? 0) > 0 ? (
          <Input
            inputMode="decimal"
            value={formatWeight(phase.kg_increase_on_end ?? 2.5)}
            onChange={(event) => {
              const kg = parseDecimal(event.target.value);
              if (kg != null && kg > 0) {
                patch({ kg_increase_on_end: kg });
              }
            }}
            className="h-12 text-base"
            aria-label="Сколько кг прибавить"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-medium">Подходы</p>
          {exampleMax > 0 && phaseMax !== exampleMax ? (
            <p className="text-sm text-muted-foreground">
              пример от {formatWeight(phaseMax)} кг
            </p>
          ) : null}
        </div>
        <Segmented
          value={custom ? "custom" : "auto"}
          options={[
            { id: "auto", label: "Как в плане" },
            { id: "custom", label: "Свои" },
          ]}
          onChange={(mode) => {
            setSaved(false);
            if (mode === "auto") {
              setEditing(false);
              setFormulas((current) =>
                current ? resetPhaseWork(current, kind, phase.key) : current,
              );
              return;
            }
            setEditing(true);
            setFormulas((current) =>
              current
                ? patchPhaseWork(
                    current,
                    kind,
                    phase.key,
                    work.map((set) => ({ ...set })),
                  )
                : current,
            );
          }}
        />
        {custom ? (
          <FormulaSetList
            sets={work}
            exampleMax={phaseMax}
            exampleStep={exampleStep}
            defaultHold={kind === "static"}
            onChange={(next) => {
              setSaved(false);
              setFormulas((current) =>
                current
                  ? patchPhaseWork(current, kind, phase.key, next)
                  : current,
              );
            }}
          />
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {phaseSchemeHint(phase, false, work)}. Меняются вместе с общим
            планом подходов.
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="h-11 text-base text-destructive"
        onClick={() => {
          void confirm({
            message: `Убрать этап «${phase.name}»? Если у упражнений в днях были свои подходы на этот этап, они перестанут работать.`,
            confirmLabel: "Убрать",
            cancelLabel: "Оставить",
            destructive: true,
          }).then((ok) => {
            if (!ok) {
              return;
            }
            setSaved(false);
            setFormulas((current) =>
              current ? removeCyclePhase(current, phase.key) : current,
            );
          });
        }}
      >
        Убрать этап
      </Button>
    </div>
  );
}

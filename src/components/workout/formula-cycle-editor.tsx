"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import {
  MAX_PHASES,
  patchPhaseWork,
  phaseWorkHint,
} from "@/components/workout/formula-form";
import { SetCard, ToggleChip } from "@/components/workout/formula-set-card";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import {
  addCyclePhase,
  moveCyclePhase,
  patchCyclePhase,
  removeCyclePhase,
} from "@/lib/workout/cycle";
import { CYCLE_TEMPLATES } from "@/lib/workout/default-formulas";
import { previewMaxForPhase } from "@/lib/workout/formulas";

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
            <>
              {CYCLE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  onClick={() =>
                    void applyCycleTemplate(template.cycle, template.name)
                  }
                >
                  <p className="text-base font-medium">{template.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {template.hint}
                  </p>
                </button>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-base"
                onClick={() => {
                  setFormulas((current) =>
                    current ? addCyclePhase(current, "Этап 1") : current,
                  );
                  setSaved(false);
                }}
              >
                Свой цикл
              </Button>
            </>
          ) : (
            <>
              {formulas.cycle.map((phase, index) => {
                const spec = formulas[kind].phases[phase.key];
                const work = spec?.work ?? formulas[kind].base.work;
                const phaseMax = previewMaxForPhase(
                  formulas.cycle,
                  phase.key,
                  exampleMax,
                  increasePercent,
                  exampleStep,
                );
                return (
                  <div key={phase.key} className="flex flex-col gap-3">
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
                            current
                              ? moveCyclePhase(current, phase.key, -1)
                              : current,
                          );
                        }}
                      >
                        <ChevronUp className="size-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-12 w-12 p-0"
                        disabled={index === formulas.cycle.length - 1}
                        aria-label="Ниже"
                        onClick={() => {
                          setSaved(false);
                          setFormulas((current) =>
                            current
                              ? moveCyclePhase(current, phase.key, 1)
                              : current,
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
                            current
                              ? removeCyclePhase(current, phase.key)
                              : current,
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

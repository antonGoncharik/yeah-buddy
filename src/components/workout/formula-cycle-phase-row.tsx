"use client";

import { ChevronDown } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { patchPhaseWork } from "@/components/workout/formula-form";
import { FormulaSetList } from "@/components/workout/formula-set-list";
import { haptic } from "@/lib/telegram/haptic";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  patchCyclePhase,
  phaseHasCustomWork,
  phaseSchemeHint,
  removeCyclePhase,
  resetPhaseWork,
} from "@/lib/workout/cycle";
import { previewMaxForPhase } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

/** One phase of the cycle. Collapsed: name + how the weight is derived. Expanded: editing. */
export function FormulaCyclePhaseRow({
  phase,
  kind,
  open,
  onToggle,
  exampleMax,
  exampleStep,
  increasePercent,
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
  increasePercent: number;
  formulas: WorkoutFormulas;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
}) {
  const confirm = useConfirm();
  const work =
    formulas[kind].phases[phase.key]?.work ?? formulas[kind].base.work;
  // «Свои» right after tapping equals the derived sets, so remember the choice.
  const [editing, setEditing] = useState(false);
  const custom = editing || phaseHasCustomWork(formulas, kind, phase);
  const phaseMax = previewMaxForPhase(
    formulas.cycle,
    phase.key,
    exampleMax,
    increasePercent,
    exampleStep,
  );
  const tags = [
    phase.skip_warmup ? "без разминки" : null,
    phase.increase_on_end ? "в конце поднять максимум" : null,
    phase.kg_increase_on_end
      ? `в конце +${formatWeight(phase.kg_increase_on_end)} кг`
      : null,
  ].filter(Boolean);

  function patch(next: Partial<Omit<CyclePhaseDef, "key">>) {
    setSaved(false);
    setFormulas((current) =>
      current ? patchCyclePhase(current, phase.key, next) : current,
    );
  }

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
        <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-4">
          <Input
            value={phase.name}
            onChange={(event) =>
              patch({ name: event.target.value.slice(0, 40) })
            }
            className="h-12 text-base"
            aria-label="Название этапа"
            placeholder="Название этапа"
          />

          <div className="flex flex-col gap-2">
            <Toggle
              on={phase.skip_warmup}
              label="Без разминки"
              hint="Лёгкий этап: сразу рабочие подходы"
              onClick={() => patch({ skip_warmup: !phase.skip_warmup })}
            />
            <Toggle
              on={phase.increase_on_end}
              label="В конце поднять максимум"
              hint="На шаг вверх, когда этап закрывается"
              onClick={() => patch({ increase_on_end: !phase.increase_on_end })}
            />
            <Toggle
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
                    current
                      ? resetPhaseWork(current, kind, phase.key)
                      : current,
                  );
                  return;
                }
                // Copy the derived sets so the user edits from what they see.
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
      ) : null}
    </div>
  );
}

function Toggle({
  on,
  label,
  hint,
  onClick,
}: {
  on: boolean;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-left"
      onClick={() => {
        haptic("tap");
        onClick();
      }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
            on ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

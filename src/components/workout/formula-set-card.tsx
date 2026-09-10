"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { MAX_SETS } from "@/components/workout/formula-form";
import type { FormulaSetSpec } from "@/lib/types";
import { cn } from "@/lib/utils";
import { calcPlannedWeight, setUsesHold } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function ToggleChip({
  on,
  label,
  onClick,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-3 py-2 text-sm",
        on
          ? "bg-primary/12 font-medium text-primary"
          : "bg-muted text-muted-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function SetCard({
  title,
  hint,
  defaultHold,
  sets,
  exampleMax,
  exampleStep,
  allowEmpty = false,
  onChange,
}: {
  title: string;
  hint: string;
  defaultHold: boolean;
  sets: FormulaSetSpec[];
  exampleMax: number;
  exampleStep: number;
  allowEmpty?: boolean;
  onChange: (sets: FormulaSetSpec[]) => void;
}) {
  function updateAt(index: number, patch: Partial<FormulaSetSpec>) {
    onChange(
      sets.map((set, setIndex) =>
        setIndex === index ? { ...set, ...patch } : set,
      ),
    );
  }

  function addSet() {
    if (sets.length >= MAX_SETS) {
      return;
    }
    const last = sets[sets.length - 1];
    onChange([
      ...sets,
      last
        ? { ...last }
        : defaultHold
          ? { percent: 100, reps: null, seconds: 6 }
          : { percent: 80, reps: 5, seconds: null },
    ]);
  }

  function removeAt(index: number) {
    if (!allowEmpty && sets.length <= 1) {
      return;
    }
    onChange(sets.filter((_, setIndex) => setIndex !== index));
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      {sets.length === 0 ? (
        <p className="text-base text-muted-foreground">Пусто</p>
      ) : null}

      {/* Sets have no stable id; the list is short and not reordered by drag. */}
      {sets.map((set, index) => {
        const hold = setUsesHold(set);
        const count = hold ? set.seconds : set.reps;
        const weight =
          exampleMax > 0
            ? calcPlannedWeight(exampleMax, set.percent, exampleStep)
            : null;
        const canRemove = allowEmpty || sets.length > 1;

        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: identical work sets share values
            key={index}
            className="flex flex-col gap-2 rounded-xl bg-muted/50 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Подход {index + 1}
              </p>
              <RemoveRowButton
                label={`Убрать подход ${index + 1}`}
                disabled={!canRemove}
                onClick={() => removeAt(index)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                inputMode="decimal"
                value={String(set.percent)}
                onChange={(event) => {
                  const percent = parseDecimal(event.target.value);
                  if (percent == null || percent < 0) {
                    return;
                  }
                  updateAt(index, { percent });
                }}
                className="h-12 w-20 text-base"
                aria-label={`Процент, подход ${index + 1}`}
              />
              <span className="text-base text-muted-foreground">%</span>
              <span className="text-base text-muted-foreground">×</span>
              <Input
                inputMode={hold ? "decimal" : "numeric"}
                value={count == null ? "" : String(count)}
                onChange={(event) => {
                  const next = parseDecimal(event.target.value);
                  if (next == null || next <= 0) {
                    return;
                  }
                  if (hold) {
                    updateAt(index, { seconds: next, reps: null });
                    return;
                  }
                  if (!Number.isInteger(next)) {
                    return;
                  }
                  updateAt(index, { reps: next, seconds: null });
                }}
                className="h-12 w-20 text-base"
                aria-label={
                  hold
                    ? `Секунды, подход ${index + 1}`
                    : `Повторы, подход ${index + 1}`
                }
              />
              <div className="flex rounded-xl bg-background p-1">
                <button
                  type="button"
                  className={cn(
                    "h-10 rounded-lg px-3 text-sm",
                    hold
                      ? "text-muted-foreground"
                      : "bg-muted font-medium text-foreground",
                  )}
                  onClick={() => {
                    const next = set.seconds ?? set.reps ?? 5;
                    updateAt(index, {
                      reps: Number.isInteger(next) ? next : Math.round(next),
                      seconds: null,
                    });
                  }}
                >
                  повт
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-10 rounded-lg px-3 text-sm",
                    hold
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                  onClick={() => {
                    updateAt(index, {
                      seconds: set.seconds ?? set.reps ?? 2,
                      reps: null,
                    });
                  }}
                >
                  сек
                </button>
              </div>
              <p className="min-w-0 flex-1 text-right text-base font-medium tabular-nums">
                {weight == null ? "—" : `${formatWeight(weight)} кг`}
              </p>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        className="h-12 text-base"
        disabled={sets.length >= MAX_SETS}
        onClick={addSet}
      >
        <Plus className="size-4" />
        Подход
      </Button>
    </section>
  );
}

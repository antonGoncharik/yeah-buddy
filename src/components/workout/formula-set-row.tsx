"use client";

import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import type { FormulaSetSpec } from "@/lib/types";
import { cn } from "@/lib/utils";
import { calcPlannedWeight, setUsesHold } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function FormulaSetRow({
  index,
  set,
  exampleMax,
  exampleStep,
  canRemove,
  onUpdate,
  onRemove,
}: {
  index: number;
  set: FormulaSetSpec;
  exampleMax: number;
  exampleStep: number;
  canRemove: boolean;
  onUpdate: (patch: Partial<FormulaSetSpec>) => void;
  onRemove: () => void;
}) {
  const hold = setUsesHold(set);
  const count = hold ? set.seconds : set.reps;
  const weight =
    exampleMax > 0
      ? calcPlannedWeight(exampleMax, set.percent, exampleStep)
      : null;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/50 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          Подход {index + 1}
        </p>
        <RemoveRowButton
          label={`Убрать подход ${index + 1}`}
          disabled={!canRemove}
          onClick={onRemove}
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
            onUpdate({ percent });
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
              onUpdate({ seconds: next, reps: null });
              return;
            }
            if (!Number.isInteger(next)) {
              return;
            }
            onUpdate({ reps: next, seconds: null });
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
              onUpdate({
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
              onUpdate({
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
}

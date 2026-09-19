"use client";

import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { haptic } from "@/lib/telegram/haptic";
import type { FormulaSetSpec } from "@/lib/types";
import { calcPlannedWeight, setUsesHold } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

/** One set: percent × reps/seconds, example kg underneath, X always on the right. */
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
    <div
      className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5"
      data-field-group
    >
      <div className="flex min-w-0 items-center gap-1">
        <Input
          inputMode="decimal"
          enterKeyHint="next"
          value={String(set.percent)}
          onChange={(event) => {
            const percent = parseDecimal(event.target.value);
            if (percent == null || percent < 0) {
              return;
            }
            onUpdate({ percent });
          }}
          onKeyDown={handleNumericEnter}
          className="h-11 w-14 shrink-0 px-2 text-center text-base tabular-nums"
          aria-label={`Процент, подход ${index + 1}`}
        />
        <span className="shrink-0 text-sm text-muted-foreground">%</span>
        <span className="shrink-0 px-0.5 text-sm text-muted-foreground">×</span>
        <Input
          inputMode={hold ? "decimal" : "numeric"}
          enterKeyHint="done"
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
          onKeyDown={handleNumericEnter}
          className="h-11 w-14 shrink-0 px-2 text-center text-base tabular-nums"
          aria-label={
            hold
              ? `Секунды, подход ${index + 1}`
              : `Повторы, подход ${index + 1}`
          }
        />
        <button
          type="button"
          className="h-11 shrink-0 rounded-lg px-1 text-sm text-muted-foreground underline decoration-dotted underline-offset-4"
          aria-label={
            hold
              ? "Секунды. Переключить на повторы"
              : "Повторы. Переключить на секунды"
          }
          onClick={() => {
            haptic("tap");
            if (hold) {
              const next = set.seconds ?? 5;
              onUpdate({ reps: Math.max(1, Math.round(next)), seconds: null });
            } else {
              onUpdate({ seconds: set.reps ?? 2, reps: null });
            }
          }}
        >
          {hold ? "сек" : "повт"}
        </button>
        <button
          type="button"
          className="-mr-1 ml-auto flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
          aria-label={`Убрать подход ${index + 1}`}
          disabled={!canRemove}
          onClick={onRemove}
        >
          <X className="size-5" />
        </button>
      </div>
      {weight == null ? null : (
        <p className="text-sm tabular-nums text-muted-foreground">
          {formatWeight(weight)} кг
        </p>
      )}
    </div>
  );
}

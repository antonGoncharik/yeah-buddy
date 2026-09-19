"use client";

import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { haptic } from "@/lib/telegram/haptic";
import type { FormulaSetSpec } from "@/lib/types";
import { calcPlannedWeight, setUsesHold } from "@/lib/workout/formulas";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

/** One line: `80 % × 5 повт · 80 кг ×`. Tap the unit to switch reps ↔ seconds. */
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
    <div className="flex items-center gap-1 py-1.5" data-field-group>
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
        className="h-11 w-14 px-2 text-center text-base tabular-nums"
        aria-label={`Процент, подход ${index + 1}`}
      />
      <span className="text-sm text-muted-foreground">%</span>
      <span className="px-1 text-sm text-muted-foreground">×</span>
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
        className="h-11 w-14 px-2 text-center text-base tabular-nums"
        aria-label={
          hold ? `Секунды, подход ${index + 1}` : `Повторы, подход ${index + 1}`
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
      <p className="min-w-14 shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">
        {weight == null ? "" : `${formatWeight(weight)} кг`}
      </p>
      <button
        type="button"
        className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
        aria-label={`Убрать подход ${index + 1}`}
        disabled={!canRemove}
        onClick={onRemove}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

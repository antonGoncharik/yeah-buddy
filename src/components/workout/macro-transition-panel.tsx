"use client";

import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TransitionPreview } from "@/lib/types";
import { transitionExplain } from "@/lib/workout/hints";
import { phaseLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export function MacroTransitionPanel({
  preview,
  transitionDate,
  transitionMaxes,
  transitioning,
  onDateChange,
  onMaxChange,
  onConfirm,
  onCancel,
}: {
  preview: TransitionPreview;
  transitionDate: string;
  transitionMaxes: Record<string, string>;
  transitioning: boolean;
  onDateChange: (value: string) => void;
  onMaxChange: (exerciseId: string, value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-5">
      <h2 className="text-xl font-semibold">
        {preview.new_macro
          ? "Новый цикл"
          : `Дальше: ${preview.to_name ?? (preview.to_phase ? phaseLabel(preview.to_phase) : "")}`}
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {transitionExplain(preview)}
      </p>
      <Input
        type="date"
        value={transitionDate}
        onChange={(event) => onDateChange(event.target.value)}
        className="h-12 text-base"
      />
      {preview.maxes.map((row) => (
        <div key={row.exercise_id} className="flex flex-col gap-1">
          <p className="text-base font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">
            сейчас {formatWeight(row.current_weight)} → будет{" "}
            {formatWeight(row.proposed_weight)}
          </p>
          <Input
            inputMode="decimal"
            value={transitionMaxes[row.exercise_id] ?? ""}
            onChange={(event) =>
              onMaxChange(row.exercise_id, event.target.value)
            }
            className="h-12 text-base"
          />
        </div>
      ))}
      <StickyActions>
        <Button
          type="button"
          className="h-14 text-lg"
          disabled={transitioning}
          onClick={onConfirm}
        >
          {transitioning ? "Сохранение…" : "Подтвердить"}
        </Button>
      </StickyActions>
      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        disabled={transitioning}
        onClick={onCancel}
      >
        Отмена
      </Button>
    </section>
  );
}

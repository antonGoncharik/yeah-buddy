"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CurrentMacroState } from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";

export function MacroPhaseMaxes({
  maxes,
  drafts,
  savingId,
  onDraftChange,
  onSave,
}: {
  maxes: CurrentMacroState["maxes"];
  drafts: Record<string, string>;
  savingId: string | null;
  onDraftChange: (exerciseId: string, value: string) => void;
  onSave: (exerciseId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Веса этого этапа</h2>
      <p className="text-sm text-muted-foreground">
        От этих цифр считается план. Только упражнения, которые делаешь.
        Остальные — «Не делаю» в списке упражнений.
      </p>
      {maxes.map((row) => (
        <div
          key={row.exercise.id}
          className="card-surface flex flex-col gap-3 px-5 py-4"
        >
          <p className="text-lg font-medium">
            {row.exercise.short_name || row.exercise.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Рекорд{" "}
            {row.exercise.current_max
              ? `${formatWeight(row.exercise.current_max.max_weight)} кг`
              : "—"}
          </p>
          <div className="flex gap-2">
            <Input
              inputMode="decimal"
              value={drafts[row.exercise.id] ?? ""}
              onChange={(event) =>
                onDraftChange(row.exercise.id, event.target.value)
              }
              className="h-12 text-base"
            />
            <Button
              type="button"
              className="h-12 px-4 text-base"
              disabled={savingId === row.exercise.id}
              onClick={() => onSave(row.exercise.id)}
            >
              {savingId === row.exercise.id ? "…" : "Сохранить"}
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}

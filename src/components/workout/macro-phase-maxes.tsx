"use client";

import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import type { CurrentMacroState } from "@/lib/types";

export function MacroPhaseMaxes({
  maxes,
  drafts,
  forward,
  onDraftChange,
  onForwardChange,
}: {
  maxes: CurrentMacroState["maxes"];
  drafts: Record<string, string>;
  /** Next week's max, when it will differ. */
  forward: Record<string, string | null>;
  onDraftChange: (exerciseId: string, value: string) => void;
  onForwardChange: (exerciseId: string, value: string) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Максимум</h2>
      {maxes.map((row) => {
        const name = row.exercise.short_name || row.exercise.name;
        const next = forward[row.exercise.id];
        return (
          <div
            key={row.exercise.id}
            className="card-surface flex flex-col gap-2 px-5 py-4"
          >
            <p className="text-lg font-medium">{name}</p>
            <Input
              inputMode="decimal"
              enterKeyHint={next == null ? "done" : "next"}
              value={drafts[row.exercise.id] ?? ""}
              aria-label={`Максимум, ${name}`}
              onChange={(event) =>
                onDraftChange(row.exercise.id, event.target.value)
              }
              onKeyDown={handleNumericEnter}
              className="h-12 text-lg"
            />
            {next == null ? null : (
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-sm text-muted-foreground">
                  дальше
                </span>
                <Input
                  inputMode="decimal"
                  enterKeyHint="done"
                  value={next}
                  aria-label={`Дальше, ${name}`}
                  onChange={(event) =>
                    onForwardChange(row.exercise.id, event.target.value)
                  }
                  onKeyDown={handleNumericEnter}
                  className="h-12 text-lg"
                />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function MacroPhaseMaxes({
  nextTitle,
  rows,
  drafts,
  onDraftChange,
}: {
  nextTitle: string;
  rows: Array<{
    exerciseId: string;
    name: string;
    current: number;
    proposed: number;
    note: string;
  }>;
  drafts: Record<string, string>;
  onDraftChange: (exerciseId: string, value: string) => void;
}) {
  const grown = rows.filter((row) => {
    const next = parseDecimal(drafts[row.exerciseId] ?? "");
    const value = next ?? row.proposed;
    return value > row.current + 0.049;
  }).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Дальше {nextTitle}</h2>
        <p className="text-base text-muted-foreground">
          {rows.length === 0
            ? "Нет максимумов."
            : `Выросло ${grown} из ${rows.length}. Число можно поправить.`}
        </p>
      </div>
      {rows.map((row) => {
        const value = drafts[row.exerciseId] ?? formatWeight(row.proposed);
        return (
          <div
            key={row.exerciseId}
            className="card-surface flex flex-col gap-2 px-5 py-4"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-lg font-medium">{row.name}</p>
              {row.note ? (
                <p className="shrink-0 text-sm text-muted-foreground">
                  {row.note}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-base tabular-nums text-muted-foreground">
                {formatWeight(row.current)}
              </span>
              <span className="text-muted-foreground">→</span>
              <Input
                inputMode="decimal"
                enterKeyHint="done"
                value={value}
                aria-label={`Дальше, ${row.name}`}
                onChange={(event) =>
                  onDraftChange(row.exerciseId, event.target.value)
                }
                onKeyDown={handleNumericEnter}
                className="h-12 text-lg"
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}

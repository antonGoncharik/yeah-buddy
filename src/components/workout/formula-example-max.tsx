"use client";

import { Input } from "@/components/ui/input";

/** Demo 1RM so the kg column on the right is obviously an example, not a target. */
export function FormulaExampleMax({
  value,
  onChange,
  hint = "Килограммы под строкой — пример при максимуме на раз",
}: {
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="min-w-0 flex-1">{hint}</span>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-16 px-2 text-center text-sm tabular-nums"
        aria-label="Пример верхнего рабочего веса, кг"
      />
      <span>кг</span>
    </div>
  );
}

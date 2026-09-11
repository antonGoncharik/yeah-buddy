"use client";

import { Input } from "@/components/ui/input";

export function FormulaIncreaseField({
  maxIncrease,
  onChange,
}: {
  maxIncrease: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">Плюс</h2>
        <p className="text-sm text-muted-foreground">к рабочему весу</p>
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">
        На сколько поднять рабочие, когда этап это разрешает. Не всем сразу.
      </p>
      <div className="flex items-center gap-2">
        <Input
          inputMode="decimal"
          value={maxIncrease}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-24 text-base"
          aria-label="Плюс к рабочему весу"
        />
        <span className="text-lg text-muted-foreground">%</span>
      </div>
    </section>
  );
}

"use client";

import type { MuscleBalancePair } from "@/lib/types";

function formatSets(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function MuscleBalanceBars({ pairs }: { pairs: MuscleBalancePair[] }) {
  const visible = pairs.filter((item) => item.sets_a + item.sets_b > 0);
  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="card-surface flex flex-col gap-3 px-5 py-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Баланс, подходы в неделю
      </h2>
      <ul className="flex flex-col gap-3">
        {visible.map((pair) => {
          const sum = pair.sets_a + pair.sets_b;
          const left = Math.round((pair.sets_a / sum) * 100);
          return (
            <li key={`${pair.a}-${pair.b}`} className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0">
                  {pair.label_a}{" "}
                  <span className="tabular-nums text-muted-foreground">
                    {formatSets(pair.sets_a)}
                  </span>
                </span>
                <span className="min-w-0 text-right">
                  {pair.label_b}{" "}
                  <span className="tabular-nums text-muted-foreground">
                    {formatSets(pair.sets_b)}
                  </span>
                </span>
              </span>
              <span
                className="flex h-2 overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <span
                  className="h-full bg-primary"
                  style={{ width: `${left}%` }}
                />
                <span
                  className="h-full bg-primary/35"
                  style={{ width: `${100 - left}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

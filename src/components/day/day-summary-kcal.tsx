"use client";

import { formatProteinPerKg } from "@/lib/day/body-weight";
import { formatKcal } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export function ProteinFigure({ text }: { text: string }) {
  const split = text.match(/^(.*?\s)(\d[\d\s]*(?:,\d+)?\u00A0г)$/);
  if (!split) {
    return text;
  }

  return (
    <>
      {split[1]}
      <span className="whitespace-nowrap">{split[2]}</span>
    </>
  );
}

function kcalRemainderText(
  remainingKcal: number,
  targetKcal: number,
  overflow: boolean,
): string {
  const amount = overflow
    ? `+${formatKcal(Math.abs(remainingKcal))}`
    : formatKcal(remainingKcal);
  if (targetKcal > 0) {
    return `${amount} / ${formatKcal(targetKcal)}`;
  }
  return amount;
}

export function LoopFacts({
  overflow,
  remainingKcal,
  targetKcal,
  showWeight,
  factLabel,
  factKcal,
  perKg,
}: {
  overflow: boolean;
  remainingKcal: number;
  targetKcal: number;
  showWeight: boolean;
  factLabel: string;
  factKcal: number;
  perKg: number | null;
}) {
  const cells = [
    {
      value: kcalRemainderText(remainingKcal, targetKcal, overflow),
      label: "ккал",
      over: overflow,
      muted: false,
    },
    ...(showWeight
      ? [
          {
            value: formatKcal(factKcal),
            label: factLabel.toLocaleLowerCase("ru-RU"),
            over: false,
            muted: false,
          },
        ]
      : []),
    ...(perKg != null || showWeight
      ? [
          {
            value:
              perKg == null
                ? "—"
                : formatProteinPerKg(perKg).replace(/\s*г\/кг$/, ""),
            label: "г/кг",
            over: false,
            muted: perKg == null,
          },
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        "grid gap-2",
        cells.length === 3 && "grid-cols-3",
        cells.length === 2 && "grid-cols-2",
      )}
    >
      {cells.map((cell, index) => (
        <p
          key={cell.label}
          className={cn(
            "min-w-0",
            cells.length === 3 && index === 1 && "text-center",
            index === cells.length - 1 && cells.length > 1 && "text-right",
          )}
        >
          <span
            className={cn(
              "block text-lg font-semibold tracking-tight tabular-nums",
              cell.over && "text-destructive",
              cell.muted && "text-muted-foreground",
            )}
          >
            {cell.value}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {cell.label}
          </span>
        </p>
      ))}
    </div>
  );
}

export function KcalLine({
  overflow,
  remainingKcal,
  targetKcal,
  showWeight,
  factLabel,
  factKcal,
  perKg,
}: {
  overflow: boolean;
  remainingKcal: number;
  targetKcal: number;
  showWeight: boolean;
  factLabel: string;
  factKcal: number;
  perKg: number | null;
}) {
  return (
    <p className="min-w-0 text-sm text-muted-foreground tabular-nums">
      {kcalRemainderText(remainingKcal, targetKcal, overflow)} ккал
      {showWeight ? ` · ${factLabel} ${formatKcal(factKcal)}` : null}
      {perKg != null ? ` · ${formatProteinPerKg(perKg)}` : null}
    </p>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { BodyWeightField } from "@/components/day/body-weight-field";
import { CookieDoodle } from "@/components/layout/doodles";
import { MeterBar } from "@/components/ui/meter-bar";
import { formatProteinPerKg, proteinPerKg } from "@/lib/day/body-weight";
import {
  hundredWeightLine,
  macrosClosedLine,
  overflowKcalLabel,
  PROTEIN_CLOSED_LABEL,
  PROTEIN_CLOSED_MS,
  proteinAlmostLine,
  proteinClosed,
  STEADY_WEIGHT_LINE,
} from "@/lib/flavor";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { Day } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DaySummary({
  day,
  fact,
  factLabel = "Съел",
  showWeight = false,
  bodyWeight = null,
  lastBodyWeight = null,
  bodyWeightReadOnly = false,
  bodyWeightBusy = false,
  weightSteady = false,
  onSaveBodyWeight,
}: {
  day: Pick<
    Day,
    "target_protein" | "target_fat" | "target_carbs" | "target_kcal"
  >;
  fact: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
  factLabel?: string;
  showWeight?: boolean;
  bodyWeight?: number | null;
  lastBodyWeight?: number | null;
  bodyWeightReadOnly?: boolean;
  bodyWeightBusy?: boolean;
  weightSteady?: boolean;
  onSaveBodyWeight?: (value: number | null) => Promise<void>;
}) {
  const remainingKcal = day.target_kcal - fact.kcal;
  const overflow = remainingKcal < 0;
  const remainingProtein = day.target_protein - fact.protein;
  const proteinOverflow = remainingProtein < 0;
  const closed = proteinClosed(remainingProtein, fact.protein);
  const [flashClosed, setFlashClosed] = useState(false);
  const wasClosed = useRef(false);
  const almost = flashClosed
    ? null
    : proteinAlmostLine(remainingProtein, fact.protein);
  const macros = macrosClosedLine(fact, day);
  const hundred = hundredWeightLine(bodyWeight);
  const weightNote = hundred ?? (weightSteady ? STEADY_WEIGHT_LINE : null);
  const perKg =
    bodyWeight != null ? proteinPerKg(fact.protein, bodyWeight) : null;

  useEffect(() => {
    if (!closed) {
      wasClosed.current = false;
      setFlashClosed(false);
      return;
    }
    if (wasClosed.current) {
      return;
    }
    wasClosed.current = true;
    setFlashClosed(true);
    const timer = window.setTimeout(() => {
      setFlashClosed(false);
    }, PROTEIN_CLOSED_MS);
    return () => window.clearTimeout(timer);
  }, [closed]);

  return (
    <section className="card-surface flex flex-col gap-5 px-5 py-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CookieDoodle className="size-4 text-primary/80" />
            {overflowKcalLabel(overflow)}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight transition-colors duration-300 ease-[var(--ease-out-soft)]",
              flashClosed ? "animate-fade" : "tabular-nums",
              proteinOverflow && !flashClosed && "text-destructive",
            )}
          >
            {flashClosed
              ? PROTEIN_CLOSED_LABEL
              : proteinOverflow
                ? `+${formatMacro(Math.abs(remainingProtein))}`
                : formatMacro(Math.max(0, remainingProtein))}
            {flashClosed ? null : (
              <span className="ml-1.5 text-base font-medium text-muted-foreground">
                г белка
              </span>
            )}
          </p>
          {almost ? (
            <p className="mt-1 text-sm text-muted-foreground">{almost}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {overflow
              ? `+${formatKcal(Math.abs(remainingKcal))} ккал`
              : `${formatKcal(remainingKcal)} ккал`}
            {showWeight ? ` · ${factLabel} ${formatKcal(fact.kcal)}` : null}
            {perKg != null ? ` · ${formatProteinPerKg(perKg)}` : null}
          </p>
        </div>
        {showWeight ? (
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Вес</p>
            <div className="mt-1">
              <BodyWeightField
                value={bodyWeight}
                placeholder={bodyWeight == null ? lastBodyWeight : null}
                readOnly={bodyWeightReadOnly}
                disabled={bodyWeightBusy}
                onSave={onSaveBodyWeight}
              />
            </div>
            {weightNote ? (
              <p className="mt-1 text-sm text-muted-foreground">{weightNote}</p>
            ) : null}
          </div>
        ) : (
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">
              {factLabel}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
              {formatKcal(fact.kcal)}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5">
        <MacroBar
          label="Белки"
          fact={fact.protein}
          plan={day.target_protein}
          barClass="bg-[var(--macro-protein)]"
        />
        <MacroBar
          label="Жиры"
          fact={fact.fat}
          plan={day.target_fat}
          barClass="bg-[var(--macro-fat)]"
        />
        <MacroBar
          label="Углеводы"
          fact={fact.carbs}
          plan={day.target_carbs}
          barClass="bg-[var(--macro-carbs)]"
        />
      </div>
      {macros ? (
        <p className="text-sm text-muted-foreground">{macros}</p>
      ) : null}
    </section>
  );
}

function MacroBar({
  label,
  fact,
  plan,
  barClass,
}: {
  label: string;
  fact: number;
  plan: number;
  barClass: string;
}) {
  const remaining = plan - fact;
  const overflow = remaining < 0;
  const ratio = plan > 0 ? Math.min(fact / plan, 1) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-base">
        <p className="font-medium">{label}</p>
        <p
          className={cn(
            "tabular-nums text-muted-foreground",
            overflow && "text-destructive",
          )}
        >
          <span className="text-foreground">{formatMacro(fact)}</span>
          <span> / {formatMacro(plan)}</span>
        </p>
      </div>
      <MeterBar ratio={ratio} barClass={barClass} overflow={overflow} />
    </div>
  );
}

"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  KcalLine,
  LoopFacts,
  ProteinFigure,
} from "@/components/day/day-summary-kcal";
import { MacroBar } from "@/components/day/day-summary-macro-bar";
import { WeightBlock } from "@/components/day/day-summary-weight-block";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { CookieDoodle } from "@/components/layout/doodles";
import { useWiggle } from "@/components/layout/wiggle-tap";
import { JoyShareButton } from "@/components/share/joy-share-button";
import { proteinPerKg } from "@/lib/day/body-weight";
import { proteinLoopLine } from "@/lib/day/loop";
import {
  hundredWeightLine,
  liveProteinHits,
  macrosClosedLine,
  overflowKcalLabel,
  PROTEIN_CLOSED_LABEL,
  PROTEIN_CLOSED_MS,
  proteinAlmostLine,
  proteinClosed,
  proteinWeekLine,
  STEADY_WEIGHT_LINE,
} from "@/lib/flavor";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import { dayJoyMoment } from "@/lib/share/joy";
import type { Day } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DaySummary({
  day,
  fact,
  factLabel = "Съел",
  showWeight = false,
  bodyWeight = null,
  lastBodyWeight = null,
  waist = null,
  lastWaist = null,
  bodyWeightReadOnly = false,
  bodyWeightBusy = false,
  weightSteady = false,
  priorProteinHits = 0,
  foodStreakLine = null,
  trainingGap = null,
  weightGap = null,
  waistGap = null,
  share = false,
  gym = null,
  onSaveBodyWeight,
  onSaveWaist,
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
  waist?: number | null;
  lastWaist?: number | null;
  bodyWeightReadOnly?: boolean;
  bodyWeightBusy?: boolean;
  weightSteady?: boolean;
  priorProteinHits?: number;
  foodStreakLine?: string | null;
  trainingGap?: string | null;
  weightGap?: string | null;
  waistGap?: string | null;
  share?: boolean;
  gym?: ReactNode;
  onSaveBodyWeight?: (value: number | null) => Promise<void>;
  onSaveWaist?: (value: number | null) => Promise<void>;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const targetKcal = day.target_kcal;
  const remainingKcal = targetKcal - fact.kcal;
  const overflow = remainingKcal < 0;
  const remainingProtein = day.target_protein - fact.protein;
  const proteinOverflow = remainingProtein < 0;
  const closed = proteinClosed(remainingProtein, fact.protein);
  const hits = liveProteinHits(closed, priorProteinHits);
  const weekLine = proteinWeekLine(hits);
  const [flashClosed, setFlashClosed] = useState(false);
  const wasClosed = useRef(false);
  const cookie = useWiggle();
  const wiggleCookie = cookie.play;
  const almost = flashClosed
    ? null
    : proteinAlmostLine(remainingProtein, fact.protein);
  const macros = macrosClosedLine(fact, day);
  const hundred = hundredWeightLine(bodyWeight);
  const weightNote = hundred ?? (weightSteady ? STEADY_WEIGHT_LINE : null);
  const joy = share
    ? dayJoyMoment({
        proteinClosed: closed,
        bodyWeight,
        proteinHits: hits,
      })
    : null;
  const knownWeight = bodyWeight ?? lastBodyWeight;
  const perKg =
    knownWeight != null ? proteinPerKg(fact.protein, knownWeight) : null;
  const loop = gym != null;
  const proteinGlance = proteinLoopLine(remainingProtein, fact.protein);

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
    wiggleCookie();
    const timer = window.setTimeout(() => {
      setFlashClosed(false);
    }, PROTEIN_CLOSED_MS);
    return () => window.clearTimeout(timer);
  }, [closed, wiggleCookie]);

  const glance = compact
    ? null
    : (almost ?? trainingGap ?? foodStreakLine ?? weekLine ?? macros);
  const proteinNumber = loop
    ? flashClosed
      ? PROTEIN_CLOSED_LABEL
      : proteinGlance.replace(/ г$/, "\u00A0г")
    : flashClosed
      ? PROTEIN_CLOSED_LABEL
      : proteinOverflow
        ? `+${formatMacro(Math.abs(remainingProtein))}`
        : formatMacro(Math.max(0, remainingProtein));
  const bodyMetrics = showWeight;

  return (
    <section
      className={cn(
        "card-surface flex flex-col px-5",
        compact ? "gap-2 py-2" : "gap-5 py-5",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <button
                type="button"
                aria-label="Печенье"
                className="text-primary/80"
                onClick={cookie.wiggle}
              >
                <span
                  key={cookie.token}
                  className={cn("inline-flex", cookie.className)}
                  onAnimationEnd={cookie.onAnimationEnd}
                >
                  <CookieDoodle className="size-4" />
                </span>
              </button>
              {loop ? "Белок" : overflowKcalLabel(overflow)}
            </div>
            <p
              className={cn(
                "mt-1 font-semibold tracking-tight transition-colors duration-300 ease-[var(--ease-out-soft)]",
                compact ? "text-xl" : "text-2xl",
                flashClosed ? "animate-fade" : "tabular-nums",
                proteinOverflow &&
                  !flashClosed &&
                  !closed &&
                  "text-destructive",
              )}
            >
              <ProteinFigure text={proteinNumber} />
              {loop || flashClosed ? null : (
                <span className="ml-1.5 whitespace-nowrap text-base font-medium text-muted-foreground">
                  г белка
                </span>
              )}
            </p>
            {glance ? (
              <p className="mt-1 text-sm text-muted-foreground">{glance}</p>
            ) : null}
            {loop ? null : (
              <div className="mt-1">
                <KcalLine
                  overflow={overflow}
                  remainingKcal={remainingKcal}
                  targetKcal={targetKcal}
                  showWeight={showWeight}
                  factLabel={factLabel}
                  factKcal={fact.kcal}
                  perKg={perKg}
                />
              </div>
            )}
          </div>
          {loop ? (
            gym
          ) : (
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                {factLabel}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                {formatKcal(fact.kcal)}
                {targetKcal > 0 ? (
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    / {formatKcal(targetKcal)}
                  </span>
                ) : null}
              </p>
            </div>
          )}
        </div>

        {loop ? (
          <LoopFacts
            overflow={overflow}
            remainingKcal={remainingKcal}
            targetKcal={targetKcal}
            showWeight={showWeight}
            factLabel={factLabel}
            factKcal={fact.kcal}
            perKg={perKg}
          />
        ) : null}
      </div>

      {joy && !compact ? <JoyShareButton moment={joy} /> : null}

      <div className={cn("flex flex-col", compact ? "gap-2" : "gap-3.5")}>
        <MacroBar
          label="Белки"
          fact={fact.protein}
          plan={day.target_protein}
          barClass="bg-[var(--macro-protein)]"
          compact={compact}
        />
        <MacroBar
          label="Жиры"
          fact={fact.fat}
          plan={day.target_fat}
          barClass="bg-[var(--macro-fat)]"
          compact={compact}
        />
        <MacroBar
          label="Углеводы"
          fact={fact.carbs}
          plan={day.target_carbs}
          barClass="bg-[var(--macro-carbs)]"
          compact={compact}
        />
      </div>
      {bodyMetrics ? (
        <div
          className={cn(
            "flex flex-col border-t border-border",
            compact ? "gap-2 pt-3" : "gap-3 pt-4",
          )}
        >
          <WeightBlock
            bodyWeight={bodyWeight}
            lastBodyWeight={lastBodyWeight}
            waist={waist}
            lastWaist={lastWaist}
            readOnly={bodyWeightReadOnly}
            busy={bodyWeightBusy}
            note={compact ? null : weightNote}
            weightGap={weightGap}
            waistGap={waistGap}
            wide
            divided={false}
            onSave={onSaveBodyWeight}
            onSaveWaist={onSaveWaist}
          />
        </div>
      ) : null}
    </section>
  );
}

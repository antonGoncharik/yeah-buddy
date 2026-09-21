"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { BodyWeightField } from "@/components/day/body-weight-field";
import { CookieDoodle } from "@/components/layout/doodles";
import { useWiggle } from "@/components/layout/wiggle-tap";
import { JoyShareButton } from "@/components/share/joy-share-button";
import { MeterBar } from "@/components/ui/meter-bar";
import { formatProteinPerKg, proteinPerKg } from "@/lib/day/body-weight";
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
  bodyWeightReadOnly = false,
  bodyWeightBusy = false,
  weightSteady = false,
  priorProteinHits = 0,
  share = false,
  gym = null,
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
  priorProteinHits?: number;
  share?: boolean;
  gym?: ReactNode;
  onSaveBodyWeight?: (value: number | null) => Promise<void>;
}) {
  const remainingKcal = day.target_kcal - fact.kcal;
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
  const perKg =
    bodyWeight != null ? proteinPerKg(fact.protein, bodyWeight) : null;
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

  const proteinNumber = loop
    ? flashClosed
      ? PROTEIN_CLOSED_LABEL
      : proteinGlance.replace(/ г$/, "\u00A0г")
    : flashClosed
      ? PROTEIN_CLOSED_LABEL
      : proteinOverflow
        ? `+${formatMacro(Math.abs(remainingProtein))}`
        : formatMacro(Math.max(0, remainingProtein));
  const weightBesideProtein = loop && showWeight;

  return (
    <section className="card-surface flex flex-col gap-5 px-5 py-5">
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "flex justify-between gap-4",
            weightBesideProtein ? "items-end" : "items-start",
          )}
        >
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
                "mt-1 text-2xl font-semibold tracking-tight transition-colors duration-300 ease-[var(--ease-out-soft)]",
                flashClosed ? "animate-fade" : "tabular-nums",
                proteinOverflow && !flashClosed && !closed && "text-destructive",
              )}
            >
              <ProteinFigure text={proteinNumber} />
              {loop || flashClosed ? null : (
                <span className="ml-1.5 whitespace-nowrap text-base font-medium text-muted-foreground">
                  г белка
                </span>
              )}
            </p>
            {weightBesideProtein ? null : almost ? (
              <p className="mt-1 text-sm text-muted-foreground">{almost}</p>
            ) : null}
            {weightBesideProtein ? null : weekLine ? (
              <p className="mt-1 text-base font-medium">{weekLine}</p>
            ) : null}
            {loop ? null : (
              <div className="mt-1">
                <KcalLine
                  overflow={overflow}
                  remainingKcal={remainingKcal}
                  showWeight={showWeight}
                  factLabel={factLabel}
                  factKcal={fact.kcal}
                  perKg={perKg}
                />
              </div>
            )}
          </div>
          {weightBesideProtein ? (
            <WeightBlock
              bodyWeight={bodyWeight}
              lastBodyWeight={lastBodyWeight}
              readOnly={bodyWeightReadOnly}
              busy={bodyWeightBusy}
              note={null}
              onSave={onSaveBodyWeight}
            />
          ) : loop ? (
            gym
          ) : showWeight ? (
            <WeightBlock
              bodyWeight={bodyWeight}
              lastBodyWeight={lastBodyWeight}
              readOnly={bodyWeightReadOnly}
              busy={bodyWeightBusy}
              note={weightNote}
              onSave={onSaveBodyWeight}
            />
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

        {weightBesideProtein && almost ? (
          <p className="text-sm text-muted-foreground">{almost}</p>
        ) : null}
        {weightBesideProtein && weekLine ? (
          <p className="text-base font-medium">{weekLine}</p>
        ) : null}
        {weightBesideProtein && weightNote ? (
          <p className="text-right text-sm text-muted-foreground">{weightNote}</p>
        ) : null}

        {loop ? (
          <div className="flex items-start justify-between gap-4">
            <KcalLine
              overflow={overflow}
              remainingKcal={remainingKcal}
              showWeight={showWeight}
              factLabel={factLabel}
              factKcal={fact.kcal}
              perKg={perKg}
            />
            {weightBesideProtein ? gym : null}
          </div>
        ) : null}
      </div>

      {joy ? <JoyShareButton moment={joy} /> : null}

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

function ProteinFigure({ text }: { text: string }) {
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

function KcalLine({
  overflow,
  remainingKcal,
  showWeight,
  factLabel,
  factKcal,
  perKg,
}: {
  overflow: boolean;
  remainingKcal: number;
  showWeight: boolean;
  factLabel: string;
  factKcal: number;
  perKg: number | null;
}) {
  return (
    <p className="min-w-0 text-sm text-muted-foreground tabular-nums">
      {overflow
        ? `+${formatKcal(Math.abs(remainingKcal))} ккал`
        : `${formatKcal(remainingKcal)} ккал`}
      {showWeight ? ` · ${factLabel} ${formatKcal(factKcal)}` : null}
      {perKg != null ? ` · ${formatProteinPerKg(perKg)}` : null}
    </p>
  );
}

function WeightBlock({
  bodyWeight,
  lastBodyWeight,
  readOnly,
  busy,
  note,
  onSave,
}: {
  bodyWeight: number | null;
  lastBodyWeight: number | null;
  readOnly: boolean;
  busy: boolean;
  note: string | null;
  onSave?: (value: number | null) => Promise<void>;
}) {
  return (
    <div className="shrink-0 text-right">
      <p className="text-sm font-medium text-muted-foreground">Вес</p>
      <div className="mt-1">
        <BodyWeightField
          value={bodyWeight}
          placeholder={bodyWeight == null ? lastBodyWeight : null}
          readOnly={readOnly}
          disabled={busy}
          onSave={onSave}
        />
      </div>
      {note ? (
        <p className="mt-1 text-sm text-muted-foreground">{note}</p>
      ) : null}
    </div>
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

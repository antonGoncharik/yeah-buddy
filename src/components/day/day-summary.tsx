"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { BodyWeightField } from "@/components/day/body-weight-field";
import { CookieDoodle } from "@/components/layout/doodles";
import { useWiggle } from "@/components/layout/wiggle-tap";
import { JoyShareButton } from "@/components/share/joy-share-button";
import { MeterBar } from "@/components/ui/meter-bar";
import {
  formatProteinPerKg,
  parseWaist,
  proteinPerKg,
} from "@/lib/day/body-weight";
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
  share?: boolean;
  gym?: ReactNode;
  onSaveBodyWeight?: (value: number | null) => Promise<void>;
  onSaveWaist?: (value: number | null) => Promise<void>;
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

  const proteinNumber = loop
    ? flashClosed
      ? PROTEIN_CLOSED_LABEL
      : proteinGlance.replace(/ г$/, "\u00A0г")
    : flashClosed
      ? PROTEIN_CLOSED_LABEL
      : proteinOverflow
        ? `+${formatMacro(Math.abs(remainingProtein))}`
        : formatMacro(Math.max(0, remainingProtein));
  const bodyMetrics = loop && showWeight;

  return (
    <section className="card-surface flex flex-col gap-5 px-5 py-5">
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
                "mt-1 text-2xl font-semibold tracking-tight transition-colors duration-300 ease-[var(--ease-out-soft)]",
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
            {almost ? (
              <p className="mt-1 text-sm text-muted-foreground">{almost}</p>
            ) : null}
            {weekLine ? (
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
          {loop ? (
            gym
          ) : showWeight ? (
            <WeightBlock
              bodyWeight={bodyWeight}
              lastBodyWeight={lastBodyWeight}
              waist={waist}
              lastWaist={lastWaist}
              readOnly={bodyWeightReadOnly}
              busy={bodyWeightBusy}
              note={weightNote}
              onSave={onSaveBodyWeight}
              onSaveWaist={onSaveWaist}
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

        {loop ? (
          <LoopFacts
            overflow={overflow}
            remainingKcal={remainingKcal}
            showWeight={showWeight}
            factLabel={factLabel}
            factKcal={fact.kcal}
            perKg={perKg}
          />
        ) : null}
      </div>

      {joy ? <JoyShareButton moment={joy} /> : null}

      <div className={cn("flex flex-col", loop ? "gap-3" : "gap-3.5")}>
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
      {bodyMetrics ? (
        <WeightBlock
          bodyWeight={bodyWeight}
          lastBodyWeight={lastBodyWeight}
          waist={waist}
          lastWaist={lastWaist}
          readOnly={bodyWeightReadOnly}
          busy={bodyWeightBusy}
          note={weightNote}
          wide
          onSave={onSaveBodyWeight}
          onSaveWaist={onSaveWaist}
        />
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

function LoopFacts({
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
  const cells = [
    {
      value: overflow
        ? `+${formatKcal(Math.abs(remainingKcal))}`
        : formatKcal(remainingKcal),
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
      {cells.map((cell) => (
        <p key={cell.label} className="min-w-0">
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
  waist,
  lastWaist,
  readOnly,
  busy,
  note,
  wide = false,
  onSave,
  onSaveWaist,
}: {
  bodyWeight: number | null;
  lastBodyWeight: number | null;
  waist: number | null;
  lastWaist: number | null;
  readOnly: boolean;
  busy: boolean;
  note: string | null;
  wide?: boolean;
  onSave?: (value: number | null) => Promise<void>;
  onSaveWaist?: (value: number | null) => Promise<void>;
}) {
  const showWaist = onSaveWaist != null || waist != null;

  return (
    <div
      className={cn(
        wide ? "border-t border-border pt-4" : "shrink-0 text-right",
      )}
    >
      <div
        className={cn(
          wide ? "grid gap-4" : "flex justify-end gap-5",
          wide && showWaist && "grid-cols-2",
        )}
      >
        <div className={wide ? undefined : "text-right"}>
          <p className="text-sm font-medium text-muted-foreground">Вес</p>
          <div className="mt-1">
            <BodyWeightField
              value={bodyWeight}
              placeholder={bodyWeight == null ? lastBodyWeight : null}
              readOnly={readOnly}
              disabled={busy}
              align={wide ? "start" : "end"}
              onSave={onSave}
            />
          </div>
        </div>
        {showWaist ? (
          <div className={wide ? undefined : "text-right"}>
            <p className="text-sm font-medium text-muted-foreground">Талия</p>
            <div className="mt-1">
              <BodyWeightField
                value={waist}
                placeholder={waist == null ? lastWaist : null}
                readOnly={readOnly || onSaveWaist == null}
                disabled={busy}
                align={wide ? "start" : "end"}
                onSave={onSaveWaist}
                unit="см"
                ariaLabel="Талия"
                parse={parseWaist}
              />
            </div>
          </div>
        ) : null}
      </div>
      {note ? (
        <p
          className={cn(
            "mt-1 text-sm text-muted-foreground",
            !wide && "text-right",
          )}
        >
          {note}
        </p>
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

"use client";

import { BodyWeightField } from "@/components/day/body-weight-field";
import { MeasureTrendLines } from "@/components/day/measure-trend-lines";
import { parseWaist } from "@/lib/day/body-weight";
import { cn } from "@/lib/utils";

export function WeightBlock({
  bodyWeight,
  lastBodyWeight,
  waist,
  lastWaist,
  readOnly,
  busy,
  note,
  weightGap = null,
  waistGap = null,
  wide = false,
  divided,
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
  weightGap?: string | null;
  waistGap?: string | null;
  wide?: boolean;
  divided?: boolean;
  onSave?: (value: number | null) => Promise<void>;
  onSaveWaist?: (value: number | null) => Promise<void>;
}) {
  const showWaist = onSaveWaist != null || waist != null;
  const showDivider = divided ?? wide;

  return (
    <div
      className={cn(
        showDivider
          ? "border-t border-border pt-4"
          : wide
            ? undefined
            : "min-w-0 max-w-[48%] text-right",
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
          {weightGap ? (
            <p className="mt-1 text-sm text-muted-foreground">{weightGap}</p>
          ) : null}
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
                invalidHint="Талия от 40 до 200 см."
                parse={parseWaist}
              />
            </div>
            {waistGap ? (
              <p className="mt-1 text-sm text-muted-foreground">{waistGap}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {!readOnly ? (
        <MeasureTrendLines weight={bodyWeight} waist={waist} />
      ) : null}
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

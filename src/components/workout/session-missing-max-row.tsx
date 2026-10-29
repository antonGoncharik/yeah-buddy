"use client";

import type { Dispatch, SetStateAction } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleNumericEnter } from "@/lib/form/field-nav";
import {
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
} from "@/lib/form/numeric-draft";
import type { Exercise } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatMissingMaxEstimateLine } from "@/lib/workout/session-missing-maxes";

export function SessionMissingMaxRow({
  exercise,
  index,
  lastIndex,
  busy,
  oneRm,
  workKg,
  workReps,
  setOneRm,
  setWorkKg,
  setWorkReps,
}: {
  exercise: Exercise;
  index: number;
  lastIndex: number;
  busy: boolean;
  oneRm: Record<string, string>;
  workKg: Record<string, string>;
  workReps: Record<string, string>;
  setOneRm: Dispatch<SetStateAction<Record<string, string>>>;
  setWorkKg: Dispatch<SetStateAction<Record<string, string>>>;
  setWorkReps: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const label = exerciseShortLabel(exercise.short_name, exercise.name);
  const estimateLine = formatMissingMaxEstimateLine(exercise, workKg, workReps);

  return (
    <div className="flex flex-col gap-2 border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
      <p className="text-base font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <Label
          htmlFor={`missing-max-${exercise.id}`}
          className="min-w-0 flex-1 text-sm text-muted-foreground"
        >
          На раз, кг
        </Label>
        <Input
          id={`missing-max-${exercise.id}`}
          inputMode="decimal"
          enterKeyHint="next"
          autoComplete="off"
          placeholder="кг"
          disabled={busy}
          value={oneRm[exercise.id] ?? ""}
          onChange={(event) =>
            setOneRm((current) => ({
              ...current,
              [exercise.id]: sanitizeDecimalDraft(event.target.value),
            }))
          }
          onKeyDown={handleNumericEnter}
          className="h-12 w-24 shrink-0 text-base tabular-nums"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-sm text-muted-foreground">
          или вес × повторы
        </span>
        <Input
          aria-label={`Вес, ${label}`}
          inputMode="decimal"
          enterKeyHint="next"
          autoComplete="off"
          placeholder="кг"
          disabled={busy}
          value={workKg[exercise.id] ?? ""}
          onChange={(event) =>
            setWorkKg((current) => ({
              ...current,
              [exercise.id]: sanitizeDecimalDraft(event.target.value),
            }))
          }
          onKeyDown={handleNumericEnter}
          className="h-12 w-20 shrink-0 text-base tabular-nums"
        />
        <span className="text-muted-foreground">×</span>
        <Input
          aria-label={`Повторы, ${label}`}
          inputMode="numeric"
          enterKeyHint={index === lastIndex ? "done" : "next"}
          autoComplete="off"
          placeholder="раз"
          disabled={busy}
          value={workReps[exercise.id] ?? ""}
          onChange={(event) =>
            setWorkReps((current) => ({
              ...current,
              [exercise.id]: sanitizeIntegerDraft(event.target.value),
            }))
          }
          onKeyDown={handleNumericEnter}
          className="h-12 w-16 shrink-0 text-base tabular-nums"
        />
      </div>
      {estimateLine ? (
        <p className="text-sm text-muted-foreground tabular-nums">
          {estimateLine}
        </p>
      ) : null}
    </div>
  );
}

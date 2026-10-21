"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { handleNumericEnter } from "@/lib/form/field-nav";
import type { ExerciseWithMax, SlotLoad } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import {
  formatRepsRange,
  parseRepsRange,
  SLOT_LOAD_HINTS,
} from "@/lib/workout/slot-plan";
import { trackSummary } from "@/lib/workout/track-line";

export function loadHint(load: SlotLoad, exercise: ExerciseWithMax): string {
  if (load.type === "track") {
    return exercise.track
      ? `На штанге ${trackSummary(exercise.track)}.`
      : "Килограммы на штанге — в карточке упражнения.";
  }
  if (load.type === "percent" || load.type === "orm") {
    return exercise.current_max
      ? `На раз ${formatWeight(exercise.current_max.max_weight)} кг.`
      : SLOT_LOAD_HINTS.percent;
  }
  return SLOT_LOAD_HINTS[load.type];
}

export function RepsField({
  reps,
  repsTo,
  onCommit,
}: {
  reps: number | null;
  repsTo: number | null;
  onCommit: (reps: number, repsTo: number | null) => void;
}) {
  const external = formatRepsRange(reps, repsTo);
  const [text, setText] = useState(external);
  useEffect(() => {
    setText(external);
  }, [external]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs text-muted-foreground">раз</span>
      <Input
        aria-label="раз"
        inputMode="numeric"
        enterKeyHint="next"
        value={text}
        placeholder="6–8"
        className="h-11 min-w-0 text-base tabular-nums"
        onKeyDown={handleNumericEnter}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = parseRepsRange(next);
          if (parsed) {
            onCommit(parsed.reps, parsed.reps_to);
          }
        }}
      />
    </div>
  );
}

export function NumField({
  label,
  value,
  inputMode,
  allowZero = false,
  allowNegative = false,
  onCommit,
}: {
  label: string;
  value: number | null;
  inputMode: "decimal" | "numeric";
  allowZero?: boolean;
  allowNegative?: boolean;
  onCommit: (value: number | null) => void;
}) {
  const external = value == null ? "" : formatWeight(value);
  const [text, setText] = useState(external);
  useEffect(() => {
    setText(external);
  }, [external]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        aria-label={label}
        inputMode={inputMode}
        enterKeyHint="next"
        value={text}
        className="h-11 min-w-0 text-base tabular-nums"
        onKeyDown={handleNumericEnter}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = parseSigned(next, allowNegative);
          if (parsed == null) {
            return;
          }
          if (parsed === 0 && !allowZero) {
            return;
          }
          onCommit(parsed);
        }}
      />
    </div>
  );
}

function parseSigned(raw: string, allowNegative: boolean): number | null {
  const trimmed = raw.trim().replace(/^\+/, "");
  if (trimmed === "" || trimmed === "-") {
    return null;
  }
  const negative = trimmed.startsWith("-") || trimmed.startsWith("−");
  if (negative && !allowNegative) {
    return null;
  }
  const value = parseDecimal(negative ? trimmed.slice(1) : trimmed);
  if (value == null) {
    return null;
  }
  return negative ? -value : value;
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { Segmented } from "@/components/ui/segmented";
import {
  loadHint,
  NumField,
  RepsField,
} from "@/components/workout/slot-plan-fields";
import { SlotPlanTrackWorkingField } from "@/components/workout/slot-plan-track-working-field";
import type { ExerciseWithMax, SlotSetGroup, WorkoutKind } from "@/lib/types";
import {
  SLOT_LOAD_LABELS,
  SLOT_LOAD_TYPES,
  switchLoadType,
} from "@/lib/workout/slot-plan";

export function SlotPlanGroupRow({
  kind,
  exercise,
  group,
  canRemove,
  onChange,
  onRemove,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  group: SlotSetGroup;
  canRemove: boolean;
  onChange: (patch: Partial<SlotSetGroup>) => void;
  onRemove: () => void;
}) {
  const load = group.load;
  const exampleWeight = exercise.current_max?.max_weight ?? null;
  const [offsetOpen, setOffsetOpen] = useState(
    load.type === "track" && load.offset !== 0,
  );

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 px-3 py-2.5">
      <div className="flex min-w-0 items-end gap-2">
        <NumField
          label="подх."
          value={group.sets}
          inputMode="numeric"
          onCommit={(value) => {
            if (value != null && value >= 1) {
              onChange({ sets: Math.round(value) });
            }
          }}
        />
        <span className="flex h-11 shrink-0 items-center text-lg text-muted-foreground">
          ×
        </span>
        {kind === "static" ? (
          <NumField
            label="сек"
            value={group.seconds}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ seconds: value, reps: null, reps_to: null });
              }
            }}
          />
        ) : (
          <RepsField
            reps={group.reps}
            repsTo={group.reps_to}
            onCommit={(reps, repsTo) =>
              onChange({ reps, reps_to: repsTo, seconds: null })
            }
          />
        )}
        {canRemove ? (
          <div className="-mb-0.5 -mr-1 shrink-0">
            <RemoveRowButton onClick={onRemove} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Segmented
          value={load.type === "orm" ? "percent" : load.type}
          options={SLOT_LOAD_TYPES.map((type) => ({
            id: type,
            label: SLOT_LOAD_LABELS[type],
          }))}
          onChange={(type) =>
            onChange({
              load: switchLoadType(load, type, exampleWeight),
            })
          }
        />
        {load.type === "percent" || load.type === "orm" ? (
          <NumField
            label="%"
            value={load.percent}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ load: { type: load.type, percent: value } });
              }
            }}
          />
        ) : null}
        {load.type === "track" ? (
          offsetOpen || load.offset !== 0 ? (
            <NumField
              label="± кг"
              value={load.offset}
              inputMode="decimal"
              allowZero
              allowNegative
              onCommit={(value) => {
                if (value != null) {
                  onChange({ load: { ...load, offset: value } });
                  if (value === 0) {
                    setOffsetOpen(false);
                  }
                }
              }}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-11 shrink-0 px-2 text-sm"
              onClick={() => setOffsetOpen(true)}
            >
              Смещение ± кг
            </Button>
          )
        ) : null}
        {load.type === "fixed" ? (
          <NumField
            label="кг"
            value={load.weight}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ load: { type: "fixed", weight: value } });
              }
            }}
          />
        ) : null}
      </div>
      {load.type === "track" ? (
        <SlotPlanTrackWorkingField exercise={exercise} />
      ) : (
        <p className="text-sm leading-snug text-muted-foreground">
          {loadHint(load, exercise)}
        </p>
      )}
    </div>
  );
}

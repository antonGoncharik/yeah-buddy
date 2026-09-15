"use client";

import { useEffect, useState } from "react";

import { AddRowButton } from "@/components/ui/add-row-button";
import { Input, nativeSelectClassName } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { Segmented } from "@/components/ui/segmented";
import { handleNumericEnter } from "@/lib/form/field-nav";
import type {
  ExerciseWithMax,
  SlotIntensity,
  SlotLoadType,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import {
  defaultSlotGroup,
  defaultSlotPlan,
  formatRepsRange,
  parseRepsRange,
  SLOT_INTENSITIES,
  SLOT_INTENSITY_HINTS,
  SLOT_INTENSITY_LABELS,
  SLOT_LOAD_HINTS,
  SLOT_LOAD_LABELS,
  SLOT_LOAD_TYPES,
  switchLoadType,
} from "@/lib/workout/slot-plan";
import { MAX_SLOT_GROUPS } from "@/lib/workout/slot-plan-schema";
import { trackSummary } from "@/lib/workout/track-line";

type IntensityOption = SlotIntensity | "none";

export function SlotPlanEditor({
  kind,
  exercise,
  plan,
  onChange,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  plan: SlotPlan | null;
  onChange: (plan: SlotPlan | null) => void;
}) {
  const current = plan ?? defaultSlotPlan();
  const custom = current.groups != null;
  const groups = current.groups ?? [];

  function update(patch: Partial<SlotPlan>) {
    onChange({ ...current, ...patch });
  }

  function updateGroup(index: number, patch: Partial<SlotSetGroup>) {
    update({
      groups: groups.map((group, position) =>
        position === index ? { ...group, ...patch } : group,
      ),
    });
  }

  return (
    <div
      className="mb-2 flex flex-col gap-4 rounded-xl bg-muted/50 px-3 py-3"
      data-field-group
    >
      <Segmented
        value={custom ? "custom" : "shared"}
        options={[
          { id: "shared", label: "Общий план" },
          { id: "custom", label: "Своя схема" },
        ]}
        onChange={(id) =>
          update({
            groups:
              id === "custom"
                ? groups.length > 0
                  ? groups
                  : [defaultSlotGroup(kind)]
                : null,
          })
        }
      />

      {custom ? (
        <div className="flex flex-col gap-2">
          {groups.map((group, index) => (
            <GroupRow
              // biome-ignore lint/suspicious/noArrayIndexKey: groups have no identity beyond their position
              key={index}
              kind={kind}
              exercise={exercise}
              group={group}
              canRemove={groups.length > 1}
              onChange={(patch) => updateGroup(index, patch)}
              onRemove={() =>
                update({
                  groups: groups.filter((_, position) => position !== index),
                })
              }
            />
          ))}
          {groups.length < MAX_SLOT_GROUPS ? (
            <div className="flex items-center gap-2">
              <AddRowButton
                label="Добавить группу подходов"
                onClick={() =>
                  update({
                    groups: [
                      ...groups,
                      {
                        ...(groups[groups.length - 1] ??
                          defaultSlotGroup(kind)),
                      },
                    ],
                  })
                }
              />
              <span className="text-sm text-muted-foreground">
                Ещё группа подходов: топ 2×2, потом бэк 3×6.
              </span>
            </div>
          ) : null}
          {exercise.formula_preset !== "none" ? (
            <Segmented
              value={current.warmup ? "on" : "off"}
              options={[
                { id: "on", label: "С разминкой" },
                { id: "off", label: "Без разминки" },
              ]}
              onChange={(id) => update({ warmup: id === "on" })}
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Segmented<IntensityOption>
          value={current.intensity ?? "none"}
          options={[
            { id: "none", label: "Как обычно" },
            ...SLOT_INTENSITIES.map((intensity) => ({
              id: intensity,
              label: SLOT_INTENSITY_LABELS[intensity],
            })),
          ]}
          onChange={(id) => update({ intensity: id === "none" ? null : id })}
        />
        <p className="px-1 text-sm leading-snug text-muted-foreground">
          {current.intensity
            ? SLOT_INTENSITY_HINTS[current.intensity]
            : "Тяжело / легко — пометка дня: сколько оставить в запасе в последнем подходе."}
        </p>
      </div>

      <Input
        value={current.note ?? ""}
        placeholder="Заметка к упражнению: хват, темп, замена"
        maxLength={120}
        className="h-11 text-base"
        onChange={(event) =>
          update({
            note: event.target.value === "" ? null : event.target.value,
          })
        }
      />
    </div>
  );
}

function GroupRow({
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

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card px-3 py-2.5">
      <div className="flex items-center gap-2">
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
        <span className="pt-4 text-lg text-muted-foreground">×</span>
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
        <div className="flex-1" />
        {canRemove ? <RemoveRowButton onClick={onRemove} /> : null}
      </div>

      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs text-muted-foreground">вес</span>
          <select
            className={nativeSelectClassName}
            value={load.type}
            onChange={(event) =>
              onChange({
                load: switchLoadType(
                  load,
                  event.target.value as SlotLoadType,
                  exampleWeight,
                ),
              })
            }
          >
            {SLOT_LOAD_TYPES.map((type) => (
              <option key={type} value={type}>
                {SLOT_LOAD_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        {load.type === "percent" ? (
          <NumField
            label="%"
            value={load.percent}
            inputMode="decimal"
            onCommit={(value) => {
              if (value != null && value > 0) {
                onChange({ load: { type: "percent", percent: value } });
              }
            }}
          />
        ) : null}
        {load.type === "track" ? (
          <NumField
            label="± кг"
            value={load.offset}
            inputMode="decimal"
            allowZero
            allowNegative
            onCommit={(value) => {
              if (value != null) {
                onChange({ load: { ...load, offset: value } });
              }
            }}
          />
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
      <p className="text-xs leading-snug text-muted-foreground">
        {load.type === "track" && exercise.track
          ? `Линейка: ${trackSummary(exercise.track)}.`
          : load.type === "track"
            ? "Линейки ещё нет — спросим стартовый вес перед первой тренировкой."
            : SLOT_LOAD_HINTS[load.type]}
      </p>
    </div>
  );
}

function RepsField({
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
    <div className="flex w-20 flex-col gap-1">
      <span className="text-xs text-muted-foreground">раз</span>
      <Input
        aria-label="раз"
        inputMode="numeric"
        enterKeyHint="next"
        value={text}
        placeholder="6–8"
        className="h-11 text-base tabular-nums"
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

function NumField({
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
    <div className="flex w-20 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        aria-label={label}
        inputMode={inputMode}
        enterKeyHint="next"
        value={text}
        className="h-11 text-base tabular-nums"
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

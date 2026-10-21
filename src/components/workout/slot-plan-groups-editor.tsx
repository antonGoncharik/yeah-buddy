"use client";

import { Plus } from "lucide-react";
import { type MutableRefObject, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { Segmented } from "@/components/ui/segmented";
import { EXERCISE_LOAD_INPUT_CLASS } from "@/components/workout/exercise-load-field";
import {
  loadHint,
  NumField,
  RepsField,
} from "@/components/workout/slot-plan-fields";
import { SortableList } from "@/components/workout/sortable-list";
import { putJson } from "@/lib/api-cache";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax, SlotSetGroup, WorkoutKind } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import {
  defaultSlotGroup,
  SLOT_LOAD_LABELS,
  SLOT_LOAD_TYPES,
  switchLoadType,
} from "@/lib/workout/slot-plan";
import { MAX_SLOT_GROUPS } from "@/lib/workout/slot-plan-schema";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export function GroupsEditor({
  kind,
  exercise,
  groups,
  groupIds,
  onChange,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  groups: SlotSetGroup[];
  groupIds: MutableRefObject<string[]>;
  onChange: (next: SlotSetGroup[] | null) => void;
}) {
  if (groupIds.current.length !== groups.length) {
    groupIds.current = groups.map(
      (_, index) => groupIds.current[index] ?? crypto.randomUUID(),
    );
  }

  function updateGroup(index: number, patch: Partial<SlotSetGroup>) {
    onChange(
      groups.map((group, position) =>
        position === index ? { ...group, ...patch } : group,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <SortableList
        variant="cards"
        items={groups.map((group, index) => ({
          id: groupIds.current[index] ?? `group-${index}`,
          group,
        }))}
        onReorder={(next) => {
          groupIds.current = next.map((item) => item.id);
          onChange(next.map((item) => item.group));
        }}
        renderItem={(item, index) => (
          <GroupRow
            kind={kind}
            exercise={exercise}
            group={item.group}
            canRemove={groups.length > 1}
            onChange={(patch) => updateGroup(index, patch)}
            onRemove={() => {
              groupIds.current = groupIds.current.filter(
                (_, position) => position !== index,
              );
              onChange(groups.filter((_, position) => position !== index));
            }}
          />
        )}
      />
      {groups.length < MAX_SLOT_GROUPS ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start px-1 text-base text-primary"
          onClick={() =>
            onChange([
              ...groups,
              { ...(groups[groups.length - 1] ?? defaultSlotGroup(kind)) },
            ])
          }
        >
          <Plus className="size-4" />
          Ещё подходы
        </Button>
      ) : null}
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
        <SlotTrackWorkingField exercise={exercise} />
      ) : (
        <p className="text-sm leading-snug text-muted-foreground">
          {loadHint(load, exercise)}
        </p>
      )}
    </div>
  );
}

function SlotTrackWorkingField({ exercise }: { exercise: ExerciseWithMax }) {
  const current = exercise.track ? trackCurrentWeight(exercise.track) : null;
  const [text, setText] = useState(
    current != null && current > 0 ? formatWeight(current) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setText(current != null && current > 0 ? formatWeight(current) : "");
  }, [current]);

  async function commit() {
    const parsed = parseDecimal(text);
    if (parsed == null || parsed <= 0) {
      if (text.trim() === "" && current != null) {
        setText(formatWeight(current));
      }
      return;
    }
    if (current != null && parsed === current) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await putJson(`/api/exercises/${exercise.id}/track`, { weight: parsed });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      setText(current != null && current > 0 ? formatWeight(current) : "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">На штанге, кг</span>
      <Input
        aria-label="На штанге, кг"
        inputMode="decimal"
        enterKeyHint="done"
        disabled={busy}
        value={text}
        className={EXERCISE_LOAD_INPUT_CLASS}
        onChange={(event) => setText(sanitizeDecimalDraft(event.target.value))}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
            event.currentTarget.blur();
          }
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-sm leading-snug text-muted-foreground">
        От этого веса считаются подходы с типом «Кг».
      </p>
    </div>
  );
}

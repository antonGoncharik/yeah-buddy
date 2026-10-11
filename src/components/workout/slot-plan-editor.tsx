"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { GroupsEditor } from "@/components/workout/slot-plan-groups-editor";
import { WeekOverride } from "@/components/workout/slot-plan-week-override";
import { haptic } from "@/lib/telegram/haptic";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  SlotIntensity,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";
import {
  defaultSlotGroup,
  defaultSlotPlan,
  SLOT_INTENSITIES,
  SLOT_INTENSITY_HINTS,
  SLOT_INTENSITY_LABELS,
  setSlotPhaseGroups,
  slotPhaseKeys,
} from "@/lib/workout/slot-plan";

type IntensityOption = SlotIntensity | "none";

export function SlotPlanEditor({
  kind,
  exercise,
  plan,
  cycle = [],
  onChange,
}: {
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  plan: SlotPlan | null;
  /** Этапы цикла: пока их нет, про этапы ничего не показываем. */
  cycle?: CyclePhaseDef[];
  onChange: (plan: SlotPlan | null) => void;
}) {
  const current = plan ?? defaultSlotPlan();
  const [phaseKey, setPhaseKey] = useState<string | null>(null);
  const [weekOpen, setWeekOpen] = useState(
    () => slotPhaseKeys(plan).length > 0,
  );
  const phase = phaseKey
    ? (cycle.find((item) => item.key === phaseKey) ?? null)
    : null;
  const defaultCustom = current.groups != null;
  const phaseGroups = phase ? (current.phases?.[phase.key] ?? null) : null;
  const phaseCustom = phaseGroups != null;
  const groupIds = useRef<string[]>([]);
  const extraUsed = Boolean(current.intensity || current.note);
  const [showExtra, setShowExtra] = useState(extraUsed);

  useEffect(() => {
    if (extraUsed) {
      setShowExtra(true);
    }
  }, [extraUsed]);

  function update(patch: Partial<SlotPlan>) {
    onChange({ ...current, ...patch });
  }

  function setDefaultGroups(next: SlotSetGroup[] | null) {
    update({ groups: next });
  }

  function setPhaseGroups(next: SlotSetGroup[] | null) {
    if (!phase) {
      return;
    }
    onChange(setSlotPhaseGroups(current, phase.key, next));
  }

  function closeWeeks() {
    setWeekOpen(false);
    setPhaseKey(null);
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border/60 px-1 pt-3 pb-2">
      <p className="text-sm leading-snug text-muted-foreground">
        {cycle.length > 0
          ? "Только это упражнение. Недели общие — задаются отдельно."
          : "Только это упражнение. «Свои» — если нужны другие подходы."}
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-base font-medium">Подходы</p>
        <Segmented
          value={defaultCustom ? "custom" : "shared"}
          options={[
            { id: "shared", label: "Как в плане" },
            { id: "custom", label: "Свои" },
          ]}
          onChange={(id) =>
            setDefaultGroups(
              id === "custom"
                ? (current.groups ?? [defaultSlotGroup(kind)])
                : null,
            )
          }
        />
        {defaultCustom ? (
          <GroupsEditor
            kind={kind}
            exercise={exercise}
            groups={current.groups ?? []}
            groupIds={groupIds}
            onChange={setDefaultGroups}
          />
        ) : (
          <p className="text-sm leading-snug text-muted-foreground">
            Подходы из общего плана. Проценты и разминка — там же.
          </p>
        )}
        {defaultCustom && exercise.formula_preset !== "none" ? (
          <Segmented
            value={current.warmup ? "on" : "off"}
            options={[
              { id: "on", label: "Разминка" },
              { id: "off", label: "Без" },
            ]}
            onChange={(id) => update({ warmup: id === "on" })}
          />
        ) : null}
      </div>

      {showExtra ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Segmented<IntensityOption>
              value={current.intensity ?? "none"}
              options={[
                { id: "none", label: "Обычно" },
                ...SLOT_INTENSITIES.map((intensity) => ({
                  id: intensity,
                  label: SLOT_INTENSITY_LABELS[intensity],
                })),
              ]}
              onChange={(id) =>
                update({ intensity: id === "none" ? null : id })
              }
            />
            <p className="text-sm leading-snug text-muted-foreground">
              {current.intensity
                ? SLOT_INTENSITY_HINTS[current.intensity]
                : "Пометка дня: сколько оставить в запасе в последнем подходе."}
            </p>
          </div>

          <Input
            value={current.note ?? ""}
            placeholder="Заметка: хват, темп, замена"
            maxLength={120}
            className="h-11 text-base"
            onChange={(event) =>
              update({
                note: event.target.value === "" ? null : event.target.value,
              })
            }
          />
        </>
      ) : (
        <button
          type="button"
          className="self-start py-1 text-left text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setShowExtra(true)}
        >
          Ещё: пометка и заметка
        </button>
      )}

      {cycle.length > 0 ? (
        <WeekOverride
          cycle={cycle}
          plan={current}
          open={weekOpen}
          phase={phase}
          phaseCustom={phaseCustom}
          groups={phaseGroups ?? []}
          kind={kind}
          exercise={exercise}
          onToggle={() => {
            haptic("tap");
            if (weekOpen) {
              closeWeeks();
              return;
            }
            setWeekOpen(true);
            const first = slotPhaseKeys(current)[0];
            if (first) {
              setPhaseKey(first);
            }
          }}
          onPickPhase={setPhaseKey}
          onSetPhaseGroups={setPhaseGroups}
        />
      ) : null}
    </div>
  );
}

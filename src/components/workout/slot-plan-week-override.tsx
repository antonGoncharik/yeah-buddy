"use client";

import { ChevronDown } from "lucide-react";
import { useRef } from "react";

import { Segmented } from "@/components/ui/segmented";
import { GroupsEditor } from "@/components/workout/slot-plan-groups-editor";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  SlotPlan,
  SlotSetGroup,
  WorkoutKind,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { defaultSlotGroup, slotPhaseKeys } from "@/lib/workout/slot-plan";

export function WeekOverride({
  cycle,
  plan,
  open,
  phase,
  phaseCustom,
  groups,
  kind,
  exercise,
  onToggle,
  onPickPhase,
  onSetPhaseGroups,
}: {
  cycle: CyclePhaseDef[];
  plan: SlotPlan;
  open: boolean;
  phase: CyclePhaseDef | null;
  phaseCustom: boolean;
  groups: SlotSetGroup[];
  kind: WorkoutKind;
  exercise: ExerciseWithMax;
  onToggle: () => void;
  onPickPhase: (key: string) => void;
  onSetPhaseGroups: (next: SlotSetGroup[] | null) => void;
}) {
  const marked = slotPhaseKeys(plan);
  const names = cycle
    .filter((item) => marked.includes(item.key))
    .map((item) => item.name)
    .join(", ");
  const phaseIds = useRef<string[]>([]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 px-3 py-2.5">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left"
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium">На неделе иначе</span>
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
            {names
              ? `Свои подходы: ${names}`
              : "Цикл общий. Сюда — только если на этапе другие подходы."}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {cycle.map((item) => (
              <Chip
                key={item.key}
                label={item.name}
                marked={marked.includes(item.key)}
                selected={phase?.key === item.key}
                onClick={() => onPickPhase(item.key)}
              />
            ))}
          </div>
          {phase ? (
            <>
              <Segmented
                value={phaseCustom ? "custom" : "shared"}
                options={[
                  { id: "shared", label: "Как обычно" },
                  { id: "custom", label: "Свои" },
                ]}
                onChange={(id) =>
                  onSetPhaseGroups(
                    id === "custom"
                      ? groups.length > 0
                        ? groups
                        : (plan.groups ?? [defaultSlotGroup(kind)])
                      : null,
                  )
                }
              />
              {phaseCustom ? (
                <GroupsEditor
                  kind={kind}
                  exercise={exercise}
                  groups={groups}
                  groupIds={phaseIds}
                  onChange={onSetPhaseGroups}
                />
              ) : (
                <p className="text-sm leading-snug text-muted-foreground">
                  На этапе «{phase.name}» подходы как обычно. Другой вес на эту
                  неделю — включи «Свои».
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-snug text-muted-foreground">
              Выбери неделю.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  selected,
  marked,
  onClick,
}: {
  label: string;
  selected: boolean;
  marked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
      {marked ? (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            selected ? "bg-primary-foreground" : "bg-primary",
          )}
        />
      ) : null}
    </button>
  );
}

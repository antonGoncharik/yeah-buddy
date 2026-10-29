"use client";

import { Plus } from "lucide-react";
import type { MutableRefObject } from "react";

import { Button } from "@/components/ui/button";
import { SlotPlanGroupRow } from "@/components/workout/slot-plan-group-row";
import { SortableList } from "@/components/workout/sortable-list";
import type { ExerciseWithMax, SlotSetGroup, WorkoutKind } from "@/lib/types";
import { defaultSlotGroup } from "@/lib/workout/slot-plan";
import { MAX_SLOT_GROUPS } from "@/lib/workout/slot-plan-schema";

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
          <SlotPlanGroupRow
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

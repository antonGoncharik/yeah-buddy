"use client";

import { TemplateExercisePickerAddSection } from "@/components/workout/template-exercise-picker-add-section";
import { TemplateExercisePickerSelectedSection } from "@/components/workout/template-exercise-picker-selected-section";
import { useTemplateExercisePicker } from "@/components/workout/use-template-exercise-picker";
import type { TemplateFormSlot } from "@/components/workout/use-template-form";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  SlotPlan,
  WorkoutKind,
} from "@/lib/types";

export function TemplateExercisePicker({
  kind,
  selected,
  available,
  cycle,
  onReorder,
  onToggle,
  onPlanChange,
}: {
  kind: WorkoutKind;
  selected: TemplateFormSlot[];
  available: ExerciseWithMax[];
  cycle: CyclePhaseDef[];
  onReorder: (next: TemplateFormSlot[]) => void;
  onToggle: (id: string) => void;
  onPlanChange: (exerciseId: string, plan: SlotPlan | null) => void;
}) {
  const { query, setQuery, openId, setOpenId, needle, ordered, showSearch } =
    useTemplateExercisePicker(available);

  return (
    <>
      <TemplateExercisePickerSelectedSection
        kind={kind}
        selected={selected}
        cycle={cycle}
        openId={openId}
        onOpenIdChange={setOpenId}
        onReorder={onReorder}
        onToggle={onToggle}
        onPlanChange={onPlanChange}
      />
      <TemplateExercisePickerAddSection
        availableCount={available.length}
        showSearch={showSearch}
        query={query}
        onQueryChange={setQuery}
        needle={needle}
        ordered={ordered}
        onToggle={onToggle}
      />
    </>
  );
}

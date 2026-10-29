"use client";

import { SectionHeading } from "@/components/layout/section-heading";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SlotPlanEditor } from "@/components/workout/slot-plan-editor";
import { SortableList } from "@/components/workout/sortable-list";
import type { TemplateFormSlot } from "@/components/workout/use-template-form";
import type { CyclePhaseDef, SlotPlan, WorkoutKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { slotPlanSummary } from "@/lib/workout/slot-plan";

export function TemplateExercisePickerSelectedSection({
  kind,
  selected,
  cycle,
  openId,
  onOpenIdChange,
  onReorder,
  onToggle,
  onPlanChange,
}: {
  kind: WorkoutKind;
  selected: TemplateFormSlot[];
  cycle: CyclePhaseDef[];
  openId: string | null;
  onOpenIdChange: (id: string | null) => void;
  onReorder: (next: TemplateFormSlot[]) => void;
  onToggle: (id: string) => void;
  onPlanChange: (exerciseId: string, plan: SlotPlan | null) => void;
}) {
  const rows = selected.map((slot) => ({ id: slot.exercise.id, ...slot }));

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading
        title="Упражнения"
        hint={
          selected.length > 1 ? "Потяни за номер — порядок в зале." : undefined
        }
      />
      {selected.length === 0 ? (
        <p className="card-surface px-5 py-4 text-base text-muted-foreground">
          Пока пусто. Добавь из списка ниже.
        </p>
      ) : (
        <div className="card-surface px-3 py-1">
          <SortableList
            items={rows}
            disabled={openId != null}
            onReorder={(next) =>
              onReorder(next.map(({ exercise, plan }) => ({ exercise, plan })))
            }
            renderItem={(row) => {
              const open = openId === row.id;
              const summary = slotPlanSummary(row.plan, cycle);
              return (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={open}
                    className={cn(
                      "min-w-0 flex-1 rounded-lg px-1 py-1 text-left",
                      open && "text-primary",
                    )}
                    onClick={() => onOpenIdChange(open ? null : row.id)}
                  >
                    <p className="truncate text-base font-medium leading-snug">
                      {exerciseShortLabel(
                        row.exercise.short_name,
                        row.exercise.name,
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-sm leading-snug text-muted-foreground">
                      {summary ?? "как в плане"}
                    </p>
                  </button>
                  <RemoveRowButton onClick={() => onToggle(row.id)} />
                </div>
              );
            }}
            renderAfter={(row) =>
              openId === row.id ? (
                <SlotPlanEditor
                  kind={kind}
                  exercise={row.exercise}
                  plan={row.plan}
                  cycle={cycle}
                  onChange={(plan) => onPlanChange(row.id, plan)}
                />
              ) : null
            }
          />
        </div>
      )}
    </section>
  );
}

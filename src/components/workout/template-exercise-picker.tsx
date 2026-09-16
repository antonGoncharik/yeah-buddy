"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Input } from "@/components/ui/input";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SlotPlanEditor } from "@/components/workout/slot-plan-editor";
import { SortableList } from "@/components/workout/sortable-list";
import type { TemplateFormSlot } from "@/components/workout/use-template-form";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  SlotPlan,
  WorkoutKind,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";
import { slotPlanSummary } from "@/lib/workout/slot-plan";

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
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? available.filter((exercise) =>
        `${exercise.name} ${exercise.short_name ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : available;
  // Exercises with a 1ПМ are the ones actually in use — first.
  const ordered = [...matches].sort((a, b) => {
    const aMax = a.current_max?.max_weight ?? 0;
    const bMax = b.current_max?.max_weight ?? 0;
    if (aMax > 0 !== bMax > 0) {
      return aMax > 0 ? -1 : 1;
    }
    return 0;
  });
  const rows = selected.map((slot) => ({ id: slot.exercise.id, ...slot }));

  return (
    <>
      <section className="flex flex-col gap-2">
        <SectionHeading
          title="Упражнения"
          hint={[
            "Порядок в списке — порядок в зале.",
            selected.length > 1 ? "Потяни за номер слева." : null,
            cycle.length > 0
              ? "Нажми на упражнение — свои подходы и вес, можно отдельно на неделю."
              : "Нажми на упражнение — свои подходы и вес.",
          ]
            .filter(Boolean)
            .join(" ")}
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
                onReorder(
                  next.map(({ exercise, plan }) => ({ exercise, plan })),
                )
              }
              renderItem={(row) => {
                const open = openId === row.id;
                const summary = slotPlanSummary(row.plan, cycle);
                return (
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-expanded={open}
                        className={cn(
                          "min-w-0 flex-1 rounded-lg px-1 py-1 text-left",
                          open && "text-primary",
                        )}
                        onClick={() => setOpenId(open ? null : row.id)}
                      >
                        <p className="text-base font-medium leading-snug">
                          {exerciseShortLabel(
                            row.exercise.short_name,
                            row.exercise.name,
                          )}
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                          {summary ?? "по общему плану"}
                        </p>
                      </button>
                      <RemoveRowButton onClick={() => onToggle(row.id)} />
                    </div>
                    {open ? (
                      <SlotPlanEditor
                        kind={kind}
                        exercise={row.exercise}
                        plan={row.plan}
                        cycle={cycle}
                        onChange={(plan) => onPlanChange(row.id, plan)}
                      />
                    ) : null}
                  </div>
                );
              }}
            />
          </div>
        )}
      </section>

      {available.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionHeading title="Добавить" />
          {available.length > 8 ? (
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти упражнение"
              className="h-12 text-base"
              inputMode="search"
              enterKeyHint="search"
            />
          ) : null}
          {ordered.length === 0 ? (
            <p className="px-1 text-base text-muted-foreground">
              Ничего не нашлось.
            </p>
          ) : (
            <ul className="card-surface divide-y divide-border/70 px-5 py-1">
              {ordered.map((exercise) => {
                const max = exercise.current_max?.max_weight ?? 0;
                return (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-muted/40"
                      onClick={() => onToggle(exercise.id)}
                    >
                      <span className="min-w-0 flex-1 truncate text-base">
                        {exerciseShortLabel(exercise.short_name, exercise.name)}
                      </span>
                      {max > 0 ? (
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                          {formatWeight(max)} кг
                        </span>
                      ) : null}
                      <Plus
                        className="size-5 shrink-0 text-primary"
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

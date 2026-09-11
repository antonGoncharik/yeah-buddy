"use client";

import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { TemplateExercisePicker } from "@/components/workout/template-exercise-picker";
import { useTemplateForm } from "@/components/workout/use-template-form";
import type { WorkoutKind } from "@/lib/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

const KIND_OPTIONS: Array<{ id: WorkoutKind; label: string }> = [
  { id: "dynamic", label: WORKOUT_KIND_LABELS.dynamic },
  { id: "static", label: WORKOUT_KIND_LABELS.static },
];

export function TemplateForm({ templateId }: { templateId?: string }) {
  const {
    name,
    setName,
    kind,
    setKind,
    isActive,
    setIsActive,
    loading,
    saving,
    error,
    selected,
    available,
    toggleExercise,
    setExerciseIds,
    onSubmit,
  } = useTemplateForm({ templateId });

  return (
    <form className="flex flex-col gap-5 pb-24" onSubmit={onSubmit}>
      {loading ? (
        <ScreenLoading />
      ) : (
        <>
          <Field label="Название">
            <Input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 text-base"
            />
          </Field>

          <Field label="Очередь">
            <Segmented
              value={isActive ? "on" : "off"}
              options={[
                { id: "on", label: "В очереди" },
                { id: "off", label: "Отложить" },
              ]}
              onChange={(id) => setIsActive(id === "on")}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              В очереди или отложить.
            </p>
          </Field>

          <Field label="Тип">
            <Segmented value={kind} options={KIND_OPTIONS} onChange={setKind} />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Повторы или на время.
            </p>
          </Field>

          <TemplateExercisePicker
            selected={selected}
            available={available}
            onReorder={(next) =>
              setExerciseIds(next.map((exercise) => exercise.id))
            }
            onToggle={toggleExercise}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <StickyActions>
            <Button type="submit" className="h-14 text-lg" disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </StickyActions>
        </>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>
      {children}
    </div>
  );
}

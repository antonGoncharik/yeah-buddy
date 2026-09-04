"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { SortButtons } from "@/components/workout/sort-buttons";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  ExerciseWithMax,
  WorkoutKind,
  WorkoutTemplateDetail,
} from "@/lib/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

const KIND_OPTIONS: Array<{ id: WorkoutKind; label: string }> = [
  { id: "dynamic", label: WORKOUT_KIND_LABELS.dynamic },
  { id: "static", label: WORKOUT_KIND_LABELS.static },
];

export function TemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<WorkoutKind>("dynamic");
  const [isActive, setIsActive] = useState(true);
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const exercisesResponse = await fetch("/api/exercises?filter=active");
        if (!exercisesResponse.ok) {
          throw new Error("load failed");
        }
        const exercisesData: unknown = await exercisesResponse.json();
        const list = readExercises(exercisesData);
        if (!cancelled) {
          setCatalog(list);
        }

        if (!templateId) {
          return;
        }

        const response = await fetch(`/api/templates/${templateId}`);
        if (response.status === 404) {
          if (!cancelled) {
            setError("Шаблон не найден.");
          }
          return;
        }
        if (!response.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await response.json();
        const template = readTemplate(data);
        if (!template || cancelled) {
          return;
        }

        setName(template.name);
        setKind(template.kind);
        setIsActive(template.is_active);
        setExerciseIds(template.exercises.map((exercise) => exercise.id));
      } catch {
        if (!cancelled) {
          setError(LOAD_FAILED);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  function toggleExercise(id: string) {
    setExerciseIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function move(id: string, direction: -1 | 1) {
    setExerciseIds((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const item = next[index];
      const swap = next[nextIndex];
      if (!item || !swap) {
        return current;
      }

      next[index] = swap;
      next[nextIndex] = item;
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Проверьте поля формы.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        templateId ? `/api/templates/${templateId}` : "/api/templates",
        {
          method: templateId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmed,
            kind,
            is_active: isActive,
            exercise_ids: exerciseIds,
          }),
        },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      router.push("/workouts/schedule");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  const selected = exerciseIds.flatMap((id) => {
    const exercise = catalog.find((item) => item.id === id);
    return exercise ? [exercise] : [];
  });
  const available = catalog.filter(
    (exercise) => !exerciseIds.includes(exercise.id),
  );

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {loading ? (
        <p className="py-10 text-center text-muted-foreground">Загрузка…</p>
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

          <Field label="Тип">
            <Segmented value={kind} options={KIND_OPTIONS} onChange={setKind} />
          </Field>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-medium">Состав</h2>
              {selected.length > 1 ? (
                <button
                  type="button"
                  className="text-sm font-medium text-primary"
                  onClick={() => setSorting((current) => !current)}
                >
                  {sorting ? "Готово" : "Порядок"}
                </button>
              ) : null}
            </div>
            {selected.length === 0 ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Порядок в списке — порядок в зале.
              </p>
            ) : (
              <div className="card-surface overflow-hidden">
                {selected.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-1 border-b border-border/70 px-2 py-1 last:border-b-0"
                  >
                    <span className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 px-1 text-base font-medium leading-snug">
                      {exercise.short_name || exercise.name}
                    </p>
                    {sorting ? (
                      <SortButtons
                        disableUp={index === 0}
                        disableDown={index === selected.length - 1}
                        onUp={() => move(exercise.id, -1)}
                        onDown={() => move(exercise.id, 1)}
                      />
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      className="size-11"
                      aria-label="Убрать"
                      onClick={() => toggleExercise(exercise.id)}
                    >
                      <X className="size-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {available.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-base font-medium">Добавить</h2>
              <div className="flex flex-wrap gap-2">
                {available.map((exercise) => (
                  <Button
                    key={exercise.id}
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full px-3.5 text-sm font-medium"
                    onClick={() => toggleExercise(exercise.id)}
                  >
                    {exercise.short_name || exercise.name}
                  </Button>
                ))}
              </div>
            </section>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="h-14 text-lg" disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
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

function readExercises(data: unknown): ExerciseWithMax[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercises" in data) ||
    !Array.isArray(data.exercises)
  ) {
    return [];
  }

  return data.exercises as ExerciseWithMax[];
}

function readTemplate(data: unknown): WorkoutTemplateDetail | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("template" in data) ||
    !data.template
  ) {
    return null;
  }

  return data.template as WorkoutTemplateDetail;
}

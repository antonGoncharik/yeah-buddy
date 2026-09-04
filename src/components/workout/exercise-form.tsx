"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, nativeSelectClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  ExerciseCategory,
  ExerciseUnit,
  ExerciseWithMax,
  ExerciseWorkoutType,
} from "@/lib/types";
import {
  defaultUnitForWorkoutType,
  EXERCISE_CATEGORIES,
  EXERCISE_CATEGORY_LABELS,
  EXERCISE_UNIT_LABELS,
  EXERCISE_UNITS,
  EXERCISE_WORKOUT_TYPE_LABELS,
  EXERCISE_WORKOUT_TYPES,
} from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

type FormState = {
  name: string;
  short_name: string;
  category: ExerciseCategory;
  workout_type: ExerciseWorkoutType;
  unit: ExerciseUnit;
  max_weight: string;
};

export function ExerciseForm({ exercise }: { exercise?: ExerciseWithMax }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(exercise));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = toPayload(form, Boolean(exercise));
      if (!payload) {
        setError("Проверьте поля формы.");
        return;
      }

      const response = await fetch(
        exercise ? `/api/exercises/${exercise.id}` : "/api/exercises",
        {
          method: exercise ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      router.push("/workouts/exercises");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(archived: boolean) {
    if (!exercise) {
      return;
    }

    const confirmed = window.confirm(
      archived
        ? "Архивировать упражнение? История сохранится."
        : "Вернуть упражнение из архива?",
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setArchiving(true);

    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });

      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      router.push("/workouts/exercises");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <form className="animate-rise flex flex-col gap-4" onSubmit={onSubmit}>
      <Field label="Название">
        <Input
          required
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
          className="h-12 text-base"
        />
      </Field>

      <Field label="Короткое название">
        <Input
          value={form.short_name}
          placeholder="плечелучевая"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              short_name: event.target.value,
            }))
          }
          className="h-12 text-base"
        />
      </Field>

      <Field label="Категория">
        <select
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value as ExerciseCategory,
            }))
          }
          className={nativeSelectClassName}
        >
          {EXERCISE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {EXERCISE_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Тип тренировки">
        <select
          value={form.workout_type}
          onChange={(event) => {
            const workoutType = event.target.value as ExerciseWorkoutType;
            setForm((current) => ({
              ...current,
              workout_type: workoutType,
              unit: defaultUnitForWorkoutType(workoutType),
            }));
          }}
          className={nativeSelectClassName}
        >
          {EXERCISE_WORKOUT_TYPES.map((type) => (
            <option key={type} value={type}>
              {EXERCISE_WORKOUT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </Field>

      {form.workout_type === "both" ? (
        <Field label="Единица по умолчанию">
          <select
            value={form.unit}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                unit: event.target.value as ExerciseUnit,
              }))
            }
            className={nativeSelectClassName}
          >
            {EXERCISE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {EXERCISE_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {exercise ? (
        <div className="card-surface flex flex-col gap-2 px-5 py-4">
          <p className="text-base font-medium">Рекорд</p>
          <p className="text-2xl font-semibold tracking-tight">
            {exercise.current_max
              ? `${formatWeight(exercise.current_max.max_weight)} кг`
              : "ещё нет"}
          </p>
          <p className="text-sm text-muted-foreground">
            Рекорд только растёт: при рабочем весе выше текущего он обновится
            сам.
          </p>
        </div>
      ) : (
        <Field label="Начальный максимум, кг">
          <Input
            required
            inputMode="decimal"
            value={form.max_weight}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                max_weight: event.target.value,
              }))
            }
            className="h-12 text-base"
          />
        </Field>
      )}

      {exercise && exercise.max_history.length > 1 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">История рекордов</h2>
          <ul className="card-surface divide-y divide-border/70">
            {exercise.max_history.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-base"
              >
                <span>{formatWeight(record.max_weight)} кг</span>
                <span className="text-sm text-muted-foreground">
                  {record.achieved_at}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        className="h-12 text-base"
        disabled={saving || archiving}
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>

      {exercise ? (
        <Button
          type="button"
          variant={exercise.is_active ? "destructive" : "secondary"}
          className="h-12 text-base"
          disabled={saving || archiving}
          onClick={() => void onArchive(exercise.is_active)}
        >
          {archiving
            ? "Сохранение…"
            : exercise.is_active
              ? "В архив"
              : "Вернуть из архива"}
        </Button>
      ) : null}
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

function toFormState(exercise?: ExerciseWithMax): FormState {
  return {
    name: exercise?.name ?? "",
    short_name: exercise?.short_name ?? "",
    category: exercise?.category ?? "armwrestling",
    workout_type: exercise?.workout_type ?? "dynamic",
    unit: exercise?.unit ?? "reps",
    max_weight: "",
  };
}

function toPayload(form: FormState, isEdit: boolean) {
  if (!form.name.trim()) {
    return null;
  }

  if (isEdit) {
    return {
      name: form.name.trim(),
      short_name: form.short_name.trim() === "" ? null : form.short_name.trim(),
      category: form.category,
      workout_type: form.workout_type,
      unit: form.unit,
    };
  }

  const maxWeight = parseDecimal(form.max_weight);
  if (maxWeight == null || maxWeight <= 0) {
    return null;
  }

  return {
    name: form.name.trim(),
    short_name: form.short_name.trim() === "" ? null : form.short_name.trim(),
    category: form.category,
    workout_type: form.workout_type,
    unit: form.unit,
    max_weight: maxWeight,
  };
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input, nativeSelectClassName } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type {
  ExerciseCategory,
  ExerciseWithMax,
  ExerciseWorkoutType,
  FormulaPreset,
} from "@/lib/types";
import {
  EXERCISE_WORKOUT_TYPE_LABELS,
  EXERCISE_WORKOUT_TYPES,
  FORMULA_PRESET_LABELS,
  FORMULA_PRESETS,
  WEIGHT_STEP_OPTIONS,
} from "@/lib/workout/labels";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

type FormState = {
  name: string;
  short_name: string;
  workout_type: ExerciseWorkoutType;
  weight_step: number;
  formula_preset: FormulaPreset;
  max_weight: string;
};

export function ExerciseForm({ exercise }: { exercise?: ExerciseWithMax }) {
  const router = useRouter();
  const confirm = useConfirm();
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

    const confirmed = await confirm({
      message: archived ? "В архив? История останется." : "Вернуть из архива?",
      confirmLabel: archived ? "В архив" : "Вернуть",
      cancelLabel: "Оставить",
      destructive: archived,
    });
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

      <Field label="Кратко">
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

      <Field label="Тип">
        <Segmented
          value={form.workout_type}
          options={EXERCISE_WORKOUT_TYPES.map((type) => ({
            id: type,
            label: EXERCISE_WORKOUT_TYPE_LABELS[type],
          }))}
          onChange={(workout_type) =>
            setForm((current) => ({
              ...current,
              workout_type,
              ...(workout_type === "both" || workout_type === "static"
                ? { weight_step: 1, formula_preset: "cable" as const }
                : current.workout_type === "both" ||
                    current.workout_type === "static"
                  ? { weight_step: 2.5, formula_preset: "barbell" as const }
                  : {}),
            }))
          }
        />
      </Field>

      <Field label="Шаг веса">
        <Segmented
          value={String(form.weight_step)}
          options={WEIGHT_STEP_OPTIONS.map((step) => ({
            id: String(step),
            label: `${step} кг`,
          }))}
          onChange={(step) =>
            setForm((current) => ({
              ...current,
              weight_step: Number(step),
            }))
          }
        />
      </Field>

      <Field label="Разминка">
        <select
          value={form.formula_preset}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              formula_preset: event.target.value as FormulaPreset,
            }))
          }
          className={nativeSelectClassName}
        >
          {FORMULA_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {FORMULA_PRESET_LABELS[preset]}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">
          Только разминка. Рабочие — в Схеме.
        </p>
      </Field>

      {exercise ? (
        <div className="card-surface flex flex-col gap-2 px-5 py-4">
          <p className="text-base font-medium">Максимум</p>
          <p className="text-2xl font-semibold tracking-tight">
            {exercise.current_max
              ? `${formatWeight(exercise.current_max.max_weight)} кг`
              : "не задан"}
          </p>
          <p className="text-sm text-muted-foreground">
            От него считаются веса. Меняется на переходе фазы.
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
          <h2 className="text-base font-medium">Рекорды</h2>
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
    workout_type: exercise?.workout_type ?? "dynamic",
    weight_step: exercise?.weight_step ?? 2.5,
    formula_preset: exercise?.formula_preset ?? "barbell",
    max_weight: "",
  };
}

function toPayload(form: FormState, isEdit: boolean) {
  if (!form.name.trim()) {
    return null;
  }

  const category: ExerciseCategory =
    form.workout_type === "both" ? "armwrestling" : "base";
  const unit = form.workout_type === "static" ? "seconds" : "reps";
  const shared = {
    name: form.name.trim(),
    short_name: form.short_name.trim() === "" ? null : form.short_name.trim(),
    category,
    workout_type: form.workout_type,
    unit,
    weight_step: form.weight_step,
    formula_preset: form.formula_preset,
  };

  if (isEdit) {
    return shared;
  }

  const maxWeight = parseDecimal(form.max_weight);
  if (maxWeight == null || maxWeight <= 0) {
    return null;
  }

  return {
    ...shared,
    max_weight: maxWeight,
  };
}

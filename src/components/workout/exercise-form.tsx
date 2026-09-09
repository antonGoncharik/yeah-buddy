"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StickyActions } from "@/components/layout/sticky-actions";
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
import { isFormulaPreset } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

type FormState = {
  name: string;
  short_name: string;
  workout_type: ExerciseWorkoutType;
  category: ExerciseCategory;
  weight_step: number;
  formula_preset: FormulaPreset;
  max_weight: string;
};

export function ExerciseForm({ exercise }: { exercise?: ExerciseWithMax }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(exercise));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [canCorrectMax, setCanCorrectMax] = useState(!exercise);
  const [active, setActive] = useState(exercise?.is_active !== false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!exercise) {
      return;
    }

    let cancelled = false;

    async function loadMacro() {
      try {
        const response = await fetch("/api/macros");
        const data: unknown = await response.json().catch(() => null);
        if (cancelled || !response.ok) {
          return;
        }

        const phase =
          data && typeof data === "object" && "phase" in data
            ? data.phase
            : true;
        setCanCorrectMax(phase == null);
      } catch {
        // Keep the field locked until we know there is no current phase.
      }
    }

    void loadMacro();

    return () => {
      cancelled = true;
    };
  }, [exercise]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = toPayload(form, Boolean(exercise), canCorrectMax);
      if (!payload) {
        setError("Проверь поля.");
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

  async function toggleActive(nextActive: boolean) {
    if (!exercise || nextActive === active) {
      return;
    }

    setToggling(true);
    setError(null);

    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !nextActive }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }
      setActive(nextActive);
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setToggling(false);
    }
  }

  return (
    <form className="flex flex-col gap-4 pb-36" onSubmit={onSubmit}>
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
          placeholder="жим"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              short_name: event.target.value,
            }))
          }
          className="h-12 text-base"
        />
      </Field>

      {exercise ? (
        <Field label="В работе">
          <Segmented
            value={active ? "yes" : "no"}
            disabled={toggling}
            options={[
              { id: "yes", label: "Делаю" },
              { id: "no", label: "Не делаю" },
            ]}
            onChange={(value) => void toggleActive(value === "yes")}
          />
        </Field>
      ) : null}

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

      <Field label="Категория">
        <Segmented
          value={form.category === "isolation" ? "isolation" : "base"}
          options={[
            { id: "base", label: "База" },
            { id: "isolation", label: "Изоляция" },
          ]}
          onChange={(category) =>
            setForm((current) => ({
              ...current,
              category: category as "base" | "isolation",
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
          onChange={(event) => {
            const preset = event.target.value;
            if (!isFormulaPreset(preset)) {
              return;
            }
            setForm((current) => ({
              ...current,
              formula_preset: preset,
            }));
          }}
          className={nativeSelectClassName}
        >
          {FORMULA_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {FORMULA_PRESET_LABELS[preset]}
            </option>
          ))}
        </select>
        <p className="text-base leading-relaxed text-muted-foreground">
          {warmupHint(form.formula_preset)}
        </p>
      </Field>

      {exercise && !canCorrectMax ? (
        <div className="card-surface flex scroll-mb-36 flex-col gap-2 px-5 py-4">
          <p className="text-base font-medium">Максимум</p>
          <p className="text-2xl font-semibold tracking-tight">
            {exercise.current_max
              ? `${formatWeight(exercise.current_max.max_weight)} кг`
              : "не задан"}
          </p>
          <p className="text-sm text-muted-foreground">
            От него считаются веса в зале. Поднять можно на смене фазы.
          </p>
        </div>
      ) : (
        <Field label="Рабочий вес, кг">
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
            className="h-12 scroll-mb-36 text-base"
          />
          {exercise ? (
            <p className="text-sm text-muted-foreground">
              От него считаются веса в зале. Пока нет макроцикла, можно
              поправить здесь.
            </p>
          ) : null}
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

      <StickyActions>
        <Button type="submit" className="h-14 text-lg" disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      </StickyActions>
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

function warmupHint(preset: FormulaPreset): string {
  if (preset === "barbell") {
    return "Разминка как у штанги — проценты из схемы. На статике третий подход обычно 2 с на 1ПМ.";
  }
  if (preset === "cable") {
    return "Разминка как у блока — из схемы. На статике тоже можно поставить удержание на 1ПМ.";
  }
  return "В план само не попадёт. Если понадобится сегодня — в зале есть «Добавить упражнение».";
}

function toFormState(exercise?: ExerciseWithMax): FormState {
  return {
    name: exercise?.name ?? "",
    short_name: exercise?.short_name ?? "",
    workout_type: exercise?.workout_type ?? "dynamic",
    category: exercise?.category === "isolation" ? "isolation" : "base",
    weight_step: exercise?.weight_step ?? 2.5,
    formula_preset: exercise?.formula_preset ?? "barbell",
    max_weight: exercise?.current_max
      ? formatWeight(exercise.current_max.max_weight)
      : "",
  };
}

function toPayload(form: FormState, isEdit: boolean, canCorrectMax: boolean) {
  if (!form.name.trim()) {
    return null;
  }

  const category: ExerciseCategory =
    form.category === "isolation" ? "isolation" : "base";
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

  if (isEdit && !canCorrectMax) {
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

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FOOD_STATE_LABELS, FOOD_STATES } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";
import { calcKcalFromMacros, formatKcal } from "@/lib/nutrition";
import type { Food, FoodState } from "@/lib/types";

type FormState = {
  name: string;
  brand: string;
  state: FoodState;
  protein_per_100: string;
  fat_per_100: string;
  carbs_per_100: string;
  kcal_per_100: string;
  default_portion_g: string;
  default_portion_label: string;
  notes: string;
  is_favorite: boolean;
};

export function FoodForm({ food }: { food?: Food }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toFormState(food));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const autoKcal = useMemo(() => {
    const protein = Number(form.protein_per_100);
    const fat = Number(form.fat_per_100);
    const carbs = Number(form.carbs_per_100);
    if (![protein, fat, carbs].every(Number.isFinite)) {
      return null;
    }

    return calcKcalFromMacros(protein, fat, carbs);
  }, [form.protein_per_100, form.fat_per_100, form.carbs_per_100]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = toPayload(form, autoKcal);
      if (!payload) {
        setError("Проверьте поля формы.");
        return;
      }

      const response = await fetch(
        food ? `/api/foods/${food.id}` : "/api/foods",
        {
          method: food ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readError(data) ?? LOAD_FAILED);
        return;
      }

      router.push("/foods");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!food) {
      return;
    }

    if (!window.confirm("Удалить продукт?")) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/foods/${food.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readError(data) ?? LOAD_FAILED);
        return;
      }

      router.push("/foods");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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

      <Field label="Бренд">
        <Input
          value={form.brand}
          onChange={(event) =>
            setForm((current) => ({ ...current, brand: event.target.value }))
          }
          className="h-12 text-base"
        />
      </Field>

      <Field label="Состояние">
        <select
          value={form.state}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              state: event.target.value as FoodState,
            }))
          }
          className="h-12 w-full rounded-lg border border-input bg-transparent px-2.5 text-base"
        >
          {FOOD_STATES.map((state) => (
            <option key={state} value={state}>
              {FOOD_STATE_LABELS[state]}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Белки на 100 г">
          <Input
            required
            inputMode="decimal"
            value={form.protein_per_100}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                protein_per_100: event.target.value,
              }))
            }
            className="h-12 text-base"
          />
        </Field>
        <Field label="Жиры на 100 г">
          <Input
            required
            inputMode="decimal"
            value={form.fat_per_100}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                fat_per_100: event.target.value,
              }))
            }
            className="h-12 text-base"
          />
        </Field>
        <Field label="Углеводы на 100 г">
          <Input
            required
            inputMode="decimal"
            value={form.carbs_per_100}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                carbs_per_100: event.target.value,
              }))
            }
            className="h-12 text-base"
          />
        </Field>
        <Field
          label={
            autoKcal == null
              ? "Ккал на 100 г"
              : `Ккал на 100 г (${formatKcal(autoKcal)})`
          }
        >
          <Input
            inputMode="decimal"
            value={form.kcal_per_100}
            placeholder={autoKcal == null ? "" : formatKcal(autoKcal)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                kcal_per_100: event.target.value,
              }))
            }
            className="h-12 text-base"
          />
        </Field>
      </div>

      <Field label="Стандартная порция в граммах">
        <Input
          inputMode="decimal"
          value={form.default_portion_g}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              default_portion_g: event.target.value,
            }))
          }
          className="h-12 text-base"
        />
      </Field>

      <Field label="Название стандартной порции">
        <Input
          value={form.default_portion_label}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              default_portion_label: event.target.value,
            }))
          }
          className="h-12 text-base"
        />
      </Field>

      <Field label="Заметки">
        <Textarea
          value={form.notes}
          onChange={(event) =>
            setForm((current) => ({ ...current, notes: event.target.value }))
          }
          className="min-h-24 text-base"
        />
      </Field>

      <label className="flex min-h-12 items-center gap-3 text-base font-medium">
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              is_favorite: event.target.checked,
            }))
          }
          className="size-5"
        />
        Избранное
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        type="submit"
        className="h-12 text-base"
        disabled={saving || deleting}
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>

      {food ? (
        <Button
          type="button"
          variant="destructive"
          className="h-12 text-base"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "Удаление…" : "Удалить"}
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

function toFormState(food?: Food): FormState {
  return {
    name: food?.name ?? "",
    brand: food?.brand ?? "",
    state: food?.state ?? "as_is",
    protein_per_100: food ? String(food.protein_per_100) : "",
    fat_per_100: food ? String(food.fat_per_100) : "",
    carbs_per_100: food ? String(food.carbs_per_100) : "",
    kcal_per_100: food ? String(food.kcal_per_100) : "",
    default_portion_g:
      food?.default_portion_g == null ? "" : String(food.default_portion_g),
    default_portion_label: food?.default_portion_label ?? "",
    notes: food?.notes ?? "",
    is_favorite: food?.is_favorite ?? false,
  };
}

function toPayload(
  form: FormState,
  autoKcal: number | null,
): {
  name: string;
  brand: string | null;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number | null;
  default_portion_g: number | null;
  default_portion_label: string | null;
  notes: string | null;
  is_favorite: boolean;
} | null {
  const protein = Number(form.protein_per_100.replace(",", "."));
  const fat = Number(form.fat_per_100.replace(",", "."));
  const carbs = Number(form.carbs_per_100.replace(",", "."));
  const kcalRaw = form.kcal_per_100.trim().replace(",", ".");
  const portionRaw = form.default_portion_g.trim().replace(",", ".");

  if (!form.name.trim()) {
    return null;
  }

  if (
    ![protein, fat, carbs].every(
      (value) => Number.isFinite(value) && value >= 0,
    )
  ) {
    return null;
  }

  let kcal_per_100: number | null = null;
  if (kcalRaw !== "") {
    const kcal = Number(kcalRaw);
    if (!Number.isFinite(kcal) || kcal < 0) {
      return null;
    }
    kcal_per_100 = kcal;
  } else if (autoKcal != null) {
    kcal_per_100 = autoKcal;
  }

  let default_portion_g: number | null = null;
  if (portionRaw !== "") {
    const portion = Number(portionRaw);
    if (!Number.isFinite(portion) || portion <= 0) {
      return null;
    }
    default_portion_g = portion;
  }

  return {
    name: form.name.trim(),
    brand: form.brand.trim() === "" ? null : form.brand.trim(),
    state: form.state,
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
    kcal_per_100,
    default_portion_g,
    default_portion_label:
      form.default_portion_label.trim() === ""
        ? null
        : form.default_portion_label.trim(),
    notes: form.notes.trim() === "" ? null : form.notes.trim(),
    is_favorite: form.is_favorite,
  };
}

function readError(data: unknown): string | null {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return null;
}

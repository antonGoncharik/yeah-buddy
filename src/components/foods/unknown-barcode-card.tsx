"use client";

import { type FormEvent, useState } from "react";

import {
  FoodFormField,
  FoodMacrosFields,
} from "@/components/foods/food-form-fields";
import {
  parseNonneg,
  toFormState,
  toPayload,
} from "@/components/foods/food-form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api-cache";
import { readFoodPayload } from "@/lib/foods";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import { calcKcalFromMacros } from "@/lib/nutrition";
import type { Food } from "@/lib/types";

export function UnknownBarcodeCard({
  ean,
  onSaved,
}: {
  ean: string;
  onSaved: (food: Food) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const proteinValue = protein.trim() === "" ? null : parseNonneg(protein);
  const fatValue = fat.trim() === "" ? null : parseNonneg(fat);
  const carbsValue = carbs.trim() === "" ? null : parseNonneg(carbs);
  const autoKcal =
    proteinValue == null || fatValue == null || carbsValue == null
      ? null
      : calcKcalFromMacros(proteinValue, fatValue, carbsValue);
  const form = {
    ...toFormState(),
    name,
    protein_per_100: protein,
    fat_per_100: fat,
    carbs_per_100: carbs,
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = toPayload(form, autoKcal);
    if (!payload) {
      setError(CHECK_FIELDS);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const data = await postJson("/api/foods", {
        ...payload,
        barcode: ean,
      });
      const food = readFoodPayload(data);
      if (!food) {
        throw new Error(LOAD_FAILED);
      }
      await onSaved(food);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="card-surface animate-rise flex flex-col gap-4 px-5 py-4"
      onSubmit={(event) => void onSubmit(event)}
    >
      <div>
        <p className="text-base font-medium">Своя пачка</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          Этого кода нет в каталоге. Название и БЖУ с упаковки — код останется в
          твоих продуктах.
        </p>
        <p className="mt-2 text-sm tabular-nums tracking-wide text-muted-foreground">
          {ean}
        </p>
      </div>
      <FoodFormField label="Название">
        <Input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleNumericEnter}
          enterKeyHint="next"
          className="h-12 text-base"
        />
      </FoodFormField>
      <FoodMacrosFields
        form={form}
        autoKcal={autoKcal}
        onChange={(patch) => {
          if (patch.protein_per_100 != null) {
            setProtein(patch.protein_per_100);
          }
          if (patch.fat_per_100 != null) {
            setFat(patch.fat_per_100);
          }
          if (patch.carbs_per_100 != null) {
            setCarbs(patch.carbs_per_100);
          }
        }}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="h-12 text-base" disabled={saving}>
        {saving ? "Запоминаю…" : "Запомнить"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";

import {
  moveMealItemToMeal,
  saveLumpMealItem,
} from "@/components/day/grams-save";
import { MealMoveButtons } from "@/components/day/meal-move-buttons";
import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lumpMealItemSchema } from "@/lib/day/lump";
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
import { haptic } from "@/lib/telegram/haptic";
import type { MealItem, MealType } from "@/lib/types";

export function MealLumpSheet({
  item,
  date,
  meals = [],
  onClose,
}: {
  item: MealItem;
  date: string;
  meals?: ReadonlyArray<{ id: string; meal_type: MealType }>;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name_snapshot);
  const [kcal, setKcal] = useState(draftNumber(item.kcal));
  const [protein, setProtein] = useState(draftNumber(item.protein));
  const [fat, setFat] = useState(draftNumber(item.fat));
  const [carbs, setCarbs] = useState(draftNumber(item.carbs));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (saving) {
      return;
    }
    const parsed = lumpMealItemSchema.safeParse({
      name,
      protein: readNumber(protein),
      fat: readNumber(fat),
      carbs: readNumber(carbs),
      kcal: readNumber(kcal),
    });
    if (!parsed.success) {
      haptic("warn");
      setError("Напиши название и калории или БЖУ.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveLumpMealItem({ date, itemId: item.id, input: parsed.data });
      haptic("commit");
      onClose();
    } catch (caught) {
      haptic("error");
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Не сохранилось.");
    }
  }

  return (
    <SheetFrame title="Только калории" onCancel={onClose}>
      <Input
        value={name}
        aria-label="Название"
        className="h-12 text-base"
        onChange={(event) => setName(event.target.value)}
      />
      <NumberField label="Ккал" value={kcal} onChange={setKcal} />
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Белки" value={protein} onChange={setProtein} />
        <NumberField label="Жиры" value={fat} onChange={setFat} />
        <NumberField label="Углеводы" value={carbs} onChange={setCarbs} />
      </div>
      {error ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
      <MealMoveButtons
        meals={meals}
        currentMealId={item.meal_id}
        itemId={item.id}
        disabled={saving}
        onMove={(mealId) => {
          void (async () => {
            setSaving(true);
            setError(null);
            try {
              await moveMealItemToMeal({ date, item, mealId });
              haptic("commit");
              onClose();
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : "Не перенеслось.",
              );
            } finally {
              setSaving(false);
            }
          })();
        }}
      />
      <Button
        type="button"
        className="h-12 w-full text-base"
        disabled={saving}
        onClick={() => void onSave()}
      >
        {saving ? "Сохраняю…" : "Записать"}
      </Button>
    </SheetFrame>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Input
        inputMode="decimal"
        value={value}
        aria-label={label}
        className="h-12 text-base"
        onChange={(event) => onChange(sanitizeDecimalDraft(event.target.value))}
      />
    </div>
  );
}

function draftNumber(value: number): string {
  return value > 0 ? String(value) : "";
}

function readNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

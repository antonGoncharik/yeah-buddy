"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import { calcMacrosFromPer100, formatKcal, formatMacro } from "@/lib/nutrition";

const QUICK_GRAMS = [10, 50, 100, 150, 200, 250, 300, 400];

export function GramsScreen({
  name,
  protein,
  fat,
  carbs,
  kcal,
  initialGrams,
  defaultPortionG,
  defaultPortionLabel,
  save,
  backHref,
}: {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  initialGrams: number;
  defaultPortionG: number | null;
  defaultPortionLabel: string | null;
  save: (grams: number) => Promise<void>;
  backHref: string;
}) {
  const router = useRouter();
  const [gramsInput, setGramsInput] = useState(String(initialGrams));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const grams = Number(gramsInput.replace(",", "."));
  const totals = useMemo(() => {
    if (!Number.isFinite(grams) || grams <= 0) {
      return null;
    }

    return calcMacrosFromPer100({ protein, fat, carbs, kcal }, grams);
  }, [carbs, fat, grams, kcal, protein]);

  async function onSave() {
    if (!Number.isFinite(grams) || grams <= 0) {
      setError("Укажите граммы больше 0.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await save(grams);
      router.push("/today");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div>
        <p className="text-xl font-semibold">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          На 100 г: Б {formatMacro(protein)} · Ж {formatMacro(fat)} · У{" "}
          {formatMacro(carbs)} · {formatKcal(kcal)} ккал
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-base">Граммы</Label>
        <Input
          inputMode="decimal"
          value={gramsInput}
          onChange={(event) => setGramsInput(event.target.value)}
          className="h-12 text-base"
        />
      </div>

      {totals ? (
        <p className="text-base">
          Итого: Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} ·
          У {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
        </p>
      ) : null}

      <div className="grid grid-cols-4 gap-2">
        {QUICK_GRAMS.map((value) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            className="h-11 text-base"
            onClick={() => setGramsInput(String(value))}
          >
            {value}
          </Button>
        ))}
      </div>

      {defaultPortionG ? (
        <Button
          type="button"
          variant="secondary"
          className="h-12 text-base"
          onClick={() => setGramsInput(String(defaultPortionG))}
        >
          {defaultPortionLabel
            ? `Стандартная порция · ${defaultPortionLabel}`
            : "Стандартная порция"}
        </Button>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button
        className="h-12 text-base"
        disabled={saving}
        onClick={() => void onSave()}
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={() => router.push(backHref)}
      >
        Отмена
      </Button>
    </div>
  );
}

export async function saveMealItemGrams(itemId: string, grams: number) {
  const response = await fetch(`/api/meal-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grams }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(data) ?? LOAD_FAILED);
  }
}

export async function addMealItemGrams(
  mealId: string,
  foodId: string,
  grams: number,
) {
  const response = await fetch(`/api/meals/${mealId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foodId, grams }),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(data) ?? LOAD_FAILED);
  }
}

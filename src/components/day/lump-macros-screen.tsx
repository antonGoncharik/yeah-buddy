"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FoodFormField } from "@/components/foods/food-form-fields";
import { parseNonneg } from "@/components/foods/food-form-state";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postJson } from "@/lib/api-cache";
import { LUMP_MACRO_MAX, LUMP_NAME_MAX } from "@/lib/day/lump";
import { LOAD_FAILED } from "@/lib/messages";
import { calcKcalFromMacros, formatKcal } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";

export function LumpMacrosCreate({
  mealId,
  initialName,
  backHref,
  doneHref,
}: {
  mealId: string;
  initialName: string;
  backHref: string;
  doneHref: string;
}) {
  return (
    <LumpMacrosScreen
      initialName={initialName}
      backHref={backHref}
      doneHref={doneHref}
      save={(input) => postJson(`/api/meals/${mealId}/items`, input)}
    />
  );
}

export function LumpMacrosScreen({
  initialName,
  initialProtein = "",
  initialFat = "",
  initialCarbs = "",
  save,
  backHref,
  doneHref,
  readOnly = false,
}: {
  initialName: string;
  initialProtein?: string;
  initialFat?: string;
  initialCarbs?: string;
  save?: (input: {
    name: string;
    protein: number;
    fat: number;
    carbs: number;
  }) => Promise<void>;
  backHref: string;
  doneHref: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [protein, setProtein] = useState(initialProtein);
  const [fat, setFat] = useState(initialFat);
  const [carbs, setCarbs] = useState(initialCarbs);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => {
    const nextName = name.trim();
    const nextProtein = parseNonneg(protein);
    const nextFat = parseNonneg(fat);
    const nextCarbs = parseNonneg(carbs);
    if (
      nextName === "" ||
      nextName.length > LUMP_NAME_MAX ||
      nextProtein == null ||
      nextFat == null ||
      nextCarbs == null ||
      nextProtein > LUMP_MACRO_MAX ||
      nextFat > LUMP_MACRO_MAX ||
      nextCarbs > LUMP_MACRO_MAX
    ) {
      return null;
    }
    if (nextProtein + nextFat + nextCarbs <= 0) {
      return null;
    }
    return {
      name: nextName,
      protein: nextProtein,
      fat: nextFat,
      carbs: nextCarbs,
      kcal: calcKcalFromMacros(nextProtein, nextFat, nextCarbs),
    };
  }, [carbs, fat, name, protein]);

  async function onSave() {
    if (readOnly || !save) {
      return;
    }
    if (!parsed) {
      haptic("warn");
      setError("Имя и БЖУ порции.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await save({
        name: parsed.name,
        protein: parsed.protein,
        fat: parsed.fat,
        carbs: parsed.carbs,
      });
      haptic("success");
      router.push(doneHref);
      router.refresh();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-28">
      <p className="text-base leading-relaxed text-muted-foreground">
        Сколько съел в этой порции. В продукты не попадёт.
      </p>
      <FoodFormField label="Что это">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 text-base"
          readOnly={readOnly}
          maxLength={LUMP_NAME_MAX}
        />
      </FoodFormField>
      <div className="grid grid-cols-3 gap-3">
        <FoodFormField label="Белки">
          <Input
            inputMode="decimal"
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
            className="h-12 text-base"
            readOnly={readOnly}
          />
        </FoodFormField>
        <FoodFormField label="Жиры">
          <Input
            inputMode="decimal"
            value={fat}
            onChange={(event) => setFat(event.target.value)}
            className="h-12 text-base"
            readOnly={readOnly}
          />
        </FoodFormField>
        <FoodFormField label="Угли">
          <Input
            inputMode="decimal"
            value={carbs}
            onChange={(event) => setCarbs(event.target.value)}
            className="h-12 text-base"
            readOnly={readOnly}
          />
        </FoodFormField>
      </div>
      <p className="text-lg font-semibold tabular-nums">
        {parsed ? `${formatKcal(parsed.kcal)} ккал` : "ккал посчитаются"}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <StickyActions>
        {readOnly || !save ? null : (
          <Button
            type="button"
            className="h-14 w-full text-lg"
            disabled={saving}
            onClick={() => void onSave()}
          >
            Записать
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full text-base"
          onClick={() => router.push(readOnly ? doneHref : backHref)}
        >
          Назад
        </Button>
      </StickyActions>
    </div>
  );
}

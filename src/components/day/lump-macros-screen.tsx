"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { addLumpMealItem } from "@/components/day/grams-save";
import { FoodFormField } from "@/components/foods/food-form-fields";
import { parseNonneg } from "@/components/foods/food-form-state";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LUMP_MACRO_MAX, LUMP_NAME_MAX } from "@/lib/day/lump";
import { handleNumericEnter } from "@/lib/form/field-nav";
import { calcKcalFromMacros, formatKcal } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";

export function LumpMacrosCreate({
  mealId,
  date,
  initialName,
  backHref,
  doneHref,
}: {
  mealId: string;
  date: string;
  initialName: string;
  backHref: string;
  doneHref: string;
}) {
  return (
    <LumpMacrosScreen
      initialName={initialName}
      backHref={backHref}
      doneHref={doneHref}
      save={async (input) => {
        await addLumpMealItem({ mealId, date, input });
      }}
    />
  );
}

export function LumpMacrosScreen({
  initialName,
  initialProtein = "",
  initialFat = "",
  initialCarbs = "",
  save,
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
      setError("Заполни название и белки, жиры, углеводы.");
      return;
    }

    setError(null);
    haptic("commit");
    const pending = save({
      name: parsed.name,
      protein: parsed.protein,
      fat: parsed.fat,
      carbs: parsed.carbs,
    });
    router.push(doneHref);
    void pending;
  }

  return (
    <form
      className="flex flex-col gap-5 px-4 pb-28"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        Сколько белков, жиров и углеводов в этой порции. Разовая запись — в
        список продуктов не попадёт.
      </p>
      <FoodFormField label="Что это">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={readOnly ? undefined : handleNumericEnter}
          className="h-12 text-base"
          readOnly={readOnly}
          maxLength={LUMP_NAME_MAX}
          placeholder="Бургер, шаурма…"
          enterKeyHint="next"
          autoComplete="off"
          autoFocus={!readOnly && initialName.trim() === ""}
        />
      </FoodFormField>
      <div className="grid grid-cols-3 gap-3">
        <FoodFormField label="Белки">
          <Input
            inputMode="decimal"
            enterKeyHint="next"
            value={protein}
            onChange={(event) => setProtein(event.target.value)}
            onKeyDown={readOnly ? undefined : handleNumericEnter}
            className="h-12 text-base"
            readOnly={readOnly}
            autoFocus={!readOnly && initialName.trim() !== ""}
          />
        </FoodFormField>
        <FoodFormField label="Жиры">
          <Input
            inputMode="decimal"
            enterKeyHint="next"
            value={fat}
            onChange={(event) => setFat(event.target.value)}
            onKeyDown={readOnly ? undefined : handleNumericEnter}
            className="h-12 text-base"
            readOnly={readOnly}
          />
        </FoodFormField>
        <FoodFormField label="Углеводы">
          <Input
            inputMode="decimal"
            enterKeyHint="done"
            value={carbs}
            onChange={(event) => setCarbs(event.target.value)}
            onKeyDown={readOnly ? undefined : handleNumericEnter}
            className="h-12 text-base"
            readOnly={readOnly}
          />
        </FoodFormField>
      </div>
      <p className="text-lg font-semibold tabular-nums">
        {parsed ? `${formatKcal(parsed.kcal)} ккал` : "ккал посчитаются"}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {readOnly || !save ? null : (
        <StickyActions>
          <Button type="submit" className="h-14 w-full text-lg">
            Записать
          </Button>
        </StickyActions>
      )}
    </form>
  );
}

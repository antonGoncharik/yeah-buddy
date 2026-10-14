"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GramChips } from "@/components/day/gram-chips";
import { saveMealItemGrams } from "@/components/day/grams-save";
import { PortionHistoryChips } from "@/components/day/portion-history-chips";
import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { GramsStepperInput } from "@/components/ui/grams-stepper";
import { formatYieldGrams, parseGramsInput } from "@/lib/food/yield";
import { calcMacrosFromPer100, formatKcal, formatMacro } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { MealItem } from "@/lib/types";

export function MealGramsSheet({
  item,
  date,
  itemHref,
  onClose,
}: {
  item: MealItem;
  date: string;
  itemHref: string;
  onClose: () => void;
}) {
  const [gramsInput, setGramsInput] = useState(formatYieldGrams(item.grams));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const grams = parseGramsInput(gramsInput);
  const totals = useMemo(() => {
    if (grams == null) {
      return null;
    }
    return calcMacrosFromPer100(item.per_100_snapshot, grams);
  }, [grams, item.per_100_snapshot]);

  async function saveGrams(value: number) {
    if (saving) {
      return;
    }
    if (value === item.grams) {
      onClose();
      return;
    }
    setGramsInput(formatYieldGrams(value));
    setSaving(true);
    setError(null);
    try {
      await saveMealItemGrams({ date, item, grams: value });
      haptic("commit");
      onClose();
    } catch (caught) {
      haptic("error");
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Не сохранилось.");
    }
  }

  async function onSave() {
    if (grams == null || saving) {
      haptic("warn");
      setError("Напиши граммы.");
      return;
    }
    if (grams === item.grams) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveMealItemGrams({ date, item, grams });
      haptic("commit");
      onClose();
    } catch (caught) {
      haptic("error");
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Не сохранилось.");
    }
  }

  return (
    <SheetFrame title={item.name_snapshot} onCancel={onClose}>
      <GramsStepperInput
        value={gramsInput}
        onChange={(value) => {
          setGramsInput(value);
          setError(null);
        }}
        aria-invalid={error ? true : undefined}
      />
      <p className="text-sm text-muted-foreground tabular-nums">
        {totals
          ? `${formatKcal(totals.kcal)} ккал · Б ${formatMacro(totals.protein)} · Ж ${formatMacro(totals.fat)} · У ${formatMacro(totals.carbs)}`
          : "Напиши граммы"}
      </p>
      {item.food_id ? (
        <PortionHistoryChips
          foodId={item.food_id}
          onPick={(value) => void saveGrams(value)}
        />
      ) : null}
      <GramChips
        onPick={(value) => {
          setGramsInput(formatYieldGrams(value));
          setError(null);
        }}
      />
      {error ? (
        <p className="text-base leading-snug text-destructive">{error}</p>
      ) : null}
      <Button
        type="button"
        className="h-12 w-full text-base"
        disabled={saving}
        onClick={() => void onSave()}
      >
        {saving ? "Сохраняю…" : "Записать"}
      </Button>
      <Link
        href={itemHref}
        className="py-2 text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
        onClick={onClose}
      >
        Порция и ужарка
      </Link>
    </SheetFrame>
  );
}
